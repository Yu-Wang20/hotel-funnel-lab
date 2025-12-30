/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Shared types for the Hotel Funnel Lab application

export interface SearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  minStars?: number;
  freeCancellation?: boolean;
  sortBy?: 'recommendation' | 'price_asc' | 'price_desc' | 'rating';
  priceMode?: 'total' | 'net';
}

export interface PolicyAnalysisResult {
  cancellation: {
    type: 'free_cancel' | 'penalty' | 'no_refund';
    freeCancelUntil: string | null;
    penaltyRules: { condition: string; amount: string }[];
    confidence: number;
  };
  tax: {
    payMode: 'online' | 'at_property' | 'mixed';
    estimatedRange: string | null;
    includedItems: string[];
    excludedItems: string[];
    confidence: number;
  };
  idRequirements: {
    docType: 'passport' | 'id_card' | 'either' | null;
    minValidMonths: number | null;
    specialNotes: string | null;
    confidence: number;
  };
  evidence: {
    field: string;
    start: number;
    end: number;
    text: string;
  }[];
  analysisMethod?: 'llm' | 'rule_based' | 'fallback';
  latencyMs?: number;
  fromCache?: boolean;
}

export interface FunnelStage {
  name: string;
  eventName: string;
  count: number;
  conversionRate?: number;
}

export interface ExperimentConfig {
  experimentId: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  trafficPercent: number;
  controlPercent: number;
  primaryMetric: string;
  secondaryMetrics: string[];
  guardrailMetrics: string[];
  mdePercent: number;
  confidenceLevel: number;
  statisticalPower: number;
  attributionWindowHours: number;
}

export interface TrackingEventPayload {
  eventName: string;
  sessionId: string;
  hotelId?: number;
  roomId?: number;
  orderId?: number;
  variantId?: string;
  experimentId?: string;
  confidenceBucket?: string;
  properties?: Record<string, unknown>;
  pageUrl?: string;
  referrer?: string;
  deviceType?: string;
  country?: string;
  language?: string;
}

// Event names for tracking
export const TRACKING_EVENTS = {
  // Search events
  SEARCH_INITIATED: 'search_initiated',
  SEARCH_RESULT_VIEW: 'search_result_view',
  SEARCH_RESULT_CLICK: 'search_result_click',
  
  // Hotel detail events
  HOTEL_DETAIL_VIEW: 'hotel_detail_view',
  POLICY_DIGEST_IMPRESSION: 'policy_digest_impression',
  POLICY_DIGEST_EXPAND: 'policy_digest_expand',
  POLICY_EVIDENCE_CLICK: 'policy_evidence_click',
  POLICY_FULLTEXT_VIEW: 'policy_fulltext_view',
  
  // Price events
  PRICE_TOGGLE_CHANGE: 'price_toggle_change',
  PRICE_BREAKDOWN_VIEW: 'price_breakdown_view',
  
  // Room events
  ROOM_SELECT: 'room_select',
  ROOM_COMPARE: 'room_compare',
  
  // Booking events
  BOOKING_START: 'booking_start',
  BOOKING_FORM_INTERACT: 'booking_form_interact',
  BOOKING_SUBMIT: 'booking_submit',
  
  // Payment events
  PAY_INITIATED: 'pay_initiated',
  PAY_SUCCESS: 'pay_success',
  PAY_FAILED: 'pay_failed',
  
  // Order events
  ORDER_VIEW: 'order_view',
  ORDER_CANCEL: 'order_cancel',
  
  // Support events
  CONTACT_CLICK: 'contact_click',
  FAQ_EXPAND: 'faq_expand',
  
  // Map events
  MAP_VIEW: 'map_view',
  MAP_LANDMARK_CLICK: 'map_landmark_click',
} as const;

export type TrackingEventName = typeof TRACKING_EVENTS[keyof typeof TRACKING_EVENTS];

// KPI definitions
export const KPI_DEFINITIONS = {
  // North Star
  PAY_CVR: {
    name: 'Pay CVR',
    description: 'Payment conversion rate (pay_success / hotel_detail_view)',
    formula: 'pay_success / hotel_detail_view',
    type: 'north_star',
  },
  ORDER_CVR: {
    name: 'Order CVR',
    description: 'Order creation rate (booking_submit / hotel_detail_view)',
    formula: 'booking_submit / hotel_detail_view',
    type: 'north_star',
  },
  
  // Driver metrics
  DETAIL_TO_BOOKING_CTR: {
    name: 'Detail to Booking CTR',
    description: 'Click-through rate from detail to booking',
    formula: 'booking_start / hotel_detail_view',
    type: 'driver',
  },
  AI_SUMMARY_CTR: {
    name: 'AI Summary CTR',
    description: 'AI policy summary click rate',
    formula: 'policy_digest_expand / policy_digest_impression',
    type: 'driver',
  },
  DECISION_TIME: {
    name: 'Decision Time',
    description: 'Average time from detail view to booking start',
    formula: 'avg(booking_start.timestamp - hotel_detail_view.timestamp)',
    type: 'driver',
  },
  
  // Guardrail metrics
  CANCELLATION_RATE: {
    name: 'Cancellation Rate',
    description: 'Order cancellation rate',
    formula: 'order_cancel / pay_success',
    type: 'guardrail',
  },
  CONTACT_RATE: {
    name: 'Contact Rate',
    description: 'Customer service contact rate',
    formula: 'contact_click / hotel_detail_view',
    type: 'guardrail',
  },
  PAGE_LATENCY_P95: {
    name: 'Page Latency P95',
    description: '95th percentile page load time',
    formula: 'p95(page_load_time)',
    type: 'guardrail',
  },
} as const;
