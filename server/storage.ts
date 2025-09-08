import {
  users,
  motorcycleBrands,
  motorcycleModels,
  scoringRules,
  inspections,
  type User,
  type UpsertUser,
  type MotorcycleBrand,
  type MotorcycleModel,
  type ScoringRule,
  type Inspection,
  type InsertInspection,
  type InsertScoringRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Motorcycle data operations
  getAllBrands(): Promise<MotorcycleBrand[]>;
  getModelsByBrand(brandId: string): Promise<MotorcycleModel[]>;
  getAllModels(): Promise<(MotorcycleModel & { brand: MotorcycleBrand })[]>;
  
  // Scoring rules operations
  getAllScoringRules(): Promise<ScoringRule[]>;
  updateScoringRule(id: string, rule: Partial<InsertScoringRule>): Promise<ScoringRule>;
  
  // Inspection operations
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection>;
  getInspection(id: string): Promise<(Inspection & { inspector: User }) | undefined>;
  getUserInspections(userId: string, limit?: number): Promise<(Inspection & { inspector: User })[]>;
  getAllInspections(limit?: number): Promise<(Inspection & { inspector: User })[]>;
  searchInspections(query: string): Promise<(Inspection & { inspector: User })[]>;
  getInspectionStats(userId?: string): Promise<{
    total: number;
    thisMonth: number;
    avgScore: number;
    reportsGenerated: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  // Motorcycle data operations
  async getAllBrands(): Promise<MotorcycleBrand[]> {
    return await db.select().from(motorcycleBrands).orderBy(motorcycleBrands.name);
  }

  async getModelsByBrand(brandId: string): Promise<MotorcycleModel[]> {
    return await db
      .select()
      .from(motorcycleModels)
      .where(eq(motorcycleModels.brandId, brandId))
      .orderBy(motorcycleModels.name);
  }

  async getAllModels(): Promise<(MotorcycleModel & { brand: MotorcycleBrand })[]> {
    const result = await db
      .select()
      .from(motorcycleModels)
      .leftJoin(motorcycleBrands, eq(motorcycleModels.brandId, motorcycleBrands.id))
      .orderBy(motorcycleBrands.name, motorcycleModels.name);

    return result.map(({ motorcycle_models: model, motorcycle_brands: brand }) => ({
      ...model,
      brand: brand!,
    }));
  }

  // Scoring rules operations
  async getAllScoringRules(): Promise<ScoringRule[]> {
    return await db.select().from(scoringRules).orderBy(scoringRules.category);
  }

  async updateScoringRule(id: string, rule: Partial<InsertScoringRule>): Promise<ScoringRule> {
    const [updated] = await db
      .update(scoringRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(scoringRules.id, id))
      .returning();
    return updated;
  }

  // Inspection operations
  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [created] = await db.insert(inspections).values(inspection).returning();
    return created;
  }

  async updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection> {
    const [updated] = await db
      .update(inspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(inspections.id, id))
      .returning();
    return updated;
  }

  async getInspection(id: string): Promise<(Inspection & { inspector: User }) | undefined> {
    const [result] = await db
      .select()
      .from(inspections)
      .leftJoin(users, eq(inspections.inspectorId, users.id))
      .where(eq(inspections.id, id));

    if (!result) return undefined;

    return {
      ...result.inspections,
      inspector: result.users!,
    };
  }

  async getUserInspections(userId: string, limit = 50): Promise<(Inspection & { inspector: User })[]> {
    const results = await db
      .select()
      .from(inspections)
      .leftJoin(users, eq(inspections.inspectorId, users.id))
      .where(eq(inspections.inspectorId, userId))
      .orderBy(desc(inspections.createdAt))
      .limit(limit);

    return results.map(({ inspections: inspection, users: inspector }) => ({
      ...inspection,
      inspector: inspector!,
    }));
  }

  async getAllInspections(limit = 100): Promise<(Inspection & { inspector: User })[]> {
    const results = await db
      .select()
      .from(inspections)
      .leftJoin(users, eq(inspections.inspectorId, users.id))
      .orderBy(desc(inspections.createdAt))
      .limit(limit);

    return results.map(({ inspections: inspection, users: inspector }) => ({
      ...inspection,
      inspector: inspector!,
    }));
  }

  async searchInspections(query: string): Promise<(Inspection & { inspector: User })[]> {
    const results = await db
      .select()
      .from(inspections)
      .leftJoin(users, eq(inspections.inspectorId, users.id))
      .where(
        and(
          like(inspections.chassisNo, `%${query}%`),
          // Add more search conditions as needed
        )
      )
      .orderBy(desc(inspections.createdAt))
      .limit(50);

    return results.map(({ inspections: inspection, users: inspector }) => ({
      ...inspection,
      inspector: inspector!,
    }));
  }

  async getInspectionStats(userId?: string): Promise<{
    total: number;
    thisMonth: number;
    avgScore: number;
    reportsGenerated: number;
  }> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const whereClause = userId ? eq(inspections.inspectorId, userId) : undefined;

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        thisMonth: sql<number>`count(case when created_at >= ${currentMonth} then 1 end)::int`,
        avgScore: sql<number>`round(avg(final_score), 1)`,
        reportsGenerated: sql<number>`count(case when report_generated = true then 1 end)::int`,
      })
      .from(inspections)
      .where(whereClause);

    return {
      total: stats.total || 0,
      thisMonth: stats.thisMonth || 0,
      avgScore: stats.avgScore || 0,
      reportsGenerated: stats.reportsGenerated || 0,
    };
  }
}

export const storage = new DatabaseStorage();
