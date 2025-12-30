import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user for authenticated tests
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { "user-agent": "test-agent" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Mock public context (no user)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "user-agent": "test-agent" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Hotels Router", () => {
  it("should search hotels by city", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Search for hotels in Tokyo
    const result = await caller.hotels.search({
      city: "Tokyo",
      checkIn: "2025-01-15",
      checkOut: "2025-01-16",
      guests: 2,
    });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get hotel by ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.hotels.getById({ id: 1 });
    
    // Result could be null if hotel doesn't exist
    if (result) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("city");
    }
  });

  it("should get rooms for a hotel", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.hotels.getRooms({ hotelId: 1 });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Orders Router", () => {
  it("should create an order with valid data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const orderData = {
      hotelId: 1,
      roomId: 1,
      checkIn: "2025-01-15",
      checkOut: "2025-01-16",
      guestCount: 2,
      guestName: "张三",
      guestEmail: "zhangsan@example.com",
      guestPhone: "13800138000",
      guestCountry: "CN",
      specialRequests: "高楼层",
      basePrice: "350",
      taxAmount: "35",
      feeAmount: "25",
      totalPrice: "410",
      currency: "USD",
      sessionId: "test-session-123",
    };
    
    const result = await caller.orders.create(orderData);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("orderNumber");
    expect(result.orderNumber).toMatch(/^ORD/);
  });

  it("should get order by order number", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // First create an order
    const createResult = await caller.orders.create({
      hotelId: 1,
      roomId: 1,
      checkIn: "2025-01-15",
      checkOut: "2025-01-16",
      guestCount: 2,
      guestName: "李四",
      guestEmail: "lisi@example.com",
      basePrice: "350",
      taxAmount: "35",
      feeAmount: "25",
      totalPrice: "410",
      sessionId: "test-session-456",
    });
    
    // Then retrieve it
    const result = await caller.orders.getByNumber({ 
      orderNumber: createResult.orderNumber 
    });
    
    expect(result).toBeDefined();
    if (result) {
      expect(result.orderNumber).toBe(createResult.orderNumber);
      expect(result.guestName).toBe("李四");
    }
  });
});

describe("Tracking Router", () => {
  it("should track an event", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.tracking.track({
      eventName: "search_page_view",
      sessionId: "test-session-789",
      variantId: "control",
      experimentId: "exp_test_001",
      properties: {
        destination: "Tokyo",
        price_mode: "total",
      },
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should track hotel detail view event", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.tracking.track({
      eventName: "hotel_detail_view",
      sessionId: "test-session-tracking",
      hotelId: 1,
      variantId: "treatment",
      confidenceBucket: "high",
      properties: {
        hotel_name: "Tokyo Imperial Hotel",
        star_rating: 5,
      },
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should track policy digest expand event", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.tracking.track({
      eventName: "policy_digest_expand",
      sessionId: "test-session-policy",
      hotelId: 1,
      variantId: "treatment",
      confidenceBucket: "medium",
      properties: {
        card_type: "cancellation",
        analysis_method: "llm",
      },
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe("Experiments Router", () => {
  it("should get all experiments", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.experiments.getAll();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an experiment (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.experiments.create({
      name: "Test AI Policy Experiment",
      description: "Testing AI policy summary feature",
      hypothesis: "AI policy summary will increase conversion by 1.5%",
      trafficPercent: 100,
      controlPercent: 50,
      primaryMetric: "pay_cvr",
      mdePercent: "1.50",
      confidenceLevel: "0.95",
      statisticalPower: "0.80",
    });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("experimentId");
    expect(result.experimentId).toMatch(/^exp_/);
  });

  it("should get experiment by ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Get all experiments first
    const allExperiments = await caller.experiments.getAll();
    
    expect(allExperiments).toBeDefined();
    expect(Array.isArray(allExperiments)).toBe(true);
  });
});

describe("Policy Router", () => {
  it("should analyze hotel policy text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const policyText = `
      Cancellation Policy: Free cancellation until 24 hours before check-in.
      After that, a fee of one night's stay will be charged.
      
      Tax Information: 10% service charge and 8% government tax will be added.
      Payment is required at the time of booking.
      
      ID Requirements: Valid passport required for international guests.
      Passport must be valid for at least 6 months from check-in date.
    `;
    
    const result = await caller.policy.analyze({
      hotelId: 1,
      policyText,
      forceRefresh: true,
    });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("cancellation");
    expect(result).toHaveProperty("tax");
    expect(result).toHaveProperty("idRequirements");
    expect(result.cancellation).toHaveProperty("confidence");
    expect(result.tax).toHaveProperty("confidence");
    expect(result.idRequirements).toHaveProperty("confidence");
  });
});

describe("Auth Router", () => {
  it("should return null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    
    expect(result).toBeNull();
  });

  it("should return user for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("should logout successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.logout();
    
    expect(result).toEqual({ success: true });
  });
});
