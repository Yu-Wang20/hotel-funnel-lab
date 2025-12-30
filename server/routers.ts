import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { invokeLLM, InvokeResult } from "./_core/llm";

// Hash function for A/B test bucketing
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function assignVariant(sessionId: string, controlPercent: number = 50): 'control' | 'treatment' {
  const hash = hashStringToNumber(sessionId);
  return (hash % 100) < controlPercent ? 'control' : 'treatment';
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Hotel routes
  hotels: router({
    search: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        guests: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minStars: z.number().optional(),
        freeCancellation: z.boolean().optional(),
        sortBy: z.enum(['recommendation', 'price_asc', 'price_desc', 'rating']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchHotels({
          ...input,
          checkIn: input.checkIn ? new Date(input.checkIn) : undefined,
          checkOut: input.checkOut ? new Date(input.checkOut) : undefined,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getHotelById(input.id);
      }),

    getAll: publicProcedure.query(async () => {
      return await db.getAllHotels();
    }),

    getRooms: publicProcedure
      .input(z.object({ hotelId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRoomsByHotelId(input.hotelId);
      }),
  }),

  // Order routes
  orders: router({
    create: publicProcedure
      .input(z.object({
        hotelId: z.number(),
        roomId: z.number(),
        checkIn: z.string(),
        checkOut: z.string(),
        guestCount: z.number(),
        guestName: z.string(),
        guestEmail: z.string(),
        guestPhone: z.string().optional(),
        guestCountry: z.string().optional(),
        specialRequests: z.string().optional(),
        basePrice: z.string(),
        taxAmount: z.string(),
        feeAmount: z.string(),
        totalPrice: z.string(),
        currency: z.string().optional(),
        variantId: z.string().optional(),
        experimentId: z.string().optional(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderNumber = `ORD${Date.now()}${nanoid(6).toUpperCase()}`;
        // Handle empty dates - default to tomorrow and day after
        const now = new Date();
        const defaultCheckIn = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const defaultCheckOut = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        
        const checkInDate = input.checkIn ? new Date(input.checkIn) : defaultCheckIn;
        const checkOutDate = input.checkOut ? new Date(input.checkOut) : defaultCheckOut;
        
        await db.createOrder({
          orderNumber,
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          hotelId: input.hotelId,
          roomId: input.roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guestCount: input.guestCount,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          guestCountry: input.guestCountry,
          specialRequests: input.specialRequests,
          basePrice: input.basePrice,
          taxAmount: input.taxAmount,
          feeAmount: input.feeAmount,
          totalPrice: input.totalPrice,
          currency: input.currency || 'USD',
          variantId: input.variantId,
          experimentId: input.experimentId,
          status: 'confirmed',
          paymentStatus: 'paid',
        });
        return { orderNumber };
      }),

    getByNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getOrderByNumber(input.orderNumber);
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByUserId(ctx.user.id);
    }),

    cancel: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderNumber, 'cancelled');
        return { success: true };
      }),
  }),

  // Tracking routes
  tracking: router({
    track: publicProcedure
      .input(z.object({
        eventName: z.string(),
        sessionId: z.string(),
        hotelId: z.number().optional(),
        roomId: z.number().optional(),
        orderId: z.number().optional(),
        variantId: z.string().optional(),
        experimentId: z.string().optional(),
        confidenceBucket: z.string().optional(),
        properties: z.record(z.string(), z.unknown()).optional(),
        pageUrl: z.string().optional(),
        referrer: z.string().optional(),
        deviceType: z.string().optional(),
        country: z.string().optional(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.trackEvent({
          ...input,
          userId: ctx.user?.id,
          userAgent: ctx.req.headers['user-agent'] as string,
        });
        return { success: true };
      }),

    getEvents: publicProcedure
      .input(z.object({
        eventName: z.string().optional(),
        sessionId: z.string().optional(),
        experimentId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getTrackingEvents({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    getFunnelMetrics: publicProcedure
      .input(z.object({ experimentId: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getFunnelMetrics(input.experimentId);
      }),

    getDailyStats: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        experimentId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getDailyFunnelStats(
          new Date(input.startDate),
          new Date(input.endDate),
          input.experimentId
        );
      }),

    getConversionMetrics: publicProcedure
      .input(z.object({ experimentId: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getConversionMetrics(input.experimentId);
      }),
  }),

  // Experiment routes
  experiments: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        hypothesis: z.string().optional(),
        trafficPercent: z.number().optional(),
        controlPercent: z.number().optional(),
        targetCountries: z.array(z.string()).optional(),
        targetUserTypes: z.array(z.string()).optional(),
        primaryMetric: z.string().optional(),
        secondaryMetrics: z.array(z.string()).optional(),
        guardrailMetrics: z.array(z.string()).optional(),
        mdePercent: z.string().optional(),
        confidenceLevel: z.string().optional(),
        statisticalPower: z.string().optional(),
        attributionWindowHours: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const experimentId = `exp_${nanoid(12)}`;
        await db.createExperiment({
          experimentId,
          ...input,
        });
        return { experimentId };
      }),

    getById: publicProcedure
      .input(z.object({ experimentId: z.string() }))
      .query(async ({ input }) => {
        return await db.getExperimentById(input.experimentId);
      }),

    getAll: publicProcedure.query(async () => {
      return await db.getAllExperiments();
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        experimentId: z.string(),
        status: z.enum(['draft', 'running', 'paused', 'completed']),
      }))
      .mutation(async ({ input }) => {
        await db.updateExperimentStatus(input.experimentId, input.status);
        return { success: true };
      }),

    assignUser: publicProcedure
      .input(z.object({
        experimentId: z.string(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if already assigned
        const existing = await db.getExperimentAssignment(input.experimentId, input.sessionId);
        if (existing) {
          return { variantId: existing.variantId, alreadyAssigned: true };
        }

        // Get experiment config
        const experiment = await db.getExperimentById(input.experimentId);
        if (!experiment || experiment.status !== 'running') {
          return { variantId: 'control', alreadyAssigned: false };
        }

        // Assign based on hash
        const variantId = assignVariant(input.sessionId, experiment.controlPercent || 50);
        await db.assignUserToExperiment({
          experimentId: input.experimentId,
          sessionId: input.sessionId,
          userId: ctx.user?.id,
          variantId,
        });

        return { variantId, alreadyAssigned: false };
      }),

    markExposure: publicProcedure
      .input(z.object({
        experimentId: z.string(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.markExposure(input.experimentId, input.sessionId);
        return { success: true };
      }),

    getStats: publicProcedure
      .input(z.object({ experimentId: z.string() }))
      .query(async ({ input }) => {
        return await db.getExperimentStats(input.experimentId);
      }),
  }),

  // AI Policy Analysis routes
  policy: router({
    analyze: publicProcedure
      .input(z.object({
        hotelId: z.number(),
        roomId: z.number().optional(),
        policyText: z.string(),
        forceRefresh: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check cache first
        if (!input.forceRefresh) {
          const cached = await db.getPolicyAnalysis(input.hotelId, input.roomId);
          if (cached && Date.now() - new Date(cached.createdAt).getTime() < 24 * 60 * 60 * 1000) {
            // Transform cached data to match expected format
            return {
              cancellation: {
                type: cached.cancellationType || 'penalty',
                freeCancelUntil: cached.freeCancelUntil,
                penaltyRules: cached.penaltyRules || [],
                confidence: parseFloat(String(cached.cancellationConfidence)) || 0.5,
              },
              tax: {
                payMode: cached.taxPayMode || 'mixed',
                estimatedRange: cached.estimatedTaxRange,
                includedItems: cached.includedItems || [],
                excludedItems: cached.excludedItems || [],
                confidence: parseFloat(String(cached.taxConfidence)) || 0.5,
              },
              idRequirements: {
                docType: cached.idDocType,
                minValidMonths: cached.idMinValidMonths,
                specialNotes: cached.idSpecialNotes,
                confidence: parseFloat(String(cached.idConfidence)) || 0.5,
              },
              evidence: cached.evidenceSpans || [],
              analysisMethod: cached.analysisMethod || 'cached',
              latencyMs: cached.llmLatencyMs || 0,
              fromCache: true,
            };
          }
        }

        const startTime = Date.now();
        let analysisMethod = 'llm';
        let result: any;

        try {
          // Try LLM analysis with timeout
          const llmPromise = invokeLLM({
            // @ts-ignore - response_format is valid
            messages: [
              {
                role: "system",
                content: `You are a hotel policy analyst. Extract structured information from hotel policy text.
                
Output JSON with this exact structure:
{
  "cancellation": {
    "type": "free_cancel" | "penalty" | "no_refund",
    "freeCancelUntil": "string or null",
    "penaltyRules": [{"condition": "string", "amount": "string"}],
    "confidence": 0.0-1.0
  },
  "tax": {
    "payMode": "online" | "at_property" | "mixed",
    "estimatedRange": "string or null",
    "includedItems": ["string"],
    "excludedItems": ["string"],
    "confidence": 0.0-1.0
  },
  "idRequirements": {
    "docType": "passport" | "id_card" | "either" | null,
    "minValidMonths": number or null,
    "specialNotes": "string or null",
    "confidence": 0.0-1.0
  },
  "evidence": [
    {"field": "cancellation|tax|idRequirements", "start": number, "end": number, "text": "quoted text"}
  ]
}`
              },
              {
                role: "user",
                content: `Analyze this hotel policy and extract structured information:\n\n${input.policyText}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "policy_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    cancellation: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["free_cancel", "penalty", "no_refund"] },
                        freeCancelUntil: { type: ["string", "null"] },
                        penaltyRules: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              condition: { type: "string" },
                              amount: { type: "string" }
                            },
                            required: ["condition", "amount"],
                            additionalProperties: false
                          }
                        },
                        confidence: { type: "number" }
                      },
                      required: ["type", "freeCancelUntil", "penaltyRules", "confidence"],
                      additionalProperties: false
                    },
                    tax: {
                      type: "object",
                      properties: {
                        payMode: { type: "string", enum: ["online", "at_property", "mixed"] },
                        estimatedRange: { type: ["string", "null"] },
                        includedItems: { type: "array", items: { type: "string" } },
                        excludedItems: { type: "array", items: { type: "string" } },
                        confidence: { type: "number" }
                      },
                      required: ["payMode", "estimatedRange", "includedItems", "excludedItems", "confidence"],
                      additionalProperties: false
                    },
                    idRequirements: {
                      type: "object",
                      properties: {
                        docType: { type: ["string", "null"], enum: ["passport", "id_card", "either", null] },
                        minValidMonths: { type: ["integer", "null"] },
                        specialNotes: { type: ["string", "null"] },
                        confidence: { type: "number" }
                      },
                      required: ["docType", "minValidMonths", "specialNotes", "confidence"],
                      additionalProperties: false
                    },
                    evidence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          field: { type: "string" },
                          start: { type: "integer" },
                          end: { type: "integer" },
                          text: { type: "string" }
                        },
                        required: ["field", "start", "end", "text"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["cancellation", "tax", "idRequirements", "evidence"],
                  additionalProperties: false
                }
              }
            }
          });

          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('LLM timeout')), 10000)
          );

          const llmResponse = await Promise.race([llmPromise, timeoutPromise]);
          const content = llmResponse.choices[0].message.content;
          result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
        } catch (error) {
          // Fallback to rule-based analysis
          analysisMethod = 'rule_based';
          result = extractPolicyWithRules(input.policyText);
        }

        const latency = Date.now() - startTime;

        // Save to database
        const analysisRecord = {
          hotelId: input.hotelId,
          roomId: input.roomId,
          cancellationType: result.cancellation.type,
          freeCancelUntil: result.cancellation.freeCancelUntil,
          penaltyRules: result.cancellation.penaltyRules,
          taxPayMode: result.tax.payMode,
          estimatedTaxRange: result.tax.estimatedRange,
          includedItems: result.tax.includedItems,
          excludedItems: result.tax.excludedItems,
          idDocType: result.idRequirements.docType,
          idMinValidMonths: result.idRequirements.minValidMonths,
          idSpecialNotes: result.idRequirements.specialNotes,
          cancellationConfidence: String(result.cancellation.confidence),
          taxConfidence: String(result.tax.confidence),
          idConfidence: String(result.idRequirements.confidence),
          evidenceSpans: result.evidence,
          sourceText: input.policyText,
          analysisMethod,
          llmLatencyMs: latency,
        };

        await db.savePolicyAnalysis(analysisRecord);

        return {
          ...result,
          analysisMethod,
          latencyMs: latency,
          fromCache: false,
        };
      }),

    getCached: publicProcedure
      .input(z.object({
        hotelId: z.number(),
        roomId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPolicyAnalysis(input.hotelId, input.roomId);
      }),
  }),

  // Seed data route (for demo purposes)
  seed: router({
    hotels: protectedProcedure.mutation(async () => {
      const sampleHotels = getSampleHotels();
      for (const hotel of sampleHotels) {
        await db.createHotel(hotel);
      }
      return { success: true, count: sampleHotels.length };
    }),

    rooms: protectedProcedure
      .input(z.object({ hotelId: z.number() }))
      .mutation(async ({ input }) => {
        const sampleRooms = getSampleRooms(input.hotelId);
        for (const room of sampleRooms) {
          await db.createRoom(room);
        }
        return { success: true, count: sampleRooms.length };
      }),
  }),
});

// Rule-based fallback for policy extraction
function extractPolicyWithRules(text: string) {
  const lowerText = text.toLowerCase();
  
  // Cancellation detection
  let cancellationType = 'penalty';
  let freeCancelUntil = null;
  if (lowerText.includes('free cancellation') || lowerText.includes('cancel for free')) {
    cancellationType = 'free_cancel';
    const match = text.match(/free cancellation until (\d+ hours?|\d+ days?|[A-Za-z]+ \d+)/i);
    if (match) freeCancelUntil = match[1];
  } else if (lowerText.includes('non-refundable') || lowerText.includes('no refund')) {
    cancellationType = 'no_refund';
  }

  // Tax detection
  let taxPayMode = 'online';
  if (lowerText.includes('pay at property') || lowerText.includes('pay at hotel')) {
    taxPayMode = 'at_property';
  } else if (lowerText.includes('taxes not included')) {
    taxPayMode = 'mixed';
  }

  // ID detection
  let idDocType = null;
  let minValidMonths = null;
  if (lowerText.includes('passport')) {
    idDocType = 'passport';
    const validMatch = text.match(/(\d+) months? valid/i);
    if (validMatch) minValidMonths = parseInt(validMatch[1]);
  }

  return {
    cancellation: {
      type: cancellationType,
      freeCancelUntil,
      penaltyRules: [],
      confidence: 0.6
    },
    tax: {
      payMode: taxPayMode,
      estimatedRange: null,
      includedItems: [],
      excludedItems: [],
      confidence: 0.5
    },
    idRequirements: {
      docType: idDocType,
      minValidMonths,
      specialNotes: null,
      confidence: 0.4
    },
    evidence: []
  };
}

// Sample data generators
function getSampleHotels() {
  return [
    {
      name: "东京湾希尔顿酒店",
      nameEn: "Hilton Tokyo Bay",
      city: "Tokyo",
      country: "Japan",
      address: "1-8 Maihama, Urayasu, Chiba 279-0031",
      latitude: "35.6329",
      longitude: "139.8847",
      starRating: 5,
      reviewScore: "8.7",
      reviewCount: 2456,
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"
      ],
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking"],
      description: "位于东京迪士尼度假区的豪华酒店，享有东京湾美景。",
      descriptionEn: "Luxury hotel located in Tokyo Disney Resort with stunning views of Tokyo Bay.",
      policyText: `CANCELLATION POLICY: Free cancellation is available until 24 hours before check-in. Cancellations made within 24 hours of check-in will incur a charge equal to the first night's stay. No-shows will be charged the full reservation amount.

TAX AND FEES: Room rates are subject to 10% consumption tax and 150 JPY per night accommodation tax. These taxes are included in the displayed total price. A service charge of 10% may apply to certain services.

IDENTIFICATION REQUIREMENTS: All guests must present a valid passport at check-in. For international guests, passports must be valid for at least 6 months from the date of arrival. Japanese nationals may use a government-issued ID card.

CHECK-IN/CHECK-OUT: Check-in time is 3:00 PM. Check-out time is 12:00 PM. Early check-in and late check-out may be available upon request and subject to availability and additional charges.`,
      nearbyLandmarks: [
        { name: "Tokyo Disneyland", distance: "0.5 km", type: "attraction" },
        { name: "Tokyo DisneySea", distance: "1.2 km", type: "attraction" },
        { name: "Maihama Station", distance: "0.3 km", type: "transport" }
      ]
    },
    {
      name: "新加坡滨海湾金沙酒店",
      nameEn: "Marina Bay Sands",
      city: "Singapore",
      country: "Singapore",
      address: "10 Bayfront Avenue, Singapore 018956",
      latitude: "1.2834",
      longitude: "103.8607",
      starRating: 5,
      reviewScore: "9.1",
      reviewCount: 5678,
      imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
      images: [
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
        "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800"
      ],
      amenities: ["Infinity Pool", "Casino", "Shopping Mall", "Spa", "Multiple Restaurants"],
      description: "新加坡地标性建筑，拥有世界著名的无边泳池。",
      descriptionEn: "Iconic Singapore landmark featuring the world-famous infinity pool.",
      policyText: `BOOKING CONDITIONS: This reservation is non-refundable. Full payment is required at the time of booking. No changes or cancellations are permitted once the booking is confirmed.

TAXES: All rates are subject to 10% service charge and 8% GST (Goods and Services Tax). Tourism tax of SGD 10 per room per night applies. All taxes will be collected at the property upon check-out.

GUEST REQUIREMENTS: Valid passport or Singapore NRIC required for all guests. International visitors must ensure their passport is valid for the duration of stay. Guests under 21 years of age are not permitted in the casino areas.

DEPOSIT: A credit card authorization or cash deposit of SGD 200 per night is required at check-in for incidentals.`,
      nearbyLandmarks: [
        { name: "Gardens by the Bay", distance: "0.2 km", type: "attraction" },
        { name: "Merlion Park", distance: "0.8 km", type: "attraction" },
        { name: "Bayfront MRT", distance: "0.1 km", type: "transport" }
      ]
    },
    {
      name: "巴黎丽兹酒店",
      nameEn: "Ritz Paris",
      city: "Paris",
      country: "France",
      address: "15 Place Vendôme, 75001 Paris",
      latitude: "48.8683",
      longitude: "2.3294",
      starRating: 5,
      reviewScore: "9.5",
      reviewCount: 1234,
      imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      images: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"
      ],
      amenities: ["Michelin Restaurant", "Spa", "Bar Hemingway", "Concierge", "Valet"],
      description: "传奇的巴黎奢华酒店，位于旺多姆广场。",
      descriptionEn: "Legendary Parisian luxury hotel located on Place Vendôme.",
      policyText: `CANCELLATION: Reservations may be cancelled free of charge up to 72 hours prior to arrival. Cancellations within 72 hours will be charged one night's accommodation. For suite bookings, cancellation must be made 7 days in advance.

PAYMENT: A deposit equal to the first night's stay is required to confirm the reservation. The balance is due upon check-out. We accept all major credit cards.

CITY TAX: Paris city tax (taxe de séjour) of €5 per person per night applies and is payable directly at the hotel. VAT at 10% is included in all room rates.

IDENTIFICATION: A valid passport or EU national ID card is required at check-in. For non-EU guests, passport must be valid for at least 3 months beyond the planned departure date from the Schengen area.`,
      nearbyLandmarks: [
        { name: "Louvre Museum", distance: "0.5 km", type: "attraction" },
        { name: "Opéra Garnier", distance: "0.6 km", type: "attraction" },
        { name: "Tuileries Metro", distance: "0.2 km", type: "transport" }
      ]
    },
    {
      name: "纽约华尔道夫酒店",
      nameEn: "The Waldorf Astoria New York",
      city: "New York",
      country: "USA",
      address: "301 Park Avenue, New York, NY 10022",
      latitude: "40.7565",
      longitude: "-73.9738",
      starRating: 5,
      reviewScore: "8.9",
      reviewCount: 3456,
      imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"
      ],
      amenities: ["Spa", "Fitness Center", "Restaurant", "Bar", "Business Center"],
      description: "纽约市中心的标志性豪华酒店。",
      descriptionEn: "Iconic luxury hotel in the heart of New York City.",
      policyText: `CANCELLATION POLICY: Free cancellation up to 48 hours before check-in. Late cancellation or no-show will result in a charge of one night's room rate plus tax.

TAXES AND FEES: Room rates are subject to New York State sales tax (8.875%), New York City hotel occupancy tax (5.875%), and a $2 per night NYC hotel unit fee. A destination fee of $35 per night plus tax applies and includes WiFi, fitness center access, and local calls.

IDENTIFICATION: Government-issued photo ID required at check-in. International guests must present a valid passport.

PAYMENT: Credit card required at booking. Full prepayment may be required for certain rate types. A $100 per night incidental deposit will be authorized at check-in.`,
      nearbyLandmarks: [
        { name: "Grand Central Terminal", distance: "0.3 km", type: "transport" },
        { name: "Rockefeller Center", distance: "0.5 km", type: "attraction" },
        { name: "Central Park", distance: "0.8 km", type: "attraction" }
      ]
    },
    {
      name: "迪拜帆船酒店",
      nameEn: "Burj Al Arab Jumeirah",
      city: "Dubai",
      country: "UAE",
      address: "Jumeirah Beach Road, Dubai",
      latitude: "25.1412",
      longitude: "55.1855",
      starRating: 5,
      reviewScore: "9.3",
      reviewCount: 2890,
      imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
        "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800"
      ],
      amenities: ["Private Beach", "Helipad", "Spa", "9 Restaurants", "Butler Service"],
      description: "世界上最奢华的酒店之一，帆船造型的标志性建筑。",
      descriptionEn: "One of the world's most luxurious hotels with its iconic sail-shaped architecture.",
      policyText: `RESERVATION POLICY: All reservations require a non-refundable deposit of 50% at the time of booking. The remaining balance is due 14 days prior to arrival.

CANCELLATION: Cancellations made more than 30 days before arrival will receive a refund minus the deposit. Cancellations within 30 days of arrival are non-refundable.

TAXES: All rates are subject to 10% service charge, 10% municipality fee, and 5% VAT. Tourism Dirham fee of AED 20 per room per night applies.

DOCUMENTATION: Valid passport required for all guests. Visa requirements vary by nationality - please check with UAE immigration authorities. Guests must be at least 21 years of age to check in.

DRESS CODE: Smart casual attire is required in all public areas and restaurants.`,
      nearbyLandmarks: [
        { name: "Wild Wadi Waterpark", distance: "0.5 km", type: "attraction" },
        { name: "Mall of the Emirates", distance: "3 km", type: "shopping" },
        { name: "Dubai Marina", distance: "5 km", type: "attraction" }
      ]
    },
    {
      name: "香港半岛酒店",
      nameEn: "The Peninsula Hong Kong",
      city: "Hong Kong",
      country: "China",
      address: "Salisbury Road, Kowloon, Hong Kong",
      latitude: "22.2951",
      longitude: "114.1722",
      starRating: 5,
      reviewScore: "9.2",
      reviewCount: 4123,
      imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800"
      ],
      amenities: ["Rolls-Royce Fleet", "Helipad", "Spa", "Pool", "Afternoon Tea"],
      description: "香港最具传奇色彩的酒店，以其卓越服务闻名。",
      descriptionEn: "Hong Kong's most legendary hotel, renowned for its exceptional service.",
      policyText: `FLEXIBLE BOOKING: Free cancellation up to 24 hours before check-in for most room types. Advance Purchase rates are non-refundable.

TAXES: Room rates include 10% service charge. No additional government taxes apply in Hong Kong.

CHECK-IN REQUIREMENTS: Valid passport or HKID required. International guests should ensure their travel documents meet Hong Kong entry requirements.

DEPOSIT: Credit card guarantee required at booking. No cash deposit needed for credit card holders.

SPECIAL REQUESTS: Early check-in, late check-out, and room preferences are subject to availability. Airport transfers via Rolls-Royce can be arranged for an additional fee.`,
      nearbyLandmarks: [
        { name: "Victoria Harbour", distance: "0.1 km", type: "attraction" },
        { name: "Star Ferry", distance: "0.2 km", type: "transport" },
        { name: "Tsim Sha Tsui MTR", distance: "0.3 km", type: "transport" }
      ]
    }
  ];
}

function getSampleRooms(hotelId: number) {
  return [
    {
      hotelId,
      name: "豪华客房",
      nameEn: "Deluxe Room",
      description: "宽敞舒适的豪华客房，配备现代设施。",
      basePrice: "280.00",
      taxAmount: "42.00",
      feeAmount: "25.00",
      currency: "USD",
      maxGuests: 2,
      bedType: "King",
      roomSize: 35,
      amenities: ["WiFi", "Mini Bar", "Safe", "Air Conditioning"],
      imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      inventory: 15,
      freeCancellation: true,
      freeCancelUntil: "24 hours before check-in",
      cancellationPenalty: "First night charge for late cancellation",
      payAtProperty: false,
      prepayRequired: true,
      depositRequired: false,
    },
    {
      hotelId,
      name: "行政套房",
      nameEn: "Executive Suite",
      description: "宽敞的套房，独立起居区，行政酒廊特权。",
      basePrice: "520.00",
      taxAmount: "78.00",
      feeAmount: "45.00",
      currency: "USD",
      maxGuests: 3,
      bedType: "King",
      roomSize: 65,
      amenities: ["WiFi", "Mini Bar", "Safe", "Lounge Access", "Butler Service"],
      imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      inventory: 8,
      freeCancellation: true,
      freeCancelUntil: "48 hours before check-in",
      cancellationPenalty: "50% charge within 48 hours",
      payAtProperty: false,
      prepayRequired: true,
      depositRequired: true,
      depositAmount: "200.00",
    },
    {
      hotelId,
      name: "标准双床房",
      nameEn: "Standard Twin Room",
      description: "舒适的双床房，适合商务或休闲旅客。",
      basePrice: "220.00",
      taxAmount: "33.00",
      feeAmount: "20.00",
      currency: "USD",
      maxGuests: 2,
      bedType: "Twin",
      roomSize: 28,
      amenities: ["WiFi", "Mini Bar", "Safe"],
      imageUrl: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
      inventory: 20,
      freeCancellation: false,
      freeCancelUntil: null,
      cancellationPenalty: "Non-refundable",
      payAtProperty: true,
      prepayRequired: false,
      depositRequired: false,
    },
  ];
}

export type AppRouter = typeof appRouter;
