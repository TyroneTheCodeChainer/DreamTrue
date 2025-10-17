// From javascript_log_in_with_replit and javascript_database blueprints
import {
  users,
  dreams,
  interpretations,
  type User,
  type UpsertUser,
  type Dream,
  type InsertDream,
  type Interpretation,
  type InsertInterpretation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Dream operations (premium users only)
  createDream(dream: InsertDream): Promise<Dream>;
  getUserDreams(userId: string): Promise<Dream[]>;
  getDream(id: string): Promise<Dream | undefined>;
  deleteDream(id: string): Promise<void>;
  
  // Interpretation operations (premium users only)
  createInterpretation(interpretation: InsertInterpretation): Promise<Interpretation>;
  getUserInterpretations(userId: string): Promise<Interpretation[]>;
  getDreamInterpretations(dreamId: string): Promise<Interpretation[]>;
  getInterpretation(id: string): Promise<Interpretation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isPremium,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        isPremium: true,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Dream operations
  
  async createDream(dreamData: InsertDream): Promise<Dream> {
    const [dream] = await db.insert(dreams).values(dreamData).returning();
    return dream;
  }

  async getUserDreams(userId: string): Promise<Dream[]> {
    return await db
      .select()
      .from(dreams)
      .where(eq(dreams.userId, userId))
      .orderBy(desc(dreams.dreamDate));
  }

  async getDream(id: string): Promise<Dream | undefined> {
    const [dream] = await db.select().from(dreams).where(eq(dreams.id, id));
    return dream;
  }

  async deleteDream(id: string): Promise<void> {
    await db.delete(dreams).where(eq(dreams.id, id));
  }

  // Interpretation operations
  
  async createInterpretation(interpretationData: InsertInterpretation): Promise<Interpretation> {
    const [interpretation] = await db
      .insert(interpretations)
      .values(interpretationData)
      .returning();
    return interpretation;
  }

  async getUserInterpretations(userId: string): Promise<Interpretation[]> {
    return await db
      .select()
      .from(interpretations)
      .where(eq(interpretations.userId, userId))
      .orderBy(desc(interpretations.createdAt));
  }

  async getDreamInterpretations(dreamId: string): Promise<Interpretation[]> {
    return await db
      .select()
      .from(interpretations)
      .where(eq(interpretations.dreamId, dreamId))
      .orderBy(desc(interpretations.createdAt));
  }

  async getInterpretation(id: string): Promise<Interpretation | undefined> {
    const [interpretation] = await db
      .select()
      .from(interpretations)
      .where(eq(interpretations.id, id));
    return interpretation;
  }
}

export const storage = new DatabaseStorage();
