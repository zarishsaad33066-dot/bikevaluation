import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  jsonb,
  index 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("mechanic"), // mechanic, admin, dealer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Motorcycle brands and models
export const motorcycleBrands = pgTable("motorcycle_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const motorcycleModels = pgTable("motorcycle_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => motorcycleBrands.id),
  name: varchar("name").notNull(),
  engineSize: integer("engine_size"), // in cc
  category: varchar("category").notNull(), // entry-level, standard, sport
  basePrice2024: decimal("base_price_2024", { precision: 10, scale: 2 }),
  basePrice2025: decimal("base_price_2025", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scoring weights and rules
export const scoringRules = pgTable("scoring_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // engine, frame, brakes, tires, suspension, electricals, body, documents
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // percentage weight
  deductionRules: jsonb("deduction_rules").notNull(), // JSON object with deduction values
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Bike inspections
export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id),
  
  // Bike information
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  chassisNo: varchar("chassis_no").notNull(),
  engineNo: varchar("engine_no").notNull(),
  color: varchar("color"),
  mileage: integer("mileage"),
  importSource: varchar("import_source"), // japan, local, china
  
  // Inspection data
  engineData: jsonb("engine_data").notNull(),
  frameData: jsonb("frame_data").notNull(),
  suspensionData: jsonb("suspension_data").notNull(),
  brakesData: jsonb("brakes_data").notNull(),
  tiresData: jsonb("tires_data").notNull(),
  electricalsData: jsonb("electricals_data").notNull(),
  bodyData: jsonb("body_data").notNull(),
  documentsData: jsonb("documents_data").notNull(),
  
  // Scoring results
  engineScore: decimal("engine_score", { precision: 3, scale: 1 }),
  frameScore: decimal("frame_score", { precision: 3, scale: 1 }),
  suspensionScore: decimal("suspension_score", { precision: 3, scale: 1 }),
  brakesScore: decimal("brakes_score", { precision: 3, scale: 1 }),
  tiresScore: decimal("tires_score", { precision: 3, scale: 1 }),
  electricalsScore: decimal("electricals_score", { precision: 3, scale: 1 }),
  bodyScore: decimal("body_score", { precision: 3, scale: 1 }),
  documentsScore: decimal("documents_score", { precision: 3, scale: 1 }),
  finalScore: decimal("final_score", { precision: 3, scale: 1 }),
  
  // Market valuation
  marketBaseline: decimal("market_baseline", { precision: 10, scale: 2 }),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  
  // Status and metadata
  status: varchar("status").notNull().default("draft"), // draft, completed
  photos: jsonb("photos"), // array of photo URLs
  reportGenerated: boolean("report_generated").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const brandsRelations = relations(motorcycleBrands, ({ many }) => ({
  models: many(motorcycleModels),
}));

export const modelsRelations = relations(motorcycleModels, ({ one }) => ({
  brand: one(motorcycleBrands, {
    fields: [motorcycleModels.brandId],
    references: [motorcycleBrands.id],
  }),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  inspections: many(inspections),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertMotorcycleBrand = typeof motorcycleBrands.$inferInsert;
export type MotorcycleBrand = typeof motorcycleBrands.$inferSelect;

export type InsertMotorcycleModel = typeof motorcycleModels.$inferInsert;
export type MotorcycleModel = typeof motorcycleModels.$inferSelect;

export type InsertScoringRule = typeof scoringRules.$inferInsert;
export type ScoringRule = typeof scoringRules.$inferSelect;

export type InsertInspection = typeof inspections.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;

// Insert schemas for validation
export const insertMotorcycleBrandSchema = createInsertSchema(motorcycleBrands).omit({
  id: true,
  createdAt: true,
});

export const insertMotorcycleModelSchema = createInsertSchema(motorcycleModels).omit({
  id: true,
  createdAt: true,
});

export const insertScoringRuleSchema = createInsertSchema(scoringRules).omit({
  id: true,
  updatedAt: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  engineData: z.object({
    oilLeaks: z.enum(["none", "minor", "major"]),
    smoke: z.enum(["none", "light", "heavy"]),
    abnormalNoise: z.boolean(),
    hardStart: z.boolean(),
    overheating: z.boolean(),
  }),
  frameData: z.object({
    cracks: z.boolean(),
    rust: z.boolean(),
    bends: z.boolean(),
    repaintMarks: z.boolean(),
  }),
  suspensionData: z.object({
    leakage: z.boolean(),
    stiffness: z.boolean(),
    abnormalSound: z.boolean(),
  }),
  brakesData: z.object({
    padRemaining: z.number().min(0).max(100),
    discWarp: z.boolean(),
    absStatus: z.boolean(),
    fluidLeak: z.boolean(),
  }),
  tiresData: z.object({
    treadRemaining: z.number().min(0).max(100),
    cracks: z.boolean(),
    mismatchedPair: z.boolean(),
    ageOver5Years: z.boolean(),
  }),
  electricalsData: z.object({
    lights: z.boolean(),
    indicators: z.boolean(),
    horn: z.boolean(),
    starter: z.boolean(),
    batteryCondition: z.enum(["good", "fair", "poor"]),
  }),
  bodyData: z.object({
    minorScratches: z.number().min(0),
    bigScratches: z.number().min(0),
    smallDents: z.number().min(0),
    bigDents: z.number().min(0),
    cracks: z.boolean(),
    repaintPanels: z.boolean(),
    fairingCondition: z.enum(["excellent", "good", "fair", "poor"]),
  }),
  documentsData: z.object({
    registration: z.boolean(),
    importPapers: z.boolean(),
    serviceRecords: z.boolean(),
  }),
});

export type InspectionFormData = z.infer<typeof insertInspectionSchema>;
