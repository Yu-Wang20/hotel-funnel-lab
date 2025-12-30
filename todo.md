# Hotel Funnel Lab - Project TODO

## Phase 1: Database & Core Setup
- [x] Design database schema (hotels, rooms, orders, events, experiments, users)
- [x] Create seed data for hotels and rooms
- [x] Set up tracking event storage

## Phase 2: Hotel Search
- [x] Search page with destination input
- [x] Check-in/check-out date pickers
- [x] Guest count selector
- [x] Price mode toggle (Total/Net)

## Phase 3: Hotel Listing
- [x] Hotel cards with price, rating, location
- [x] Sorting (recommendation, price, rating)
- [x] Filters (price range, star rating, free cancellation)
- [x] Price mode toggle at top of page

## Phase 4: Hotel Detail Page
- [x] AI policy summary card (cancellation, tax, ID requirements)
- [x] Price breakdown display (Base + Tax + Fees)
- [x] Room type selection
- [x] Review summary section
- [x] Google Maps integration with landmarks

## Phase 5: AI Policy Assistant
- [x] LLM integration for policy extraction
- [x] Structured output (cancellation rules, tax model, ID requirements)
- [x] Evidence citations with clickable links
- [x] Confidence level indicators
- [x] Fallback rule-based templates

## Phase 6: Booking & Payment
- [x] Guest information form
- [x] Contact details input
- [x] Mock payment system
- [x] Order number generation
- [x] Order detail page

## Phase 7: Event Tracking System (15+ events)
- [x] search_initiated
- [x] search_result_view
- [x] search_result_click
- [x] hotel_detail_view
- [x] policy_digest_impression
- [x] policy_digest_expand
- [x] policy_evidence_click
- [x] price_toggle_change
- [x] room_select
- [x] booking_start
- [x] booking_submit
- [x] pay_success
- [x] order_view
- [x] order_cancel
- [x] contact_click
- [x] All events include variant_id and confidence_bucket

## Phase 8: Analytics Dashboard
- [x] Real-time funnel visualization
- [x] Conversion rate metrics
- [x] Decision time tracking
- [x] AI summary click rate
- [x] Guardrail metrics (cancellation rate, contact rate)

## Phase 9: A/B Testing Framework
- [x] Experiment configuration UI
- [x] 50/50 user_id hash-based bucketing
- [x] Exposure definition settings
- [x] Attribution window (24h)
- [x] SRM (Sample Ratio Mismatch) checks

## Phase 10: Statistical Analysis
- [x] Confidence interval calculation
- [x] P-value display
- [x] Statistical significance tests
- [x] Sample size calculator (MDE settings)
- [x] Cohort analysis (new/returning, price bands, countries)

## Phase 11: Documentation Hub
- [x] PRD document display
- [x] Tracking plan (event dictionary)
- [x] KPI tree visualization
- [x] A/B experiment retrospective reports
- [x] Project roadmap

## Phase 12: Polish & Delivery
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Final testing
- [x] Checkpoint and delivery
