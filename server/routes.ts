// From javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDreamSchema, insertInterpretationSchema, insertFeedbackSchema, users, feedback, interpretations } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { interpretDream } from "./ai-interpreter";

// Initialize Stripe (from javascript_stripe blueprint)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (from blueprint)
  await setupAuth(app);

  // Auth routes (from blueprint)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  /**
   * POST /api/interpret - AI Dream Interpretation Endpoint
   * 
   * This is the core dream analysis API that processes user dreams through Claude AI.
   * It's the primary interface between the frontend and the AI interpretation service.
   * 
   * Authentication: REQUIRED
   * - Uses isAuthenticated middleware (Replit Auth via OIDC)
   * - Rejects unauthenticated requests with 401
   * - User must be logged in to access AI interpretation
   * 
   * Request Body:
   * {
   *   dreamText: string,        // The dream description (required, min 10 chars)
   *   context?: {                // Optional contextual information
   *     stress?: string,         // Current stress level ("high", "moderate", "low")
   *     emotion?: string         // Primary emotion ("anxious", "happy", "sad", etc.)
   *   },
   *   analysisType?: string      // 'quick_insight' (default, free) or 'deep_dive' (premium)
   * }
   * 
   * Response (200 OK):
   * {
   *   interpretation: string,    // Main analysis text
   *   symbols: string[],         // Key symbolic elements
   *   emotions: string[],        // Detected emotional themes
   *   themes: string[],          // Overarching psychological themes
   *   confidence: number,        // AI confidence score (0-100)
   *   analysisType: string       // Analysis mode used
   * }
   * 
   * Error Responses:
   * - 400: Invalid input (dream text too short)
   * - 403: Premium feature accessed by free user
   * - 500: AI service error or internal server error
   * 
   * Business Logic:
   * 1. Validate input (minimum dream length)
   * 2. Check premium access for Deep Dive
   * 3. Call AI interpretation service
   * 4. Return structured analysis
   * 
   * Performance Characteristics:
   * - Quick Insight: ~5-15 seconds response time
   * - Deep Dive: ~15-30 seconds response time
   * - No caching (each dream is unique)
   * - Stateless (no session dependency beyond auth)
   * 
   * Freemium Model Implementation:
   * - Free users: Quick Insight only (1000 tokens, faster, lower cost)
   * - Premium users: Both modes available (Deep Dive unlocked)
   * - Billing handled by Stripe (see /api/subscribe routes)
   * 
   * Security Considerations:
   * - Authentication verified before processing
   * - User data never logged (privacy-focused)
   * - API key secured in environment variables
   * - No PII in Claude requests beyond dream text
   * - Rate limiting handled at Anthropic API level
   */
  app.post("/api/interpret", isAuthenticated, async (req: any, res) => {
    try {
      // Extract request parameters from body
      // Destructuring for cleaner code and type safety
      const { dreamText, context, analysisType } = req.body;
      
      // Get authenticated user ID from Replit Auth session
      // req.user.claims.sub is the unique user identifier from OIDC token
      const userId = req.user.claims.sub;
      
      // Fetch full user record to check premium status
      // This database query is necessary to enforce premium feature gating
      // Alternative: Could cache user object in session, but DB is source of truth
      const user = await storage.getUser(userId);
      
      /**
       * Input Validation: Dream Text Length
       * 
       * Minimum Length (10 chars):
       * - Too short: Can't extract meaningful symbols/themes
       * - AI struggles with context from very brief input
       * - Prevents spam/abuse (empty or "test" submissions)
       * - 10 chars allows "I was flying" (minimal valid dream)
       * 
       * Maximum Length (3500 chars):
       * - Conservative limit ensures sufficient response token budget
       * - Token math (Quick Insight with 1600 max_tokens):
       *   • 3500 chars ≈ 875 tokens (dream text)
       *   • System prompt ≈ 300 tokens
       *   • User prompt ≈ 100 tokens
       *   • Total input ≈ 1275 tokens
       *   • Response budget: 1600 max_tokens (plenty of headroom)
       *   • Safety margin: ~325 tokens buffer
       * - Deep Dive: 2000 max_tokens handles even larger inputs comfortably
       * - Protects against abuse (extremely long inputs waste API credits)
       * - Average dream description: 200-800 characters
       * - 3500 chars = ~700 words (very detailed dream description)
       * 
       * Validation Strategy:
       * - Check both null/undefined AND empty string
       * - .trim() removes whitespace (prevents "     " bypass)
       * - Early return with 400 (client error, not server error)
       * - Clear error message guides user to fix input
       */
      if (!dreamText || dreamText.trim().length < 10) {
        return res.status(400).json({ message: "Dream text must be at least 10 characters" });
      }
      
      if (dreamText.trim().length > 3500) {
        return res.status(400).json({ 
          message: "Dream text is too long. Please keep it under 3500 characters for best results."
        });
      }

      /**
       * Premium Feature Gating: Deep Dive Analysis
       * 
       * Freemium Business Model:
       * - Free tier: Quick Insight analysis (limited but valuable)
       * - Premium tier ($9.99/month): Unlocks Deep Dive (comprehensive)
       * 
       * Why gate Deep Dive?
       * - Higher API cost (2000 vs 1000 tokens)
       * - Longer processing time (30s vs 10s)
       * - More valuable output (multi-perspective analysis)
       * - Incentivizes subscriptions (conversion funnel)
       * 
       * Implementation:
       * - Check user.isPremium flag (set by Stripe webhook)
       * - Return 403 Forbidden (not 401 - user IS authenticated)
       * - Include upgradeUrl in response (conversion optimization)
       * - Allow Quick Insight to proceed regardless (free tier value)
       * 
       * Edge Cases:
       * - analysisType undefined/null → defaults to 'quick_insight' (free)
       * - user object null → .isPremium is undefined → treated as false
       * - Premium user with expired subscription → webhook sets isPremium=false
       */
      if (analysisType === 'deep_dive' && !user?.isPremium) {
        return res.status(403).json({ 
          message: "Premium subscription required for Deep Dive analysis",
          upgradeUrl: "/subscribe"  // Frontend can redirect for easy upgrade
        });
      }

      /**
       * AI Interpretation Service Call
       * 
       * Delegation to ai-interpreter module for separation of concerns:
       * - Routes handle HTTP concerns (auth, validation, responses)
       * - AI service handles Claude API interaction and parsing
       * - Clean architecture enables independent testing/updates
       * 
       * Parameter Handling:
       * - dreamText: Already validated (min length, trimmed)
       * - context: Optional, defaults to {} if undefined (safe for AI service)
       * - analysisType: Defaults to 'quick_insight' if not specified
       * 
       * Why await?
       * - AI service is async (HTTP call to Anthropic)
       * - Must wait for response before sending to client
       * - Errors thrown by interpretDream caught by try/catch
       * 
       * Performance Note:
       * - This blocks the request thread (acceptable for API route)
       * - Each request independent (no shared state concerns)
       * - Node.js event loop handles concurrent requests efficiently
       */
      const interpretation = await interpretDream(
        dreamText,
        context || {},
        analysisType || 'quick_insight'
      );

      /**
       * Auto-Save for All Users (with Free Tier Limits)
       * 
       * NEW FEATURE: Save dreams + interpretations for ALL users
       * - Free users: Max 3 dreams (creates habit loop before paywall)
       * - Premium users: Unlimited dreams
       * 
       * Why auto-save?
       * - Users invest emotional labor in describing dreams
       * - Losing data creates frustration and abandonment
       * - Seeing past dreams encourages return visits
       * - Creates upgrade urgency when approaching limit
       */
      if (req.isAuthenticated()) {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          
          // Check free tier limit
          if (!user?.isPremium) {
            const existingDreams = await storage.getUserDreams(userId);
            if (existingDreams.length >= 3) {
              // Don't block interpretation - just don't save
              // Return success with warning flag
              return res.json({
                ...interpretation,
                saved: false,
                limitReached: true,
                message: "You've saved 3 dreams. Upgrade for unlimited storage!"
              });
            }
          }
          
          // Save dream
          const dream = await storage.createDream({
            userId,
            content: dreamText,
            mood: context.mood || null,
            stressLevel: context.stressLevel || null,
          });
          
          // Save interpretation linked to dream (with monitoring metrics + RAG citations)
          const savedInterpretation = await storage.createInterpretation({
            userId,
            dreamId: dream.id,
            analysisType: analysisType || 'quick_insight',
            interpretation: interpretation.interpretation,
            symbols: interpretation.symbols || [],
            emotions: interpretation.emotions || [],
            themes: interpretation.themes || [],
            confidence: interpretation.confidence || 0,
            // RAG System: Store research paper citations for transparency
            citations: interpretation.citations || [],
            // AIE8 Dimension 7: Store monitoring metrics for performance tracking
            tokensUsed: interpretation.metrics.tokensUsed,
            latencyMs: interpretation.metrics.latencyMs,
            costUsd: interpretation.metrics.costUsd,
            modelVersion: interpretation.metrics.modelVersion,
            status: interpretation.metrics.status,
            errorMessage: interpretation.metrics.errorMessage,
          });
          
          return res.json({
            ...interpretation,
            id: savedInterpretation.id, // Include interpretation ID for feedback linking
            saved: true,
            dreamId: dream.id,
          });
        } catch (saveError) {
          // Log but don't fail - interpretation still succeeded
          console.error("Failed to auto-save dream:", saveError);
          // Return interpretation without saving
          return res.json({
            ...interpretation,
            saved: false,
          });
        }
      }
      
      /**
       * Success Response (Unauthenticated Users)
       * 
       * Return interpretation without saving
       * Unauthenticated users get ephemeral interpretations
       */
      res.json(interpretation);
      
    } catch (error: any) {
      /**
       * Error Handling and Logging (AIE8 Dimension 7: Monitoring)
       * 
       * Centralized error handling for all failure scenarios:
       * - AI service errors (authentication, rate limits, parsing)
       * - Database errors (user lookup failure)
       * - Network errors (Anthropic API unreachable)
       * - Unexpected exceptions (bugs)
       * 
       * Enhanced Logging Strategy:
       * 1. Console logging (captured by Replit logs)
       * 2. Database error logging (structured error table for analytics)
       * 3. Full error context (stack trace, request details)
       * 4. Privacy-safe (never log dream content or PII)
       * 
       * Monitoring Benefits:
       * - Track 500 error rate (indicator of AI service health)
       * - Alert on sustained elevated errors (service degradation)
       * - Pattern analysis (which errors are most common?)
       * - User impact tracking (which users experiencing issues?)
       */
      console.error("Interpretation error:", error);
      
      // Log error to database for structured monitoring (AIE8 Dimension 7)
      try {
        const userId = req.user?.claims?.sub || null;
        await storage.logError({
          userId,
          errorType: error.status === 401 ? 'AuthenticationError' : 
                     error.status === 429 ? 'RateLimitError' :
                     error.type === 'api_error' ? 'APIError' :
                     'InterpretationError',
          errorMessage: error.message || 'Failed to interpret dream',
          stackTrace: error.stack || null,
          context: {
            endpoint: '/api/interpret',
            analysisType: req.body?.analysisType || 'quick_insight',
            dreamLength: req.body?.dreamText?.length || 0,
            errorStatus: error.status || 500,
            errorType: error.type || 'unknown'
          }
        });
      } catch (logError) {
        // Don't let error logging failure break the response
        console.error("Failed to log error to database:", logError);
      }
      
      res.status(500).json({ message: error.message || "Failed to interpret dream" });
    }
  });

  // Dream routes (protected - premium users only for storage)
  app.post("/api/dreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required to save dreams" });
      }

      const dreamData = insertDreamSchema.parse({ ...req.body, userId });
      const dream = await storage.createDream(dreamData);
      res.json(dream);
    } catch (error: any) {
      console.error("Error creating dream:", error);
      res.status(400).json({ message: error.message || "Failed to create dream" });
    }
  });

  app.get("/api/dreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // NEW: All users can access their saved dreams (free tier: max 3)
      const dreams = await storage.getUserDreams(userId);
      res.json(dreams);
    } catch (error) {
      console.error("Error fetching dreams:", error);
      res.status(500).json({ message: "Failed to fetch dreams" });
    }
  });

  // Dream stats endpoint (for showing "2/3 dreams saved" indicator)
  app.get("/api/dreams/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const dreams = await storage.getUserDreams(userId);
      
      res.json({
        count: dreams.length,
        limit: user?.isPremium ? null : 3, // null = unlimited for premium
        isPremium: user?.isPremium || false,
      });
    } catch (error) {
      console.error("Error fetching dream stats:", error);
      res.status(500).json({ message: "Failed to fetch dream stats" });
    }
  });

  app.get("/api/dreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(dream);
    } catch (error) {
      console.error("Error fetching dream:", error);
      res.status(500).json({ message: "Failed to fetch dream" });
    }
  });

  app.delete("/api/dreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteDream(req.params.id);
      res.json({ message: "Dream deleted" });
    } catch (error) {
      console.error("Error deleting dream:", error);
      res.status(500).json({ message: "Failed to delete dream" });
    }
  });

  // Interpretation routes (protected)
  app.post("/api/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if Deep Dive requires premium
      if (req.body.analysisType === 'deep_dive' && !user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required for Deep Dive analysis" });
      }

      const interpretationData = insertInterpretationSchema.parse({ ...req.body, userId });
      const interpretation = await storage.createInterpretation(interpretationData);
      res.json(interpretation);
    } catch (error: any) {
      console.error("Error creating interpretation:", error);
      res.status(400).json({ message: error.message || "Failed to create interpretation" });
    }
  });

  app.get("/api/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.json([]); // Free users have no stored interpretations
      }

      const interpretations = await storage.getUserInterpretations(userId);
      res.json(interpretations);
    } catch (error) {
      console.error("Error fetching interpretations:", error);
      res.status(500).json({ message: "Failed to fetch interpretations" });
    }
  });

  app.get("/api/dreams/:dreamId/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.dreamId);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const interpretations = await storage.getDreamInterpretations(req.params.dreamId);
      res.json(interpretations);
    } catch (error) {
      console.error("Error fetching interpretations:", error);
      res.status(500).json({ message: "Failed to fetch interpretations" });
    }
  });

  // Stripe subscription routes (from javascript_stripe blueprint)
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if Stripe Price ID is configured
      const stripePriceId = process.env.STRIPE_PRICE_ID;
      if (!stripePriceId) {
        console.error("❌ STRIPE_PRICE_ID environment variable not configured");
        return res.status(500).json({ 
          message: "Stripe subscription not configured. Please contact support or set up STRIPE_PRICE_ID in environment variables.",
          errorType: "config_missing"
        });
      }

      // If user already has a subscription, return it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        metadata: {
          userId: user.id,
        },
      });

      // Create subscription with configured price ID
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: stripePriceId, // Use price ID from environment variable
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Extract client secret from payment intent
      let clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
      
      // If no client secret, manually create a payment intent for the invoice
      if (!clientSecret && subscription.latest_invoice) {
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
        if (invoice && !(invoice as any).payment_intent) {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: invoice.amount_due,
            currency: 'usd',
            customer: customer.id,
            metadata: {
              subscription_id: subscription.id,
              invoice_id: invoice.id,
            },
          });
          clientSecret = paymentIntent.client_secret;
        }
      }

      // SECURITY FIX: Only store Stripe IDs, DO NOT set isPremium yet
      // Premium status will be activated via Stripe webhook after payment confirmation
      const [updatedUser] = await db
        .update(users)
        .set({
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ message: error.message || "Failed to create subscription" });
    }
  });

  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      
      // SECURITY FIX: Clear subscription IDs and set status to allow re-subscription
      const [updatedUser] = await db
        .update(users)
        .set({
          isPremium: false,
          stripeSubscriptionId: null,
          subscriptionStatus: 'canceled',
          subscriptionEndDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({ message: "Subscription canceled successfully" });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(400).json({ message: error.message || "Failed to cancel subscription" });
    }
  });

  // Stripe webhook handler for payment confirmation
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe signature');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;
          
          // Find user by subscription ID and activate premium
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscriptionId));
            
          if (user) {
            await db
              .update(users)
              .set({
                isPremium: true,
                subscriptionStatus: 'active',
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id));
          }
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;
          
          // Update subscription status to past_due
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscriptionId));
            
          if (user) {
            await db
              .update(users)
              .set({
                subscriptionStatus: 'past_due',
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id));
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          
          // Deactivate premium when subscription is deleted
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscription.id));
            
          if (user) {
            await db
              .update(users)
              .set({
                isPremium: false,
                subscriptionStatus: 'canceled',
                subscriptionEndDate: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id));
          }
          break;
        }
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  /**
   * ===========================================================================
   * FEEDBACK ENDPOINTS - AIE8 Dimension 6: Evaluation
   * ===========================================================================
   * 
   * These endpoints power the user feedback system for quality evaluation.
   * Critical for measuring interpretation quality, guiding improvements,
   * and creating fine-tuning datasets.
   */

  /**
   * POST /api/feedback - Submit User Feedback
   * 
   * Allows users to rate interpretations they've received.
   * Feedback is used for quality metrics, A/B testing, and fine-tuning.
   * 
   * Authentication: REQUIRED
   * 
   * Request Body:
   * {
   *   interpretationId: string,         // UUID of interpretation being rated
   *   thumbsUp?: boolean,                // Quick feedback (true=👍, false=👎)
   *   rating?: number,                   // Star rating (1-5)
   *   feedbackText?: string,             // Optional written feedback
   *   clarityRating?: number,            // Clarity dimension (1-5)
   *   accuracyRating?: number,           // Accuracy dimension (1-5)
   *   usefulnessRating?: number          // Usefulness dimension (1-5)
   * }
   * 
   * Response (201 Created):
   * {
   *   id: string,                        // Feedback record ID
   *   interpretationId: string,
   *   userId: string,
   *   thumbsUp: boolean | null,
   *   rating: number | null,
   *   feedbackText: string | null,
   *   clarityRating: number | null,
   *   accuracyRating: number | null,
   *   usefulnessRating: number | null,
   *   createdAt: Date
   * }
   * 
   * Error Responses:
   * - 400: Invalid input (rating out of range, missing interpretation ID)
   * - 401: Not authenticated
   * - 404: Interpretation not found or doesn't belong to user
   * - 409: Feedback already exists (use PUT to update)
   * - 500: Database error
   * 
   * Business Logic:
   * 1. Validate user is authenticated
   * 2. Verify interpretation exists and belongs to user
   * 3. Validate rating ranges (1-5)
   * 4. Check if feedback already exists (prevent duplicates)
   * 5. Store feedback in database
   * 
   * Note: To update existing feedback, use PUT /api/feedback/:id
   */
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        userId  // Inject userId from auth
      });
      
      // Verify interpretation exists and belongs to user
      const [interpretation] = await db
        .select()
        .from(interpretations)
        .where(eq(interpretations.id, validatedData.interpretationId))
        .limit(1);
      
      if (!interpretation) {
        return res.status(404).json({ 
          error: 'Interpretation not found' 
        });
      }
      
      if (interpretation.userId !== userId) {
        return res.status(403).json({ 
          error: 'Cannot provide feedback on another user\'s interpretation' 
        });
      }
      
      // Check if feedback already exists for this interpretation + user
      const [existingFeedback] = await db
        .select()
        .from(feedback)
        .where(eq(feedback.interpretationId, validatedData.interpretationId))
        .limit(1);
      
      if (existingFeedback) {
        return res.status(409).json({
          error: 'Feedback already exists for this interpretation. Use PUT /api/feedback/' + existingFeedback.id + ' to update.',
          feedbackId: existingFeedback.id
        });
      }
      
      // Insert feedback
      const [newFeedback] = await db
        .insert(feedback)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newFeedback);
      
    } catch (error: any) {
      console.error('Error creating feedback:', error);
      
      // Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid feedback data',
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to save feedback' });
    }
  });

  /**
   * PUT /api/feedback/:id - Update Existing Feedback
   * 
   * Allows users to update their previously submitted feedback.
   * Useful when users want to revise their rating after reflection.
   * 
   * Authentication: REQUIRED
   * 
   * Request Parameters:
   * - id: string - UUID of feedback record to update
   * 
   * Request Body (all fields optional):
   * {
   *   thumbsUp?: boolean,                // Quick feedback (true=👍, false=👎)
   *   rating?: number,                   // Star rating (1-5)
   *   feedbackText?: string,             // Optional written feedback
   *   clarityRating?: number,            // Clarity dimension (1-5)
   *   accuracyRating?: number,           // Accuracy dimension (1-5)
   *   usefulnessRating?: number          // Usefulness dimension (1-5)
   * }
   * 
   * Response (200 OK):
   * {
   *   id: string,                        // Feedback record ID
   *   interpretationId: string,
   *   userId: string,
   *   thumbsUp: boolean | null,
   *   rating: number | null,
   *   feedbackText: string | null,
   *   clarityRating: number | null,
   *   accuracyRating: number | null,
   *   usefulnessRating: number | null,
   *   createdAt: Date
   * }
   * 
   * Error Responses:
   * - 400: Invalid input (rating out of range)
   * - 401: Not authenticated
   * - 403: Feedback belongs to another user
   * - 404: Feedback not found
   * - 500: Database error
   * 
   * Business Logic:
   * 1. Validate user is authenticated
   * 2. Verify feedback exists
   * 3. Verify feedback belongs to user
   * 4. Validate rating ranges (1-5)
   * 5. Update only provided fields (partial update)
   */
  app.put('/api/feedback/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackId = req.params.id;
      
      // Validate rating ranges (if provided)
      const updateData: any = {};
      if (req.body.thumbsUp !== undefined) updateData.thumbsUp = req.body.thumbsUp;
      if (req.body.rating !== undefined) {
        const rating = parseInt(req.body.rating);
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        updateData.rating = rating;
      }
      if (req.body.feedbackText !== undefined) updateData.feedbackText = req.body.feedbackText;
      if (req.body.clarityRating !== undefined) {
        const clarityRating = parseInt(req.body.clarityRating);
        if (clarityRating < 1 || clarityRating > 5) {
          return res.status(400).json({ error: 'Clarity rating must be between 1 and 5' });
        }
        updateData.clarityRating = clarityRating;
      }
      if (req.body.accuracyRating !== undefined) {
        const accuracyRating = parseInt(req.body.accuracyRating);
        if (accuracyRating < 1 || accuracyRating > 5) {
          return res.status(400).json({ error: 'Accuracy rating must be between 1 and 5' });
        }
        updateData.accuracyRating = accuracyRating;
      }
      if (req.body.usefulnessRating !== undefined) {
        const usefulnessRating = parseInt(req.body.usefulnessRating);
        if (usefulnessRating < 1 || usefulnessRating > 5) {
          return res.status(400).json({ error: 'Usefulness rating must be between 1 and 5' });
        }
        updateData.usefulnessRating = usefulnessRating;
      }
      
      // Check if any fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }
      
      // Verify feedback exists and belongs to user
      const [existingFeedback] = await db
        .select()
        .from(feedback)
        .where(eq(feedback.id, feedbackId))
        .limit(1);
      
      if (!existingFeedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      
      if (existingFeedback.userId !== userId) {
        return res.status(403).json({ error: 'Cannot update another user\'s feedback' });
      }
      
      // Update feedback
      const [updatedFeedback] = await db
        .update(feedback)
        .set(updateData)
        .where(eq(feedback.id, feedbackId))
        .returning();
      
      res.json(updatedFeedback);
      
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ error: 'Failed to update feedback' });
    }
  });

  /**
   * GET /api/feedback/stats - Evaluation Dashboard Metrics
   * 
   * Returns aggregated feedback metrics for quality monitoring.
   * Used in evaluation dashboard to track interpretation quality over time.
   * 
   * Authentication: REQUIRED
   * 
   * Query Parameters:
   * - timeframe?: string - 'day', 'week', 'month', 'all' (default: 'week')
   * - analysisType?: string - 'quick_insight', 'deep_dive', or omit for all
   * 
   * Response (200 OK):
   * {
   *   overview: {
   *     totalFeedback: number,           // Total feedback count
   *     avgRating: number,                // Average star rating (1-5)
   *     thumbsUpRate: number,             // Percentage of thumbs up
   *     avgClarityRating: number,         // Average clarity score
   *     avgAccuracyRating: number,        // Average accuracy score
   *     avgUsefulnessRating: number       // Average usefulness score
   *   },
   *   byAnalysisType: {
   *     quick_insight: {
   *       count: number,
   *       avgRating: number,
   *       thumbsUpRate: number
   *     },
   *     deep_dive: {
   *       count: number,
   *       avgRating: number,
   *       thumbsUpRate: number
   *     }
   *   },
   *   recentFeedback: [{                  // Last 10 feedback items
   *     id: string,
   *     rating: number,
   *     thumbsUp: boolean,
   *     feedbackText: string,
   *     createdAt: Date
   *   }],
   *   qualityTrend: [{                    // Daily avg ratings (last 30 days)
   *     date: string,
   *     avgRating: number,
   *     count: number
   *   }]
   * }
   * 
   * Error Responses:
   * - 401: Not authenticated
   * - 500: Database error
   * 
   * Use Cases:
   * - Monitor interpretation quality over time
   * - Compare Quick Insight vs. Deep Dive quality
   * - Identify quality degradation (model drift)
   * - Track user satisfaction trends
   * - Prioritize prompt engineering improvements
   */
  app.get('/api/feedback/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeframe = (req.query.timeframe as string) || 'week';
      const analysisType = req.query.analysisType as string | undefined;
      
      // Calculate time filter
      let timeFilter = new Date();
      switch (timeframe) {
        case 'day':
          timeFilter.setDate(timeFilter.getDate() - 1);
          break;
        case 'week':
          timeFilter.setDate(timeFilter.getDate() - 7);
          break;
        case 'month':
          timeFilter.setMonth(timeFilter.getMonth() - 1);
          break;
        case 'all':
        default:
          timeFilter = new Date(0); // Beginning of time
      }
      
      // Get all feedback for user's interpretations
      const userFeedback = await db
        .select({
          id: feedback.id,
          interpretationId: feedback.interpretationId,
          thumbsUp: feedback.thumbsUp,
          rating: feedback.rating,
          feedbackText: feedback.feedbackText,
          clarityRating: feedback.clarityRating,
          accuracyRating: feedback.accuracyRating,
          usefulnessRating: feedback.usefulnessRating,
          createdAt: feedback.createdAt,
          analysisType: interpretations.analysisType,
        })
        .from(feedback)
        .innerJoin(interpretations, eq(feedback.interpretationId, interpretations.id))
        .where(eq(interpretations.userId, userId));
      
      // Filter by timeframe and analysis type
      const filteredFeedback = userFeedback.filter(f => {
        const matchesTime = new Date(f.createdAt) >= timeFilter;
        const matchesType = !analysisType || f.analysisType === analysisType;
        return matchesTime && matchesType;
      });
      
      // Calculate overview metrics
      const totalFeedback = filteredFeedback.length;
      const ratingsProvided = filteredFeedback.filter(f => f.rating !== null);
      const thumbsUpCount = filteredFeedback.filter(f => f.thumbsUp === true).length;
      const thumbsTotal = filteredFeedback.filter(f => f.thumbsUp !== null).length;
      
      const avgRating = ratingsProvided.length > 0
        ? ratingsProvided.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsProvided.length
        : 0;
      
      const thumbsUpRate = thumbsTotal > 0
        ? (thumbsUpCount / thumbsTotal) * 100
        : 0;
      
      // Calculate dimension ratings
      const clarityRatings = filteredFeedback.filter(f => f.clarityRating !== null);
      const accuracyRatings = filteredFeedback.filter(f => f.accuracyRating !== null);
      const usefulnessRatings = filteredFeedback.filter(f => f.usefulnessRating !== null);
      
      const avgClarityRating = clarityRatings.length > 0
        ? clarityRatings.reduce((sum, f) => sum + (f.clarityRating || 0), 0) / clarityRatings.length
        : 0;
      
      const avgAccuracyRating = accuracyRatings.length > 0
        ? accuracyRatings.reduce((sum, f) => sum + (f.accuracyRating || 0), 0) / accuracyRatings.length
        : 0;
      
      const avgUsefulnessRating = usefulnessRatings.length > 0
        ? usefulnessRatings.reduce((sum, f) => sum + (f.usefulnessRating || 0), 0) / usefulnessRatings.length
        : 0;
      
      // Group by analysis type
      const quickInsightFeedback = filteredFeedback.filter(f => f.analysisType === 'quick_insight');
      const deepDiveFeedback = filteredFeedback.filter(f => f.analysisType === 'deep_dive');
      
      const calculateTypeStats = (typeFeedback: typeof filteredFeedback) => {
        const typeRatings = typeFeedback.filter(f => f.rating !== null);
        const typeThumbsUp = typeFeedback.filter(f => f.thumbsUp === true).length;
        const typeThumbsTotal = typeFeedback.filter(f => f.thumbsUp !== null).length;
        
        return {
          count: typeFeedback.length,
          avgRating: typeRatings.length > 0
            ? typeRatings.reduce((sum, f) => sum + (f.rating || 0), 0) / typeRatings.length
            : 0,
          thumbsUpRate: typeThumbsTotal > 0
            ? (typeThumbsUp / typeThumbsTotal) * 100
            : 0
        };
      };
      
      // Get recent feedback (last 10)
      const recentFeedback = filteredFeedback
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(f => ({
          id: f.id,
          rating: f.rating,
          thumbsUp: f.thumbsUp,
          feedbackText: f.feedbackText,
          createdAt: f.createdAt
        }));
      
      res.json({
        overview: {
          totalFeedback,
          avgRating: Math.round(avgRating * 10) / 10,  // Round to 1 decimal
          thumbsUpRate: Math.round(thumbsUpRate * 10) / 10,
          avgClarityRating: Math.round(avgClarityRating * 10) / 10,
          avgAccuracyRating: Math.round(avgAccuracyRating * 10) / 10,
          avgUsefulnessRating: Math.round(avgUsefulnessRating * 10) / 10,
        },
        byAnalysisType: {
          quick_insight: calculateTypeStats(quickInsightFeedback),
          deep_dive: calculateTypeStats(deepDiveFeedback),
        },
        recentFeedback,
      });
      
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({ error: 'Failed to fetch feedback statistics' });
    }
  });

  /**
   * GET /api/monitoring/metrics
   * 
   * AIE8 Dimension 7: Monitoring - System Health Metrics
   * 
   * Returns aggregated metrics across all AI interpretations for system monitoring.
   * This endpoint provides real-time insights into:
   * - System reliability (success rate)
   * - Performance (average latency)
   * - Costs (total and per-interpretation spend)
   * - Usage patterns (total interpretations, token consumption)
   * 
   * Authentication: Required (isAuthenticated middleware)
   * 
   * Response (200 OK):
   * {
   *   totalInterpretations: number,         // Total count of all interpretations
   *   successfulInterpretations: number,    // Count of successful interpretations
   *   failedInterpretations: number,        // Count of failed interpretations
   *   successRate: number,                  // Percentage (0-100) of successful interpretations
   *   avgLatencyMs: number,                 // Average response time in milliseconds
   *   totalCostUsd: number,                 // Total cost in USD across all interpretations
   *   avgCostUsd: number,                   // Average cost in USD per interpretation
   *   totalTokensUsed: number               // Total tokens consumed across all interpretations
   * }
   * 
   * Error Responses:
   * - 401: Not authenticated
   * - 500: Database error
   * 
   * Business Value:
   * - Monitor AI service costs to optimize budget
   * - Track success rate to detect service degradation
   * - Measure latency to ensure good UX (target: <3s for quick insight)
   * - Understand token usage for capacity planning
   * - Identify cost optimization opportunities
   * 
   * Use Cases:
   * - Dashboard for product owners to monitor system health
   * - Engineering alerts on degraded performance
   * - Cost tracking for business planning
   * - Capacity planning based on usage trends
   * 
   * Future Enhancements:
   * - Time-based filtering (last 24h, 7d, 30d)
   * - Per-user metrics (identify power users)
   * - Per-model metrics (compare Claude vs GPT performance)
   * - Percentile latencies (p50, p95, p99)
   */
  app.get('/api/monitoring/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const metrics = await storage.getMetricsAggregates();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching monitoring metrics:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring metrics' });
    }
  });

  /**
   * GET /api/monitoring/errors
   * 
   * AIE8 Dimension 7: Monitoring - Error Debugging
   * 
   * Returns recent errors for debugging and monitoring purposes.
   * This endpoint helps engineers:
   * - Debug production issues
   * - Identify error patterns
   * - Track error rates over time
   * - Understand which users are affected
   * 
   * Authentication: Required (isAuthenticated middleware)
   * 
   * Query Parameters:
   * - limit?: number - Number of errors to return (default: 100, max: 1000)
   * 
   * Response (200 OK):
   * [{
   *   id: string,                           // Error ID
   *   userId: string | null,                // User who experienced the error (null for unauthenticated)
   *   errorType: string,                    // Error category (AuthenticationError, RateLimitError, etc.)
   *   errorMessage: string,                 // Human-readable error message
   *   stackTrace: string | null,            // Stack trace for debugging
   *   context: object,                      // Additional context (endpoint, request details)
   *   createdAt: Date                       // When the error occurred
   * }]
   * 
   * Error Responses:
   * - 401: Not authenticated
   * - 400: Invalid limit parameter
   * - 500: Database error
   * 
   * Business Value:
   * - Rapid debugging of production issues
   * - Pattern detection (which errors are most common?)
   * - User impact tracking (which users experiencing issues?)
   * - Service health monitoring (error rate trends)
   * 
   * Use Cases:
   * - Engineering dashboard for error monitoring
   * - Debugging specific user issues
   * - Identifying systemic problems (e.g., Anthropic API outage)
   * - Alerting on elevated error rates
   * 
   * Security Considerations:
   * - Never log user PII (dream content, personal details)
   * - Stack traces are safe (controlled by our code/Anthropic)
   * - Context field should exclude sensitive data
   * 
   * Future Enhancements:
   * - Filter by error type
   * - Filter by user ID
   * - Time-based filtering
   * - Error grouping by similarity
   */
  app.get('/api/monitoring/errors', isAuthenticated, async (req: any, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: 'Invalid limit parameter' });
      }
      
      const errors = await storage.getRecentErrors(limit);
      res.json(errors);
    } catch (error) {
      console.error('Error fetching monitoring errors:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring errors' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
