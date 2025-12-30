import { eq, and, gte, lte, desc, asc, sql, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  hotels, InsertHotel, Hotel,
  rooms, InsertRoom, Room,
  orders, InsertOrder, Order,
  trackingEvents, InsertTrackingEvent, TrackingEvent,
  experiments, InsertExperiment, Experiment,
  experimentAssignments, InsertExperimentAssignment,
  policyAnalysis, InsertPolicyAnalysis, PolicyAnalysis
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "country", "language"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value !== undefined) {
      (values as any)[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Hotel functions
export async function searchHotels(params: {
  city?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  minStars?: number;
  freeCancellation?: boolean;
  sortBy?: 'recommendation' | 'price_asc' | 'price_desc' | 'rating';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(hotels);
  const conditions = [];

  if (params.city) {
    conditions.push(like(hotels.city, `%${params.city}%`));
  }
  if (params.minStars) {
    conditions.push(gte(hotels.starRating, params.minStars));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Apply sorting
  if (params.sortBy === 'price_asc') {
    query = query.orderBy(asc(hotels.starRating)) as any;
  } else if (params.sortBy === 'price_desc') {
    query = query.orderBy(desc(hotels.starRating)) as any;
  } else if (params.sortBy === 'rating') {
    query = query.orderBy(desc(hotels.reviewScore)) as any;
  } else {
    query = query.orderBy(desc(hotels.reviewScore), desc(hotels.reviewCount)) as any;
  }

  query = query.limit(params.limit || 20).offset(params.offset || 0) as any;
  return await query;
}

export async function getHotelById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllHotels() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(hotels);
}

export async function createHotel(hotel: InsertHotel) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(hotels).values(hotel);
  return result;
}

// Room functions
export async function getRoomsByHotelId(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rooms).where(eq(rooms.hotelId, hotelId));
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0] || null;
}

export async function createRoom(room: InsertRoom) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(rooms).values(room);
}

// Order functions
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0] || null;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderNumber: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.orderNumber, orderNumber));
}

// Tracking events functions
export async function trackEvent(event: InsertTrackingEvent) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(trackingEvents).values(event);
}

export async function getTrackingEvents(params: {
  eventName?: string;
  sessionId?: string;
  userId?: number;
  experimentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(trackingEvents);
  const conditions = [];

  if (params.eventName) conditions.push(eq(trackingEvents.eventName, params.eventName));
  if (params.sessionId) conditions.push(eq(trackingEvents.sessionId, params.sessionId));
  if (params.userId) conditions.push(eq(trackingEvents.userId, params.userId));
  if (params.experimentId) conditions.push(eq(trackingEvents.experimentId, params.experimentId));
  if (params.startDate) conditions.push(gte(trackingEvents.timestamp, params.startDate));
  if (params.endDate) conditions.push(lte(trackingEvents.timestamp, params.endDate));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(trackingEvents.timestamp)).limit(params.limit || 1000);
}

export async function getFunnelMetrics(experimentId?: string) {
  const db = await getDb();
  if (!db) return null;

  const eventCounts = await db.select({
    eventName: trackingEvents.eventName,
    variantId: trackingEvents.variantId,
    count: sql<number>`count(*)`.as('count'),
  }).from(trackingEvents)
    .where(experimentId ? eq(trackingEvents.experimentId, experimentId) : sql`1=1`)
    .groupBy(trackingEvents.eventName, trackingEvents.variantId);

  return eventCounts;
}

// Experiment functions
export async function createExperiment(experiment: InsertExperiment) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(experiments).values(experiment);
}

export async function getExperimentById(experimentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(experiments).where(eq(experiments.experimentId, experimentId)).limit(1);
  return result[0] || null;
}

export async function getAllExperiments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(experiments).orderBy(desc(experiments.createdAt));
}

export async function updateExperimentStatus(experimentId: string, status: 'draft' | 'running' | 'paused' | 'completed') {
  const db = await getDb();
  if (!db) return;
  await db.update(experiments).set({ status }).where(eq(experiments.experimentId, experimentId));
}

// Experiment assignment functions
export async function assignUserToExperiment(assignment: InsertExperimentAssignment) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(experimentAssignments).values(assignment);
}

export async function getExperimentAssignment(experimentId: string, sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(experimentAssignments)
    .where(and(
      eq(experimentAssignments.experimentId, experimentId),
      eq(experimentAssignments.sessionId, sessionId)
    )).limit(1);
  return result[0] || null;
}

export async function markExposure(experimentId: string, sessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(experimentAssignments)
    .set({ exposed: true, exposedAt: new Date() })
    .where(and(
      eq(experimentAssignments.experimentId, experimentId),
      eq(experimentAssignments.sessionId, sessionId)
    ));
}

export async function getExperimentStats(experimentId: string) {
  const db = await getDb();
  if (!db) return null;

  const stats = await db.select({
    variantId: experimentAssignments.variantId,
    totalAssigned: sql<number>`count(*)`.as('totalAssigned'),
    totalExposed: sql<number>`sum(case when exposed = 1 then 1 else 0 end)`.as('totalExposed'),
  }).from(experimentAssignments)
    .where(eq(experimentAssignments.experimentId, experimentId))
    .groupBy(experimentAssignments.variantId);

  return stats;
}

// Policy analysis functions
export async function savePolicyAnalysis(analysis: InsertPolicyAnalysis) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(policyAnalysis).values(analysis);
}

export async function getPolicyAnalysis(hotelId: number, roomId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [eq(policyAnalysis.hotelId, hotelId)];
  if (roomId) conditions.push(eq(policyAnalysis.roomId, roomId));
  
  const result = await db.select().from(policyAnalysis)
    .where(and(...conditions))
    .orderBy(desc(policyAnalysis.createdAt))
    .limit(1);
  return result[0] || null;
}

// Analytics aggregation functions
export async function getDailyFunnelStats(startDate: Date, endDate: Date, experimentId?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    gte(trackingEvents.timestamp, startDate),
    lte(trackingEvents.timestamp, endDate)
  ];
  if (experimentId) conditions.push(eq(trackingEvents.experimentId, experimentId));

  const stats = await db.select({
    date: sql<string>`DATE(timestamp)`.as('date'),
    eventName: trackingEvents.eventName,
    variantId: trackingEvents.variantId,
    count: sql<number>`count(*)`.as('count'),
    uniqueUsers: sql<number>`count(distinct sessionId)`.as('uniqueUsers'),
  }).from(trackingEvents)
    .where(and(...conditions))
    .groupBy(sql`DATE(timestamp)`, trackingEvents.eventName, trackingEvents.variantId);

  return stats;
}

export async function getConversionMetrics(experimentId?: string) {
  const db = await getDb();
  if (!db) return null;

  const conditions = experimentId ? [eq(trackingEvents.experimentId, experimentId)] : [];

  // Get funnel stages
  const funnelEvents = ['search_result_view', 'hotel_detail_view', 'booking_start', 'booking_submit', 'pay_success'];
  
  const metrics = await Promise.all(funnelEvents.map(async (eventName) => {
    const result = await db.select({
      variantId: trackingEvents.variantId,
      count: sql<number>`count(distinct sessionId)`.as('count'),
    }).from(trackingEvents)
      .where(and(eq(trackingEvents.eventName, eventName), ...conditions))
      .groupBy(trackingEvents.variantId);
    
    return { eventName, data: result };
  }));

  return metrics;
}
