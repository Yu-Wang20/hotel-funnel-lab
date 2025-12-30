import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// Core user table backing auth flow
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  country: varchar("country", { length: 64 }),
  language: varchar("language", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Hotels table
export const hotels = mysqlTable("hotels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  starRating: int("starRating").notNull(),
  reviewScore: decimal("reviewScore", { precision: 3, scale: 1 }),
  reviewCount: int("reviewCount").default(0),
  imageUrl: text("imageUrl"),
  images: json("images").$type<string[]>(),
  amenities: json("amenities").$type<string[]>(),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  policyText: text("policyText"), // Original long policy text (2000+ words)
  policyTextEn: text("policyTextEn"),
  nearbyLandmarks: json("nearbyLandmarks").$type<{name: string; distance: string; type: string}[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;

// Room types table
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(),
  feeAmount: decimal("feeAmount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  maxGuests: int("maxGuests").default(2),
  bedType: varchar("bedType", { length: 64 }),
  roomSize: int("roomSize"), // in sqm
  amenities: json("amenities").$type<string[]>(),
  imageUrl: text("imageUrl"),
  inventory: int("inventory").default(10),
  // Cancellation policy details
  freeCancellation: boolean("freeCancellation").default(false),
  freeCancelUntil: varchar("freeCancelUntil", { length: 64 }), // e.g., "24 hours before check-in"
  cancellationPenalty: text("cancellationPenalty"),
  // Payment options
  payAtProperty: boolean("payAtProperty").default(false),
  prepayRequired: boolean("prepayRequired").default(true),
  depositRequired: boolean("depositRequired").default(false),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }),
  hotelId: int("hotelId").notNull(),
  roomId: int("roomId").notNull(),
  checkIn: timestamp("checkIn").notNull(),
  checkOut: timestamp("checkOut").notNull(),
  guestCount: int("guestCount").notNull(),
  guestName: varchar("guestName", { length: 128 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 320 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 32 }),
  guestCountry: varchar("guestCountry", { length: 64 }),
  specialRequests: text("specialRequests"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(),
  feeAmount: decimal("feeAmount", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid"),
  // Experiment tracking
  variantId: varchar("variantId", { length: 32 }),
  experimentId: varchar("experimentId", { length: 64 }),
  // Attribution
  attributionSource: varchar("attributionSource", { length: 64 }),
  attributionTimestamp: timestamp("attributionTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Tracking events table
export const trackingEvents = mysqlTable("trackingEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 64 }).notNull(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // Core properties
  hotelId: int("hotelId"),
  roomId: int("roomId"),
  orderId: int("orderId"),
  // Experiment properties
  variantId: varchar("variantId", { length: 32 }),
  experimentId: varchar("experimentId", { length: 64 }),
  confidenceBucket: varchar("confidenceBucket", { length: 32 }), // high/medium/low
  // Event-specific properties stored as JSON
  properties: json("properties").$type<Record<string, unknown>>(),
  // Context
  pageUrl: text("pageUrl"),
  referrer: text("referrer"),
  userAgent: text("userAgent"),
  deviceType: varchar("deviceType", { length: 32 }),
  country: varchar("country", { length: 64 }),
  language: varchar("language", { length: 16 }),
});

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = typeof trackingEvents.$inferInsert;

// Experiments table
export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: varchar("experimentId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  hypothesis: text("hypothesis"),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).default("draft"),
  // Traffic allocation
  trafficPercent: int("trafficPercent").default(100), // % of eligible traffic
  controlPercent: int("controlPercent").default(50), // % to control group
  // Targeting
  targetCountries: json("targetCountries").$type<string[]>(),
  targetUserTypes: json("targetUserTypes").$type<string[]>(), // new/returning
  // Metrics
  primaryMetric: varchar("primaryMetric", { length: 64 }).default("pay_cvr"),
  secondaryMetrics: json("secondaryMetrics").$type<string[]>(),
  guardrailMetrics: json("guardrailMetrics").$type<string[]>(),
  // Statistical settings
  mdePercent: decimal("mdePercent", { precision: 5, scale: 2 }).default("1.50"), // Minimum Detectable Effect
  confidenceLevel: decimal("confidenceLevel", { precision: 5, scale: 2 }).default("0.95"),
  statisticalPower: decimal("statisticalPower", { precision: 5, scale: 2 }).default("0.80"),
  attributionWindowHours: int("attributionWindowHours").default(24),
  // Dates
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

// Experiment assignments table (tracks which users are in which variant)
export const experimentAssignments = mysqlTable("experimentAssignments", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: varchar("experimentId", { length: 64 }).notNull(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  variantId: varchar("variantId", { length: 32 }).notNull(), // 'control' or 'treatment'
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  // Exposure tracking
  exposedAt: timestamp("exposedAt"),
  exposed: boolean("exposed").default(false),
});

export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;
export type InsertExperimentAssignment = typeof experimentAssignments.$inferInsert;

// AI Policy analysis cache
export const policyAnalysis = mysqlTable("policyAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  roomId: int("roomId"),
  // Structured output
  cancellationType: varchar("cancellationType", { length: 32 }), // free_cancel, penalty, no_refund
  freeCancelUntil: varchar("freeCancelUntil", { length: 128 }),
  penaltyRules: json("penaltyRules").$type<{condition: string; amount: string}[]>(),
  // Tax info
  taxPayMode: varchar("taxPayMode", { length: 32 }), // online, at_property, mixed
  estimatedTaxRange: varchar("estimatedTaxRange", { length: 64 }),
  includedItems: json("includedItems").$type<string[]>(),
  excludedItems: json("excludedItems").$type<string[]>(),
  // ID requirements
  idDocType: varchar("idDocType", { length: 64 }),
  idMinValidMonths: int("idMinValidMonths"),
  idSpecialNotes: text("idSpecialNotes"),
  // Confidence and evidence
  cancellationConfidence: decimal("cancellationConfidence", { precision: 3, scale: 2 }),
  taxConfidence: decimal("taxConfidence", { precision: 3, scale: 2 }),
  idConfidence: decimal("idConfidence", { precision: 3, scale: 2 }),
  evidenceSpans: json("evidenceSpans").$type<{field: string; start: number; end: number; text: string}[]>(),
  // Source
  sourceText: text("sourceText"),
  analysisMethod: varchar("analysisMethod", { length: 32 }), // llm, rule_based, fallback
  llmLatencyMs: int("llmLatencyMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PolicyAnalysis = typeof policyAnalysis.$inferSelect;
export type InsertPolicyAnalysis = typeof policyAnalysis.$inferInsert;
