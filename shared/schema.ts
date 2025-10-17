// From javascript_log_in_with_replit blueprint and javascript_database blueprint
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with Replit Auth fields + premium subscription
// (IMPORTANT) Keep the default config for id column as per blueprint instructions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Premium subscription fields (for Stripe)
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"), // active, canceled, past_due
  subscriptionEndDate: timestamp("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  dreams: many(dreams),
  interpretations: many(interpretations),
}));

// Dreams table (only for premium users)
export const dreams = pgTable("dreams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mood: varchar("mood"), // calm, anxious, excited, sad, confused
  stressLevel: varchar("stress_level"), // low, medium, high
  dreamDate: timestamp("dream_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dreamsRelations = relations(dreams, ({ one, many }) => ({
  user: one(users, {
    fields: [dreams.userId],
    references: [users.id],
  }),
  interpretations: many(interpretations),
}));

// Interpretations table (only for premium users)
export const interpretations = pgTable("interpretations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dreamId: varchar("dream_id").references(() => dreams.id, { onDelete: "cascade" }),
  analysisType: varchar("analysis_type").notNull(), // quick_insight or deep_dive
  interpretation: text("interpretation").notNull(),
  symbols: text("symbols").array(),
  emotions: text("emotions").array(),
  themes: text("themes").array(),
  confidence: integer("confidence"), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interpretationsRelations = relations(interpretations, ({ one }) => ({
  user: one(users, {
    fields: [interpretations.userId],
    references: [users.id],
  }),
  dream: one(dreams, {
    fields: [interpretations.dreamId],
    references: [dreams.id],
  }),
}));

// Types for Replit Auth (IMPORTANT: required by blueprint)
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Dream types
export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,
  createdAt: true,
});

export type InsertDream = z.infer<typeof insertDreamSchema>;
export type Dream = typeof dreams.$inferSelect;

// Interpretation types
export const insertInterpretationSchema = createInsertSchema(interpretations).omit({
  id: true,
  createdAt: true,
});

export type InsertInterpretation = z.infer<typeof insertInterpretationSchema>;
export type Interpretation = typeof interpretations.$inferSelect;
