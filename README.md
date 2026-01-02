# Hotel Funnel Lab
**A comprehensive hotel booking funnel optimization and AI-powered experiment platform for Trip.com-like international booking flows.**

This project is an end-to-end product + analytics laboratory that simulates a cross-border hotel booking journey and provides a practical framework to:
- instrument key funnel events,
- diagnose drop-offs,
- run controlled experiments (A/B tests),
- and ship AI-assisted product improvements (e.g., policy explanations and decision support).

> Positioning: A production-minded portfolio project demonstrating product thinking, analytics rigor, and full-stack implementation for international travel commerce.

---

## Problem Statement

International hotel booking has structurally higher friction than domestic booking due to:
- **Price opacity** (tax/fee disclosure varies by country and supplier),
- **Policy complexity** (cancellation, prepayment, check-in rules, exceptions),
- **Decision overload** (room types, bundles, benefits, loyalty rules),
- and **trust gaps** (inconsistent content, unclear value comparisons).

These issues often concentrate at the **Detail → Checkout** portion of the funnel, where users abandon even after strong intent.

---

## What This Project Delivers

### Product Modules (User-Facing)
- **Search & List Flow**
  - Destination/date-based exploration flow
  - Emphasis on transparency controls such as **Total Price** vs. base price views
- **Hotel Detail Page (Key Optimization Surface)**
  - Structured presentation of price breakdown, policies, and room options
  - AI policy assistant to reduce confusion and support decision-making
- **Checkout Journey**
  - Minimal but complete path to demonstrate conversion flow
  - Forms + validation + order confirmation

### Analytics & Experimentation (Operator-Facing)
- **Event Tracking & Funnel Analytics**
  - Standardized event taxonomy (search, list view, item click, detail view, checkout start, purchase)
  - Funnel conversion breakdown and drop-off diagnosis
- **A/B Testing Harness**
  - Experiment configuration (variant assignment, exposure tracking)
  - KPI impact comparison for key metrics (CTR, conversion, time-to-purchase, bounce)
- **Dashboard**
  - Core KPIs, trend charts, and experiment views for analysis and iteration

---

## Repository Structure

- `client/`  
  Frontend application (booking UI + analytics dashboard).
- `server/`  
  Backend services (APIs, experiment assignment, event ingestion).
- `shared/`  
  Shared types/utilities used across client and server.
- `drizzle/`  
  Database schema/migrations (Drizzle ORM).
- `.manus/db`  
  Local development database artifacts (generated during development).
- `patches/`  
  Patch files and local fixes applied during development.

Demo & Screenshots
Example:
![Funnel Dashboard](./docs/screenshots/funnel-dashboard.png)
