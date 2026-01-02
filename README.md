# Hotel Funnel Lab — International Hotel Booking Experiment Platform

Hotel Funnel Lab is a product + analytics prototype that demonstrates how to improve an **international hotel booking funnel** through:
- **Transparent pricing (net vs. total price with taxes/fees)**
- **AI-assisted policy understanding (cancellation / taxes / ID requirements)**
- **Funnel instrumentation & KPI dashboards**
- **Built-in A/B experiment management**

Live demo (if available): `https://hotelfunnel-fiurddsy.manus.space`

---

## Why this project exists

International hotel booking has three recurring conversion killers:

1. **Hidden fees / tax surprises**  
   Users see a “net price” in listings and only discover the real cost late in the flow.

2. **Policy complexity**  
   Cancellation / refund / tax / ID policies are often long and difficult to parse quickly.

3. **Optimization without an experimentation loop**  
   Teams can’t reliably answer “Did this change help?” without clear metrics, event definitions, and experiment analysis.

Hotel Funnel Lab turns these problems into a **closed-loop optimization system**:  
**Hypothesis → Experiment → Measurement → Insight → Iteration**

---

## Key features

### 1) Search entry + pricing transparency
- A hotel search entry page with destination, date range, and guests
- **Price mode toggle**: Net price vs. **Total price (incl. taxes/fees)**  
  Goal: reduce price expectation mismatch and late-stage drop-offs.

### 2) Funnel dashboard (metrics + conversion diagnosis)
A dedicated analytics page to monitor core KPIs and diagnose leaks:
- High-level KPI cards (visits, detail page UV, orders, pay conversion)
- **Conversion funnel** visualization across stages (search → click → detail → booking → order → payment)
- Step-level conversion rates and drop-off highlights
- “Key insights” summary modules that call out:
  - Largest leakage stage
  - Best-performing stage
  - AI feature engagement impact (e.g., policy summary expand rate)

### 3) A/B experiment management
An experimentation console for designing and running product tests:
- Experiment list with status (draft / running)
- Traffic allocation (e.g., 50/50)
- Sample size and lift readouts
- Significance indicator (demo)

Example experiment shown in the demo:
- **AI policy summary optimization**: show structured policy cards on the detail page to reduce decision time and lift conversion.

### 4) Product documentation center (PRD + KPI tree + roadmap)
A built-in documentation hub to make the project “portfolio-grade” and reviewable:
- **PRD** (background, pain points, goals)
- **KPI tree** (north star metric and metric decomposition)
- **Roadmap** (phased plan: MVP flow → AI integration → data system → advanced analytics)

---

## What problems it solves (practical outcomes)

- **Reduces price shock** by making total cost visible earlier in the funnel
- **Lowers decision friction** by summarizing complex policies into structured, skimmable outputs
- **Improves iteration speed** by coupling:
  - a measurement layer (KPI + funnel)
  - an experimentation layer (A/B tests)
  - a documentation layer (PRD/KPIs/roadmap)

---

## Suggested improvements / optimization roadmap

This project is intentionally built as an MVP + platform skeleton. Strong next steps:

### A) Make it production-real (data + integrations)
- Connect to a real hotel data source (inventory, room rates, taxes/fees)
- Persist searches, sessions, bookings, and experiment assignments in a database
- Add currency conversion and localized fee/tax breakdown

### B) Instrumentation & analytics hardening
- Define an explicit **event taxonomy** (schema + naming rules)
- Add identity stitching (anonymous → logged-in)
- Add guardrail metrics (latency, errors, refund/contact rate proxies)
- Add cohort + segmentation (new vs returning, geo, device, price band)

### C) Experimentation system upgrades (serious A/B)
- Add CUPED / variance reduction
- Sequential testing / stopping rules, or Bayesian analysis option
- Multiple metrics: primary + guardrails + long-term proxies
- SRM checks (sample ratio mismatch), novelty effects, ramp plans

### D) AI policy assistant upgrades
- Add **citations / evidence** (highlight the policy text supporting each summary point)
- Add multilingual summaries + consistent terminology
- Add caching, streaming, and latency budgets (e.g., p95 < 2s)
- Add hallucination safeguards: “unknown / not found” pathways

### E) Product UX upgrades (conversion)
- Detail page: sticky total price, fee breakdown, policy chips, trust blocks
- Reduce form friction: autofill, validation, progressive disclosure
- Add “why this price” explanations (fees, resort fee, city tax)
- Accessibility + responsive polish

### F) Engineering quality
- Automated tests (unit + e2e)
- CI checks (lint/typecheck/build)
- Observability (logs/traces/errors)
- Containerization + repeatable deployments

---

## Screenshots (recommended)
Create an `assets/` folder and add screenshots, then embed like:

![Search](assets/search.png)
![Dashboard](assets/dashboard.png)
![Experiments](assets/experiments.png)
![Docs](assets/docs.png)

---

## License
Choose one:
- MIT (recommended for portfolios)
- Apache-2.0
- GPL-3.0

Add a `LICENSE` file accordingly.

---

## Disclaimer
This repository is a product/analytics demo. Any metrics shown in the UI may be illustrative unless wired to real event tracking and data pipelines.

