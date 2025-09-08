import { db } from "./db";
import { motorcycleBrands, motorcycleModels, scoringRules } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding Pakistani motorcycle database...");

  // Seed motorcycle brands
  const brandsData = [
    { name: "Honda", country: "Japan" },
    { name: "Suzuki", country: "Japan" },
    { name: "Yamaha", country: "Japan" },
    { name: "United Motors", country: "Pakistan" },
    { name: "Road Prince", country: "Pakistan" },
    { name: "Unique", country: "Pakistan" },
  ];

  const brands = await db.insert(motorcycleBrands).values(brandsData).returning();
  console.log("Inserted motorcycle brands:", brands.length);

  // Create brand lookup
  const brandLookup = brands.reduce((acc, brand) => {
    acc[brand.name] = brand.id;
    return acc;
  }, {} as Record<string, string>);

  // Seed motorcycle models with real 2024-2025 pricing
  const modelsData = [
    // Honda Models
    { brandId: brandLookup["Honda"], name: "CD 70", engineSize: 70, category: "entry-level", basePrice2024: "159900", basePrice2025: "159900" },
    { brandId: brandLookup["Honda"], name: "CD 70 Dream", engineSize: 70, category: "entry-level", basePrice2024: "168900", basePrice2025: "168900" },
    { brandId: brandLookup["Honda"], name: "CG 125", engineSize: 125, category: "standard", basePrice2024: "238500", basePrice2025: "238500" },
    { brandId: brandLookup["Honda"], name: "CG 125 Special Edition", engineSize: 125, category: "standard", basePrice2024: "282900", basePrice2025: "282900" },
    { brandId: brandLookup["Honda"], name: "Pridor", engineSize: 100, category: "standard", basePrice2024: "211900", basePrice2025: "211900" },
    { brandId: brandLookup["Honda"], name: "CB 125F", engineSize: 125, category: "sport", basePrice2024: "390900", basePrice2025: "390900" },
    { brandId: brandLookup["Honda"], name: "CB 150F", engineSize: 150, category: "sport", basePrice2024: "497900", basePrice2025: "497900" },

    // Suzuki Models
    { brandId: brandLookup["Suzuki"], name: "GD 110S", engineSize: 110, category: "standard", basePrice2024: "359000", basePrice2025: "369900" },
    { brandId: brandLookup["Suzuki"], name: "GS 150", engineSize: 150, category: "standard", basePrice2024: "389000", basePrice2025: "389000" },
    { brandId: brandLookup["Suzuki"], name: "GSX 125", engineSize: 125, category: "sport", basePrice2024: "499000", basePrice2025: "499000" },
    { brandId: brandLookup["Suzuki"], name: "GR 150", engineSize: 150, category: "sport", basePrice2024: "547000", basePrice2025: "552900" },

    // Yamaha Models
    { brandId: brandLookup["Yamaha"], name: "YBR 125", engineSize: 125, category: "standard", basePrice2024: "466000", basePrice2025: "471500" },
    { brandId: brandLookup["Yamaha"], name: "YBR 125G", engineSize: 125, category: "standard", basePrice2024: "488000", basePrice2025: "490500" },
    { brandId: brandLookup["Yamaha"], name: "YB 125Z", engineSize: 125, category: "standard", basePrice2024: "429000", basePrice2025: "429000" },

    // United Motors Models
    { brandId: brandLookup["United Motors"], name: "US 70", engineSize: 70, category: "entry-level", basePrice2024: "111000", basePrice2025: "111000" },
    { brandId: brandLookup["United Motors"], name: "US 100", engineSize: 100, category: "entry-level", basePrice2024: "108500", basePrice2025: "108500" },
    { brandId: brandLookup["United Motors"], name: "US 100 Jazba", engineSize: 100, category: "entry-level", basePrice2024: "79000", basePrice2025: "79000" },
    { brandId: brandLookup["United Motors"], name: "US 125 Euro II", engineSize: 125, category: "standard", basePrice2024: "79500", basePrice2025: "79500" },
    { brandId: brandLookup["United Motors"], name: "US 150 Ultimate Thrill", engineSize: 150, category: "sport", basePrice2024: "330000", basePrice2025: "347500" },

    // Road Prince Models
    { brandId: brandLookup["Road Prince"], name: "RP 70", engineSize: 70, category: "entry-level", basePrice2024: "111000", basePrice2025: "111000" },
    { brandId: brandLookup["Road Prince"], name: "70 Passion Plus", engineSize: 70, category: "entry-level", basePrice2024: "121000", basePrice2025: "121000" },
    { brandId: brandLookup["Road Prince"], name: "RP 125", engineSize: 125, category: "standard", basePrice2024: "167000", basePrice2025: "167000" },
    { brandId: brandLookup["Road Prince"], name: "150 Wego", engineSize: 150, category: "standard", basePrice2024: "419000", basePrice2025: "419000" },
    { brandId: brandLookup["Road Prince"], name: "150 Robinson", engineSize: 150, category: "standard", basePrice2024: "419000", basePrice2025: "419000" },
    { brandId: brandLookup["Road Prince"], name: "RX3", engineSize: 250, category: "sport", basePrice2024: "1100000", basePrice2025: "1100000" },

    // Unique Models
    { brandId: brandLookup["Unique"], name: "UD 70", engineSize: 70, category: "entry-level", basePrice2024: "118500", basePrice2025: "118500" },
    { brandId: brandLookup["Unique"], name: "125cc", engineSize: 125, category: "standard", basePrice2024: "141000", basePrice2025: "141000" },
    { brandId: brandLookup["Unique"], name: "150cc", engineSize: 150, category: "standard", basePrice2024: "205000", basePrice2025: "285000" },
    { brandId: brandLookup["Unique"], name: "Crazer UD-150", engineSize: 150, category: "sport", basePrice2024: "685000", basePrice2025: "685000" },
  ];

  const models = await db.insert(motorcycleModels).values(modelsData).returning();
  console.log("Inserted motorcycle models:", models.length);

  // Seed scoring rules
  const scoringRulesData = [
    {
      category: "engine",
      weight: "40.00",
      deductionRules: {
        oilLeaks: { none: 0, minor: 0.5, major: 1.5 },
        smoke: { none: 0, light: 0.8, heavy: 2.0 },
        abnormalNoise: 1.0,
        hardStart: 0.7,
        overheating: 1.5,
      },
    },
    {
      category: "frame",
      weight: "15.00",
      deductionRules: {
        cracks: 3.0,
        rust: 1.5,
        bends: 2.5,
        repaintMarks: 0.5,
      },
    },
    {
      category: "suspension",
      weight: "10.00",
      deductionRules: {
        leakage: 2.0,
        stiffness: 1.5,
        abnormalSound: 1.0,
      },
    },
    {
      category: "brakes",
      weight: "10.00",
      deductionRules: {
        padRemaining: { 30: 2.0, 50: 1.0, 70: 0.5 },
        discWarp: 1.5,
        fluidLeak: 1.0,
        absStatus: 0.5,
      },
    },
    {
      category: "tires",
      weight: "10.00",
      deductionRules: {
        treadRemaining: { 30: 2.5, 50: 1.5, 70: 0.7 },
        cracks: 1.0,
        mismatchedPair: 0.8,
        ageOver5Years: 1.2,
      },
    },
    {
      category: "electricals",
      weight: "5.00",
      deductionRules: {
        lights: 1.5,
        indicators: 1.0,
        horn: 0.5,
        starter: 2.0,
        batteryCondition: { good: 0, fair: 1.0, poor: 2.5 },
      },
    },
    {
      category: "body",
      weight: "8.00",
      deductionRules: {
        minorScratches: 0.1,
        bigScratches: 0.3,
        smallDents: 0.2,
        bigDents: 0.5,
        cracks: 1.5,
        repaintPanels: 1.0,
        fairingCondition: { excellent: 0, good: 0.5, fair: 1.5, poor: 3.0 },
      },
    },
    {
      category: "documents",
      weight: "2.00",
      deductionRules: {
        registration: 4.0,
        importPapers: 3.0,
        serviceRecords: 3.0,
      },
    },
  ];

  const rules = await db.insert(scoringRules).values(scoringRulesData).returning();
  console.log("Inserted scoring rules:", rules.length);

  console.log("Database seeding completed successfully!");
}

// Run seeding if this file is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedDatabase().catch(console.error);
}
