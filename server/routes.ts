import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInspectionSchema, insertScoringRuleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Motorcycle data routes
  app.get('/api/motorcycle-brands', async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch motorcycle brands" });
    }
  });

  app.get('/api/motorcycle-models', async (req, res) => {
    try {
      const { brandId } = req.query;
      if (brandId) {
        const models = await storage.getModelsByBrand(brandId as string);
        res.json(models);
      } else {
        const models = await storage.getAllModels();
        res.json(models);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch motorcycle models" });
    }
  });

  // Scoring rules routes (admin only)
  app.get('/api/scoring-rules', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const rules = await storage.getAllScoringRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching scoring rules:", error);
      res.status(500).json({ message: "Failed to fetch scoring rules" });
    }
  });

  app.put('/api/scoring-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const validatedData = insertScoringRuleSchema.parse({
        ...req.body,
        updatedBy: req.user.claims.sub,
      });

      const updated = await storage.updateScoringRule(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating scoring rule:", error);
      res.status(500).json({ message: "Failed to update scoring rule" });
    }
  });

  // Inspection routes
  app.post('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const inspectorId = req.user.claims.sub;
      
      // Calculate scores based on inspection data
      const scores = calculateInspectionScores(req.body);
      
      // Calculate market valuation
      const valuation = await calculateMarketValuation(req.body.make, req.body.model, req.body.year, scores.finalScore);

      const validatedData = insertInspectionSchema.parse({
        ...req.body,
        inspectorId,
        ...scores,
        ...valuation,
        status: 'completed',
      });

      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inspection data", errors: error.errors });
      }
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.get('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { limit, search } = req.query;

      let inspections;
      if (search) {
        inspections = await storage.searchInspections(search as string);
      } else if (user?.role === 'admin') {
        inspections = await storage.getAllInspections(parseInt(limit as string) || 100);
      } else {
        inspections = await storage.getUserInspections(userId, parseInt(limit as string) || 50);
      }

      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.get('/api/inspections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      // Check if user can access this inspection
      if (user?.role !== 'admin' && inspection.inspectorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const stats = await storage.getInspectionStats(
        user?.role === 'admin' ? undefined : userId
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate inspection scores
function calculateInspectionScores(inspectionData: any) {
  const weights = {
    engine: 40,
    frame: 15,
    suspension: 10,
    brakes: 10,
    tires: 10,
    electricals: 5,
    body: 8,
    documents: 2,
  };

  // Calculate category scores (simplified scoring logic)
  const engineScore = calculateEngineScore(inspectionData.engineData);
  const frameScore = calculateFrameScore(inspectionData.frameData);
  const suspensionScore = calculateSuspensionScore(inspectionData.suspensionData);
  const brakesScore = calculateBrakesScore(inspectionData.brakesData);
  const tiresScore = calculateTiresScore(inspectionData.tiresData);
  const electricalsScore = calculateElectricalsScore(inspectionData.electricalsData);
  const bodyScore = calculateBodyScore(inspectionData.bodyData);
  const documentsScore = calculateDocumentsScore(inspectionData.documentsData);

  // Calculate weighted final score
  const finalScore = (
    (engineScore * weights.engine) +
    (frameScore * weights.frame) +
    (suspensionScore * weights.suspension) +
    (brakesScore * weights.brakes) +
    (tiresScore * weights.tires) +
    (electricalsScore * weights.electricals) +
    (bodyScore * weights.body) +
    (documentsScore * weights.documents)
  ) / 100;

  return {
    engineScore: Math.round(engineScore * 10) / 10,
    frameScore: Math.round(frameScore * 10) / 10,
    suspensionScore: Math.round(suspensionScore * 10) / 10,
    brakesScore: Math.round(brakesScore * 10) / 10,
    tiresScore: Math.round(tiresScore * 10) / 10,
    electricalsScore: Math.round(electricalsScore * 10) / 10,
    bodyScore: Math.round(bodyScore * 10) / 10,
    documentsScore: Math.round(documentsScore * 10) / 10,
    finalScore: Math.round(finalScore * 10) / 10,
  };
}

function calculateEngineScore(engineData: any): number {
  let score = 10;
  
  if (engineData.oilLeaks === 'minor') score -= 0.5;
  if (engineData.oilLeaks === 'major') score -= 1.5;
  if (engineData.smoke === 'light') score -= 0.8;
  if (engineData.smoke === 'heavy') score -= 2.0;
  if (engineData.abnormalNoise) score -= 1.0;
  if (engineData.hardStart) score -= 0.7;
  if (engineData.overheating) score -= 1.5;
  
  return Math.max(0, score);
}

function calculateFrameScore(frameData: any): number {
  let score = 10;
  
  if (frameData.cracks) score -= 3.0;
  if (frameData.rust) score -= 1.5;
  if (frameData.bends) score -= 2.5;
  if (frameData.repaintMarks) score -= 0.5;
  
  return Math.max(0, score);
}

function calculateSuspensionScore(suspensionData: any): number {
  let score = 10;
  
  if (suspensionData.leakage) score -= 2.0;
  if (suspensionData.stiffness) score -= 1.5;
  if (suspensionData.abnormalSound) score -= 1.0;
  
  return Math.max(0, score);
}

function calculateBrakesScore(brakesData: any): number {
  let score = 10;
  
  const padCondition = brakesData.padRemaining / 100;
  if (padCondition < 0.3) score -= 2.0;
  else if (padCondition < 0.5) score -= 1.0;
  else if (padCondition < 0.7) score -= 0.5;
  
  if (brakesData.discWarp) score -= 1.5;
  if (brakesData.fluidLeak) score -= 1.0;
  if (!brakesData.absStatus) score -= 0.5;
  
  return Math.max(0, score);
}

function calculateTiresScore(tiresData: any): number {
  let score = 10;
  
  const treadCondition = tiresData.treadRemaining / 100;
  if (treadCondition < 0.3) score -= 2.5;
  else if (treadCondition < 0.5) score -= 1.5;
  else if (treadCondition < 0.7) score -= 0.7;
  
  if (tiresData.cracks) score -= 1.0;
  if (tiresData.mismatchedPair) score -= 0.8;
  if (tiresData.ageOver5Years) score -= 1.2;
  
  return Math.max(0, score);
}

function calculateElectricalsScore(electricalsData: any): number {
  let score = 10;
  
  if (!electricalsData.lights) score -= 1.5;
  if (!electricalsData.indicators) score -= 1.0;
  if (!electricalsData.horn) score -= 0.5;
  if (!electricalsData.starter) score -= 2.0;
  
  if (electricalsData.batteryCondition === 'fair') score -= 1.0;
  if (electricalsData.batteryCondition === 'poor') score -= 2.5;
  
  return Math.max(0, score);
}

function calculateBodyScore(bodyData: any): number {
  let score = 10;
  
  score -= bodyData.minorScratches * 0.1;
  score -= bodyData.bigScratches * 0.3;
  score -= bodyData.smallDents * 0.2;
  score -= bodyData.bigDents * 0.5;
  
  if (bodyData.cracks) score -= 1.5;
  if (bodyData.repaintPanels) score -= 1.0;
  
  const fairingConditionPenalties = {
    'excellent': 0,
    'good': 0.5,
    'fair': 1.5,
    'poor': 3.0,
  };
  score -= fairingConditionPenalties[bodyData.fairingCondition as keyof typeof fairingConditionPenalties] || 0;
  
  return Math.max(0, score);
}

function calculateDocumentsScore(documentsData: any): number {
  let score = 10;
  
  if (!documentsData.registration) score -= 4.0;
  if (!documentsData.importPapers) score -= 3.0;
  if (!documentsData.serviceRecords) score -= 3.0;
  
  return Math.max(0, score);
}

// Helper function to calculate market valuation
async function calculateMarketValuation(make: string, model: string, year: number, finalScore: number) {
  // This would typically fetch from the database, but for now we'll use hardcoded baselines
  const baselines: Record<string, Record<string, number>> = {
    honda: {
      'cd-70': 159900,
      'cg-125': 238500,
      'pridor': 211900,
      'cb-125f': 390900,
      'cb-150f': 497900,
    },
    suzuki: {
      'gd-110s': 369900,
      'gs-150': 389000,
      'gsx-125': 499000,
      'gr-150': 552900,
    },
    yamaha: {
      'ybr-125': 471500,
      'ybr-125g': 490500,
      'yb-125z': 429000,
    },
    united: {
      'us-70': 111000,
      'us-100': 108500,
      'us-125': 79500,
      'us-150': 347500,
    },
    'road-prince': {
      'rp-70': 111000,
      '70-passion-plus': 121000,
      'rp-125': 167000,
      '150-wego': 419000,
      'rx3': 1100000,
    },
    unique: {
      'ud-70': 118500,
      '125cc': 141000,
      '150cc': 285000,
      'crazer-ud-150': 685000,
    },
  };

  let marketBaseline = baselines[make?.toLowerCase()]?.[model?.toLowerCase()] || 200000;
  
  // Apply depreciation based on year
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const depreciationRate = Math.min(age * 0.08, 0.5); // 8% per year, max 50%
  marketBaseline = marketBaseline * (1 - depreciationRate);
  
  // Apply condition adjustment
  const conditionMultiplier = finalScore / 10;
  const estimatedValue = marketBaseline * conditionMultiplier;

  return {
    marketBaseline: Math.round(marketBaseline),
    estimatedValue: Math.round(estimatedValue),
  };
}
