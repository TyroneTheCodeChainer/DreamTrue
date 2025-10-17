/**
 * =============================================================================
 * DATABASE SCHEMA DEFINITION - DreamLens Application
 * =============================================================================
 * 
 * This file defines the structure of our PostgreSQL database using Drizzle ORM.
 * Think of this as the "blueprint" for our database tables - it tells the database
 * what kind of data we want to store and how it should be organized.
 * 
 * WHAT IS A DATABASE SCHEMA?
 * A schema is like a detailed floor plan for your database. Just like a floor plan
 * shows where rooms, doors, and walls go in a house, a schema shows where tables,
 * columns, and relationships go in a database.
 * 
 * WHY USE DRIZZLE ORM?
 * ORM (Object-Relational Mapping) tools let us write database structures using
 * TypeScript code instead of raw SQL. Benefits:
 * - Type safety: TypeScript catches errors before runtime
 * - Easier to read: Code is more descriptive than SQL
 * - Auto-completion: Your IDE helps you write code
 * - Migrations: Automatically updates database structure
 * 
 * KEY CONCEPTS FOR BEGINNERS:
 * 
 * 1. TABLE: A collection of related data (like a spreadsheet)
 *    Example: "users" table stores all user information
 * 
 * 2. COLUMN: A specific piece of data in a table (like a spreadsheet column)
 *    Example: "email" column stores user email addresses
 * 
 * 3. PRIMARY KEY: Unique identifier for each row (like a student ID number)
 *    Example: Each user has a unique "id"
 * 
 * 4. FOREIGN KEY: A reference to another table (like a pointer)
 *    Example: A dream's "userId" points to which user created it
 * 
 * 5. RELATION: How tables connect to each other
 *    Example: One user can have many dreams (one-to-many relationship)
 * 
 * 6. CASCADE DELETE: When parent is deleted, children are deleted too
 *    Example: Delete user → automatically deletes their dreams
 * 
 * =============================================================================
 */

// Import required Drizzle ORM functions
// These are the building blocks we use to define our database structure
import { sql } from 'drizzle-orm';
import {
  index,        // Creates database index for faster queries
  jsonb,        // JSON data type (stores complex objects)
  pgTable,      // Defines a PostgreSQL table
  timestamp,    // Date+time data type
  varchar,      // Variable-length text (like "email@example.com")
  text,         // Unlimited-length text (like dream descriptions)
  boolean,      // True/false data type
  integer,      // Whole number data type
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";  // Validates data before inserting
import { z } from "zod";  // Validation library

/**
 * =============================================================================
 * SESSIONS TABLE - Authentication Session Storage
 * =============================================================================
 * 
 * PURPOSE:
 * This table stores user login sessions. When you log in to a website and stay
 * logged in even after closing tabs, that's because of session storage.
 * 
 * HOW IT WORKS:
 * 1. User logs in → Server creates a session
 * 2. Session data stored in this table
 * 3. Session ID (sid) sent to browser as cookie
 * 4. Browser sends cookie with each request
 * 5. Server looks up session to know who you are
 * 
 * WHY WE NEED IT:
 * - HTTP is "stateless" (each request is independent)
 * - Sessions make HTTP "stateful" (server remembers you)
 * - More secure than storing user info in browser
 * 
 * IMPORTANT: This table is REQUIRED by Replit Auth
 * - Don't rename it
 * - Don't delete it
 * - Don't change column names
 * - It's managed automatically by the auth system
 * 
 * TECHNICAL DETAILS:
 * - Uses PostgreSQL-backed sessions (via connect-pg-simple)
 * - Sessions expire automatically (cleanup happens via index on expire column)
 * - JSONB format allows flexible session data structure
 */
export const sessions = pgTable(
  "sessions",
  {
    // sid = Session ID (like a ticket number)
    // Primary key = unique identifier, no duplicates allowed
    sid: varchar("sid").primaryKey(),
    
    // sess = Session data (user info, login time, etc.)
    // JSONB = JSON format stored efficiently in database
    // .notNull() = This field is required (can't be empty)
    sess: jsonb("sess").notNull(),
    
    // expire = When this session becomes invalid
    // Timestamp = Date + time (e.g., "2024-10-17 15:30:00")
    // Used for automatic cleanup of old sessions
    expire: timestamp("expire").notNull(),
  },
  // Table configuration function
  (table) => [
    // INDEX: Makes lookups by expire date super fast
    // Like a book index - helps find things quickly
    // Critical for session cleanup performance
    index("IDX_session_expire").on(table.expire)
  ],
);

/**
 * =============================================================================
 * USERS TABLE - Core User Accounts
 * =============================================================================
 * 
 * PURPOSE:
 * Stores all user account information including authentication data from
 * Replit Auth and premium subscription status from Stripe.
 * 
 * DATA FLOW:
 * 1. User signs up → Replit Auth creates user record
 * 2. Auth data populated (email, name, profile image)
 * 3. User upgrades → Stripe data added (customer ID, subscription ID)
 * 4. Payment succeeds → isPremium set to true via webhook
 * 
 * BUSINESS LOGIC:
 * - Free users: isPremium = false (Quick Insight only)
 * - Premium users: isPremium = true ($9.99/month, all features unlocked)
 * - Premium status controlled by Stripe webhooks (secure, server-side)
 * 
 * IMPORTANT FIELDS:
 * - id: Unique user identifier (UUID = universally unique ID)
 * - email: For login and communication
 * - isPremium: Controls feature access (the key to our freemium model)
 * - stripeCustomerId: Links to Stripe billing system
 * - subscriptionStatus: active/canceled/past_due (for admin visibility)
 */
export const users = pgTable("users", {
  // ========== CORE IDENTIFICATION ==========
  
  /**
   * id: Unique User Identifier
   * 
   * UUID (Universally Unique Identifier) Example: 
   * "550e8400-e29b-41d4-a716-446655440000"
   * 
   * Why UUID instead of auto-incrementing numbers (1, 2, 3...)?
   * - No collisions even across databases (globally unique)
   * - Can't guess other user IDs (security)
   * - Can generate client-side before database insert
   * 
   * .default(sql`gen_random_uuid()`) means:
   * - Database automatically generates ID when creating new user
   * - We don't have to provide ID ourselves
   * - Uses PostgreSQL's built-in UUID generator
   * 
   * CRITICAL: This is the blueprint default for Replit Auth
   * Don't change to serial/integer - breaks auth integration!
   */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // ========== REPLIT AUTH FIELDS ==========
  // These fields are populated by Replit's authentication system
  // when users log in with Google, GitHub, email, etc.
  
  /**
   * email: User's Email Address
   * 
   * .unique() means: No two users can have same email
   * This prevents duplicate accounts and enables "forgot password" flows
   * 
   * Example: "user@example.com"
   */
  email: varchar("email").unique(),
  
  /**
   * firstName & lastName: User's Name
   * 
   * Populated from OAuth provider (Google, GitHub, etc.)
   * Used for personalization ("Hi, Sarah!")
   * Optional - some OAuth providers don't provide names
   */
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  
  /**
   * profileImageUrl: User's Avatar
   * 
   * URL to user's profile picture from OAuth provider
   * Example: "https://avatars.githubusercontent.com/u/123456"
   * Used in UI for visual identification
   */
  profileImageUrl: varchar("profile_image_url"),
  
  // ========== PREMIUM SUBSCRIPTION FIELDS ==========
  // These fields manage our freemium business model
  
  /**
   * isPremium: Premium Access Flag
   * 
   * THIS IS THE MOST IMPORTANT FIELD FOR OUR BUSINESS MODEL!
   * 
   * Boolean (true/false) that controls feature access:
   * - false (default): Free tier
   *   → Quick Insight only
   *   → No dream saving
   *   → No journal access
   * 
   * - true: Premium tier ($9.99/month)
   *   → Quick Insight + Deep Dive
   *   → Unlimited dream saving
   *   → Full journal with search
   *   → Pattern tracking
   * 
   * .default(false) = New users start as free
   * .notNull() = This field must always have a value (true or false)
   * 
   * SECURITY: Only Stripe webhooks should set this to true
   * Never trust client requests to upgrade themselves!
   */
  isPremium: boolean("is_premium").default(false).notNull(),
  
  /**
   * stripeCustomerId: Stripe Customer Record ID
   * 
   * Links our user to their Stripe customer account
   * Example: "cus_OoPVRvS7Z4XkdN"
   * 
   * Why needed?
   * - Stripe needs this to process payments
   * - Associates payment methods with user
   * - Enables subscription management
   * 
   * Created when user first attempts to subscribe
   */
  stripeCustomerId: varchar("stripe_customer_id"),
  
  /**
   * stripeSubscriptionId: Stripe Subscription ID
   * 
   * Links to the active subscription in Stripe
   * Example: "sub_1Oa9uYJzKqVkK3Zy6sT1R9Ph"
   * 
   * Why needed?
   * - Identifies which subscription this user has
   * - Allows us to cancel/modify subscription
   * - Used in webhook event matching
   * 
   * null = No active subscription (free user)
   */
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  /**
   * subscriptionStatus: Subscription State
   * 
   * Tracks lifecycle of subscription:
   * - "active": Paying customer, all features unlocked
   * - "canceled": Subscription ended, features locked
   * - "past_due": Payment failed, grace period before lockout
   * - null: Never subscribed (free user)
   * 
   * Updated by Stripe webhooks on payment events
   * Used for admin dashboards and customer support
   */
  subscriptionStatus: varchar("subscription_status"),
  
  /**
   * subscriptionEndDate: When Subscription Ended
   * 
   * Timestamp when subscription was canceled/expired
   * Used for:
   * - Win-back campaigns ("Come back to Premium!")
   * - Analytics (churn tracking)
   * - Preventing immediate re-subscription abuse
   * 
   * null = Subscription never ended (or never started)
   */
  subscriptionEndDate: timestamp("subscription_end_date"),
  
  // ========== AUDIT TIMESTAMPS ==========
  // Track when records are created/modified for debugging
  
  /**
   * createdAt: Account Creation Timestamp
   * 
   * .defaultNow() = Automatically set to current time on creation
   * .notNull() = Always required
   * 
   * Used for:
   * - User analytics (cohort analysis)
   * - Compliance (GDPR data retention)
   * - Debugging ("When did this account start?")
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /**
   * updatedAt: Last Modification Timestamp
   * 
   * Should be updated whenever user record changes
   * Helps track when subscription status last changed
   * Useful for cache invalidation
   */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * USERS RELATIONS - How Users Connect to Other Tables
 * 
 * CONCEPT: Relations define how tables reference each other
 * Think of it like family tree relationships:
 * - One parent (user) can have many children (dreams)
 * - Each child knows their parent
 * 
 * This enables:
 * - Joining data across tables ("Get all dreams for this user")
 * - Type-safe queries (TypeScript knows the structure)
 * - Automatic eager loading (fetch related data in one query)
 */
export const usersRelations = relations(users, ({ many }) => ({
  /**
   * dreams: User's Dream Collection
   * 
   * ONE-TO-MANY relationship:
   * - One user → many dreams
   * - Each dream belongs to exactly one user
   * 
   * Query example:
   *   db.query.users.findFirst({
   *     where: eq(users.id, userId),
   *     with: { dreams: true }  // ← Includes all user's dreams
   *   })
   */
  dreams: many(dreams),
  
  /**
   * interpretations: User's Interpretation History
   * 
   * ONE-TO-MANY relationship:
   * - One user → many interpretations
   * - Tracks all AI analyses user has received
   * 
   * Why separate from dreams?
   * - One dream can have multiple interpretations (re-analyzed)
   * - Free users get interpretations without saving dreams
   * - Allows interpretation without dream context
   */
  interpretations: many(interpretations),
}));

/**
 * =============================================================================
 * DREAMS TABLE - Dream Journal Entries (Premium Feature)
 * =============================================================================
 * 
 * PURPOSE:
 * Stores dream descriptions and metadata for premium users.
 * This is the core of the dream journal feature.
 * 
 * BUSINESS RULE: Only premium users can save dreams
 * - Free users: Dreams analyzed but not saved (ephemeral)
 * - Premium users: Dreams saved to database (persistent)
 * 
 * DATA CAPTURED:
 * - Dream content (what happened in the dream)
 * - Emotional context (mood, stress level)
 * - Temporal data (when dream occurred)
 * 
 * USE CASES:
 * - Dream journaling (record dreams over time)
 * - Pattern detection (recurring themes/symbols)
 * - Historical analysis (track dream evolution)
 * - Re-interpretation (analyze same dream differently later)
 */
export const dreams = pgTable("dreams", {
  /**
   * id: Unique Dream Identifier
   * 
   * UUID format (same as users table)
   * Automatically generated by database
   * Used to reference this specific dream
   */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /**
   * userId: Who Owns This Dream
   * 
   * FOREIGN KEY: References users.id
   * Creates link between dream and its owner
   * 
   * .references(() => users.id) establishes the relationship
   * 
   * onDelete: "cascade" means:
   * - If user deleted → their dreams auto-deleted
   * - Prevents orphaned data (dreams without owners)
   * - GDPR compliance (right to be forgotten)
   * 
   * Example: userId = "550e8400-..." points to specific user
   */
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  /**
   * content: The Dream Narrative
   * 
   * TEXT data type = unlimited length
   * (vs VARCHAR which has length limit)
   * 
   * Stores full dream description:
   * - What happened
   * - Who was there
   * - Where it took place
   * - Any significant details
   * 
   * This is the raw material for AI interpretation
   * Can be thousands of characters long
   */
  content: text("content").notNull(),
  
  /**
   * mood: Emotional State Context
   * 
   * User's emotional state when recording dream
   * Optional field - provides context for interpretation
   * 
   * Common values (not enforced, flexible):
   * - "calm" → peaceful, relaxed dream likely
   * - "anxious" → stress/anxiety dream likely
   * - "excited" → positive/energetic dream likely
   * - "sad" → melancholic dream themes
   * - "confused" → unclear/fragmented dream
   * 
   * Why capture mood?
   * - Helps AI provide personalized interpretation
   * - Tracks correlation between mood and dream content
   * - Pattern analysis ("I dream about water when anxious")
   */
  mood: varchar("mood"),
  
  /**
   * stressLevel: Current Stress Context
   * 
   * User's stress level at time of dream
   * Complements mood for richer analysis
   * 
   * Values:
   * - "low" → minimal stress, pleasant dreams expected
   * - "medium" → moderate stress, mixed dream types
   * - "high" → high stress, anxiety dreams likely
   * 
   * Research basis:
   * - Stress affects dream content (documented in psychology)
   * - High stress → more negative/threatening dreams
   * - Helps AI contextualize symbols (chase dream + high stress = anxiety)
   */
  stressLevel: varchar("stress_level"),
  
  /**
   * dreamDate: When Dream Occurred
   * 
   * .defaultNow() = Defaults to current time if not specified
   * 
   * Why separate from createdAt?
   * - User might record dream hours after waking
   * - dreamDate = when dream happened
   * - createdAt = when record was saved
   * 
   * Used for:
   * - Chronological ordering in journal
   * - Pattern analysis over time periods
   * - Sleep cycle correlation
   */
  dreamDate: timestamp("dream_date").defaultNow().notNull(),
  
  /**
   * createdAt: Record Creation Timestamp
   * 
   * When this database record was created
   * May differ from dreamDate if user records late
   * Audit trail for data integrity
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * DREAMS RELATIONS - Dream Connections
 * 
 * Dreams have TWO types of relationships:
 * 1. Belongs to ONE user (many-to-one)
 * 2. Can have MANY interpretations (one-to-many)
 */
export const dreamsRelations = relations(dreams, ({ one, many }) => ({
  /**
   * user: Dream's Owner
   * 
   * MANY-TO-ONE relationship:
   * - Many dreams → one user
   * - Each dream has exactly one owner
   * 
   * Enables queries like:
   *   "Find the user who created this dream"
   *   db.query.dreams.findFirst({
   *     where: eq(dreams.id, dreamId),
   *     with: { user: true }  // ← Includes user data
   *   })
   */
  user: one(users, {
    fields: [dreams.userId],      // This table's foreign key
    references: [users.id],        // Points to users.id
  }),
  
  /**
   * interpretations: AI Analyses of This Dream
   * 
   * ONE-TO-MANY relationship:
   * - One dream → many interpretations
   * 
   * Why multiple interpretations per dream?
   * - User can re-analyze same dream (Quick → Deep Dive upgrade)
   * - Different contexts (analyzed with different stress levels)
   * - Evolution tracking (how interpretation changes over time)
   * 
   * Query example:
   *   "Get all analyses for this dream"
   *   db.query.dreams.findFirst({
   *     where: eq(dreams.id, dreamId),
   *     with: { interpretations: true }
   *   })
   */
  interpretations: many(interpretations),
}));

/**
 * =============================================================================
 * INTERPRETATIONS TABLE - AI Dream Analyses (Premium Feature)
 * =============================================================================
 * 
 * PURPOSE:
 * Stores AI-generated dream interpretations with structured analysis data.
 * Each interpretation is a snapshot of what the AI understood about a dream.
 * 
 * KEY DISTINCTION:
 * - Dreams = User input (what they dreamed)
 * - Interpretations = AI output (what it means)
 * 
 * BUSINESS LOGIC:
 * - Free users: Can receive interpretations (ephemeral, not saved)
 * - Premium users: Interpretations saved to database (persistent)
 * - Each interpretation costs API credits (Claude tokens)
 * 
 * DATA STRUCTURE:
 * Interpretations are STRUCTURED data (not just text):
 * - Main interpretation text (paragraph analysis)
 * - Extracted symbols (key imagery)
 * - Identified emotions (psychological themes)
 * - Overarching themes (bigger patterns)
 * - Confidence score (how clear the analysis is)
 * 
 * This structure enables:
 * - Pattern detection across dreams
 * - Symbol frequency analysis
 * - Emotional trend tracking
 * - Search by theme/symbol
 */
export const interpretations = pgTable("interpretations", {
  /**
   * id: Unique Interpretation Identifier
   * 
   * UUID auto-generated by database
   * References this specific analysis
   */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /**
   * userId: Who Requested This Interpretation
   * 
   * FOREIGN KEY → users.id
   * 
   * Links interpretation to user account
   * Cascade delete: User deleted → interpretations deleted
   * 
   * Why needed even with dreamId?
   * - Some interpretations don't have associated dream (free users)
   * - Direct user attribution for billing/analytics
   * - Orphan prevention (interpretation without user)
   */
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  /**
   * dreamId: Associated Dream (Optional)
   * 
   * FOREIGN KEY → dreams.id
   * 
   * Links interpretation to its dream
   * null = Interpretation without saved dream (free user analyzed dream)
   * 
   * .references(() => dreams.id, { onDelete: "cascade" }) means:
   * - Dream deleted → associated interpretations deleted
   * - Maintains referential integrity
   * 
   * Why optional (nullable)?
   * - Free users get interpretations without saving dreams
   * - Premium users can analyze without journaling
   * - Flexibility in usage patterns
   */
  dreamId: varchar("dream_id").references(() => dreams.id, { onDelete: "cascade" }),
  
  /**
   * analysisType: Which AI Mode Was Used
   * 
   * Two analysis modes:
   * 
   * 1. "quick_insight" (Free Tier)
   *    - Concise analysis (1-2 paragraphs)
   *    - 1000 token limit
   *    - ~10 second response
   *    - Basic symbol identification
   *    - Good for bedside use (3am quick reassurance)
   * 
   * 2. "deep_dive" (Premium Only)
   *    - Comprehensive analysis (multi-paragraph)
   *    - 2000 token limit
   *    - ~20-30 second response
   *    - Multiple perspectives (Jungian, Freudian, modern)
   *    - Cultural/archetypal symbolism
   *    - Reflection questions
   * 
   * .notNull() = Must always specify which mode
   * Used for:
   * - Billing tracking (Deep Dive costs more)
   * - Feature gating (prevent free Deep Dive)
   * - Quality analysis (compare mode effectiveness)
   */
  analysisType: varchar("analysis_type").notNull(),
  
  /**
   * interpretation: Main Analysis Text
   * 
   * TEXT type = unlimited length
   * 
   * Contains the AI's narrative interpretation:
   * - Symbol meanings
   * - Psychological insights  
   * - Personal relevance
   * - Actionable guidance
   * 
   * This is the "meat" of the analysis
   * Displayed prominently in Results UI
   * 
   * Format depends on analysisType:
   * - Quick: 1-2 concise paragraphs
   * - Deep Dive: 3-5+ comprehensive paragraphs
   */
  interpretation: text("interpretation").notNull(),
  
  /**
   * symbols: Extracted Symbolic Elements
   * 
   * ARRAY of text values
   * 
   * .array() = PostgreSQL array type
   * Stores multiple values in single column
   * 
   * Example: ["water", "flying", "house", "mother"]
   * 
   * What are symbols?
   * - Key imagery/objects from dream
   * - Identified by AI based on dream research
   * - Have psychological/cultural meanings
   * 
   * Used for:
   * - Quick visual summary in UI (badge display)
   * - Pattern detection ("I dream about water often")
   * - Search functionality ("Find dreams with 'flying'")
   * - Analytics (most common symbols per user)
   * 
   * Why array instead of separate table?
   * - Simpler queries (no joins needed)
   * - PostgreSQL arrays are performant
   * - Symbols don't need complex relations
   */
  symbols: text("symbols").array(),
  
  /**
   * emotions: Identified Emotional Themes
   * 
   * ARRAY of emotional states detected in dream
   * 
   * Example: ["anxiety", "freedom", "joy", "confusion"]
   * 
   * What are emotions in dream context?
   * - Not user's current emotion (that's in dreams.mood)
   * - Emotional themes WITHIN the dream itself
   * - How the dream made the dreamer feel
   * - Psychological undertones of dream narrative
   * 
   * Used for:
   * - Emotional pattern tracking
   * - Mental health insights (recurring anxiety themes?)
   * - Correlation with waking life stress
   * - UI visualization (emotion clouds, charts)
   * 
   * Research basis:
   * - Emotions in dreams reflect processing of waking experiences
   * - Tracking emotional themes helps identify psychological patterns
   * - Different from Freudian "wish fulfillment" - modern neuroscience approach
   */
  emotions: text("emotions").array(),
  
  /**
   * themes: Overarching Psychological Themes
   * 
   * ARRAY of high-level conceptual patterns
   * 
   * Example: ["transformation", "control issues", "unresolved conflict", "personal growth"]
   * 
   * Difference from symbols?
   * - Symbols: Concrete imagery ("water", "flying")
   * - Themes: Abstract concepts ("fear of change", "desire for freedom")
   * 
   * Difference from emotions?
   * - Emotions: Feeling states ("anxiety", "joy")
   * - Themes: Psychological patterns ("abandonment fear", "power dynamics")
   * 
   * Themes are the "so what?" of dream analysis:
   * - Symbols tell us WHAT was in dream
   * - Emotions tell us HOW it felt
   * - Themes tell us WHY it matters (psychological significance)
   * 
   * Used for:
   * - Longitudinal pattern analysis
   * - Personal growth tracking
   * - Therapy integration
   * - Deeper self-understanding
   */
  themes: text("themes").array(),
  
  /**
   * confidence: AI Confidence Score
   * 
   * INTEGER 0-100 (percentage)
   * 
   * Represents how confident the AI is in its interpretation
   * 
   * Factors affecting confidence:
   * - Dream detail level (sparse vs. vivid description)
   * - Symbolic clarity (clear symbols vs. vague imagery)
   * - Narrative coherence (logical flow vs. fragmented)
   * - Cultural context availability (universal vs. obscure symbols)
   * 
   * Score ranges:
   * - 80-100: High confidence (clear, detailed dream)
   * - 50-79: Moderate confidence (some ambiguity)
   * - 0-49: Low confidence (too vague/unclear for solid analysis)
   * 
   * Why important?
   * - Transparency with user (don't oversell uncertain analysis)
   * - Quality filtering (hide low-confidence interpretations)
   * - Prompt engineering feedback (improve prompts for better scores)
   * 
   * UI usage:
   * - Color-coded badge (green=high, yellow=medium, red=low)
   * - Disclaimer for low scores ("interpretation is uncertain")
   * - Suggest user provide more dream details if score low
   */
  confidence: integer("confidence"),
  
  /**
   * createdAt: When Interpretation Generated
   * 
   * Timestamp of AI analysis
   * 
   * Used for:
   * - Chronological ordering (latest first)
   * - Response time analytics
   * - Cache invalidation
   * - Historical comparison (how analysis changed over time)
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * INTERPRETATIONS RELATIONS
 * 
 * Interpretations connect to:
 * 1. User who requested analysis
 * 2. Dream that was analyzed (if saved)
 */
export const interpretationsRelations = relations(interpretations, ({ one }) => ({
  /**
   * user: Interpretation Requester
   * 
   * MANY-TO-ONE: Many interpretations → one user
   * 
   * Query: "Find user who got this interpretation"
   */
  user: one(users, {
    fields: [interpretations.userId],
    references: [users.id],
  }),
  
  /**
   * dream: Source Dream (Optional)
   * 
   * MANY-TO-ONE: Many interpretations → one dream
   * Can be null (free users don't save dreams)
   * 
   * Query: "Find original dream for this interpretation"
   */
  dream: one(dreams, {
    fields: [interpretations.dreamId],
    references: [dreams.id],
  }),
}));

/**
 * =============================================================================
 * TYPE EXPORTS - For TypeScript Type Safety
 * =============================================================================
 * 
 * These types are used throughout the application for compile-time safety.
 * TypeScript prevents bugs by catching type mismatches before runtime.
 */

/**
 * Replit Auth Types (REQUIRED by blueprint)
 * 
 * UpsertUser: Type for creating/updating user
 * - Used in auth middleware when user logs in
 * - Includes all fields that can be set
 * 
 * User: Type for user record from database
 * - Used in queries that fetch user data
 * - Includes auto-generated fields (id, timestamps)
 */
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

/**
 * Dream Types
 * 
 * insertDreamSchema: Validation schema for creating dreams
 * - Zod schema generated from table definition
 * - .omit({ id, createdAt }) excludes auto-generated fields
 * - Used in API validation before database insert
 * 
 * InsertDream: TypeScript type for insert data
 * - Inferred from Zod schema
 * - Used in function parameters
 * 
 * Dream: TypeScript type for database record
 * - Includes all fields after insert
 * - Used in query results
 * 
 * Why both insert and select types?
 * - Insert type: What you SEND to database (no id yet)
 * - Select type: What you GET from database (includes id)
 */
export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,        // Database generates this
  createdAt: true, // Database generates this
});

export type InsertDream = z.infer<typeof insertDreamSchema>;
export type Dream = typeof dreams.$inferSelect;

/**
 * Interpretation Types
 * 
 * Same pattern as Dream types:
 * - Schema for validation
 * - Insert type for creating
 * - Select type for querying
 */
export const insertInterpretationSchema = createInsertSchema(interpretations).omit({
  id: true,
  createdAt: true,
});

export type InsertInterpretation = z.infer<typeof insertInterpretationSchema>;
export type Interpretation = typeof interpretations.$inferSelect;

/**
 * =============================================================================
 * END OF SCHEMA DEFINITION
 * =============================================================================
 * 
 * SUMMARY OF DATABASE STRUCTURE:
 * 
 * ┌─────────┐          ┌─────────┐          ┌──────────────────┐
 * │ USERS   │──────┬───│ DREAMS  │──────────│ INTERPRETATIONS │
 * └─────────┘      │   └─────────┘          └──────────────────┘
 *      │           │        │                        │
 *  isPremium   (1:many) (1:many)              analysisType
 *  controls         │        │                  controls
 *  features     one user  one dream              billing
 *                 owns     can have
 *               many      many
 *              dreams  interpretations
 * 
 * KEY RELATIONSHIPS:
 * - 1 User → Many Dreams
 * - 1 User → Many Interpretations  
 * - 1 Dream → Many Interpretations
 * 
 * FREEMIUM MODEL:
 * - Free: Quick Insight interpretations (not saved)
 * - Premium: All features + persistent storage
 * 
 * CASCADE DELETES:
 * - Delete User → Dreams deleted → Interpretations deleted
 * - Delete Dream → Interpretations deleted
 * - Maintains data integrity automatically
 * 
 * NEXT STEPS FOR LEARNING:
 * 1. See server/storage.ts for how we query this database
 * 2. See server/routes.ts for how API endpoints use these types
 * 3. See client/src/hooks/useAuth.tsx for auth integration
 */
