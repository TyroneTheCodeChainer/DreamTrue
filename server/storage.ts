// From javascript_log_in_with_replit and javascript_database blueprints
import {
  users,
  dreams,
  interpretations,
  errors,
  type User,
  type UpsertUser,
  type Dream,
  type InsertDream,
  type Interpretation,
  type InsertInterpretation,
  type InsertError,
  type ErrorLog,
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
  
  // Error logging operations (AIE8 Dimension 7: Monitoring)
  logError(error: InsertError): Promise<ErrorLog>;
  getRecentErrors(limit?: number): Promise<ErrorLog[]>;
  getUserErrors(userId: string, limit?: number): Promise<ErrorLog[]>;
  
  // Monitoring metrics operations (AIE8 Dimension 7: Monitoring)
  getMetricsAggregates(): Promise<{
    totalInterpretations: number;
    successfulInterpretations: number;
    failedInterpretations: number;
    successRate: number;
    avgLatencyMs: number;
    totalCostUsd: number;
    avgCostUsd: number;
    totalTokensUsed: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Standard upsert by ID (OIDC sub)
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
        // DO NOT set isPremium here - only webhook sets it after payment confirmation
        subscriptionStatus: 'pending', // Pending until webhook confirms payment
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

  // Error logging operations (AIE8 Dimension 7: Monitoring)
  
  async logError(errorData: InsertError): Promise<ErrorLog> {
    const [error] = await db
      .insert(errors)
      .values(errorData)
      .returning();
    return error;
  }

  async getRecentErrors(limit: number = 100): Promise<ErrorLog[]> {
    return await db
      .select()
      .from(errors)
      .orderBy(desc(errors.createdAt))
      .limit(limit);
  }

  async getUserErrors(userId: string, limit: number = 100): Promise<ErrorLog[]> {
    return await db
      .select()
      .from(errors)
      .where(eq(errors.userId, userId))
      .orderBy(desc(errors.createdAt))
      .limit(limit);
  }

  // Monitoring metrics operations (AIE8 Dimension 7: Monitoring)
  
  async getMetricsAggregates() {
    /**
     * Calculate Aggregated Monitoring Metrics
     * 
     * Purpose:
     * Provides high-level system health metrics for monitoring dashboard.
     * Helps product owners and engineers understand:
     * - System reliability (success rate)
     * - Performance (average latency)
     * - Costs (total spend, per-interpretation cost)
     * - Usage (total interpretations, token consumption)
     * 
     * Query Strategy:
     * - Single query to fetch all interpretations
     * - Client-side aggregation (more flexible than SQL aggregates)
     * - Handles missing data gracefully (nullish coalescing)
     * 
     * Metrics Computed:
     * - Total interpretations: Count of all records
     * - Success rate: % of interpretations without errors
     * - Average latency: Mean response time in milliseconds
     * - Total cost: Sum of all interpretation costs
     * - Average cost: Mean cost per interpretation
     * - Total tokens: Sum of all token usage
     * 
     * Business Value:
     * - Monitor AI service costs to optimize budget
     * - Track success rate to detect service degradation
     * - Measure latency to ensure good UX (target: <3s)
     * - Understand token usage for capacity planning
     * 
     * Future Enhancements:
     * - Time-based filtering (last 24h, 7d, 30d)
     * - Per-user metrics (identify power users)
     * - Per-model metrics (compare Claude vs GPT performance)
     * - Percentile latencies (p50, p95, p99)
     */
    const allInterpretations = await db.select().from(interpretations);
    
    const totalInterpretations = allInterpretations.length;
    const successfulInterpretations = allInterpretations.filter(i => i.status === 'success').length;
    const failedInterpretations = allInterpretations.filter(i => i.status === 'error').length;
    const successRate = totalInterpretations > 0 ? (successfulInterpretations / totalInterpretations) * 100 : 0;
    
    const totalLatencyMs = allInterpretations.reduce((sum, i) => sum + (i.latencyMs ?? 0), 0);
    const avgLatencyMs = totalInterpretations > 0 ? totalLatencyMs / totalInterpretations : 0;
    
    const totalCostUsd = allInterpretations.reduce((sum, i) => sum + (i.costUsd ?? 0), 0);
    const avgCostUsd = totalInterpretations > 0 ? totalCostUsd / totalInterpretations : 0;
    
    const totalTokensUsed = allInterpretations.reduce((sum, i) => sum + (i.tokensUsed ?? 0), 0);
    
    return {
      totalInterpretations,
      successfulInterpretations,
      failedInterpretations,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      avgLatencyMs: Math.round(avgLatencyMs),
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000, // Round to 4 decimal places
      avgCostUsd: Math.round(avgCostUsd * 10000) / 10000, // Round to 4 decimal places
      totalTokensUsed,
    };
  }
}

export const storage = new DatabaseStorage();
