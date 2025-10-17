// From javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDreamSchema, insertInterpretationSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

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
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.json([]); // Free users have no stored dreams
      }

      const dreams = await storage.getUserDreams(userId);
      res.json(dreams);
    } catch (error) {
      console.error("Error fetching dreams:", error);
      res.status(500).json({ message: "Failed to fetch dreams" });
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

      // Create subscription - For now, we'll return a setup intent for the frontend
      // The actual price will be configured in the Stripe dashboard
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: 'price_dreamlens_premium', // Placeholder - will be configured in Stripe dashboard
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

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
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
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

  const httpServer = createServer(app);

  return httpServer;
}
