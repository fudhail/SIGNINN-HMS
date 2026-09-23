# SIGNINN-HMS: App Usability Deep Dive & Aiosell Integration Audit Report

**Audit Date:** September 23, 2026  
**System:** SIGNINN Hotel Management System (HMS) & Aiosell Channel Manager Live Integration  
**Environment:** Frontend (Vite/React/TailwindCSS), Backend (FastAPI/SQLAlchemy/SQLite), Aiosell Sandbox (`live.aiosell.com`)  

---

## 1. Executive Summary

This audit and optimization overhaul resolved three core goals:
1. **Direct Aiosell Channel Manager 2-Way Integration:** Connected SIGNINN-HMS to Aiosell's REST API v2 using HTTP Basic Authentication (`aiosell:AIOsell@123`), supporting all 26 partner integrations from the official spreadsheet (18 OTAs, 2 CMs, 3 Booking Engines, 3 Aggregators). Pushed and verified live rate updates (`₹2,499` for room `EXECUTIVE EP`, plan `S`, Oct 15–17, 2026) directly reflecting in the live Aiosell Sandbox UI at `https://live.aiosell.com`.
2. **Decommissioning Legacy Workarounds:** Completely dismantled redundant and confusing legacy features: email forwarding simulation, CSV reconcilers, and iCal sync tabs. Replaced them with streamlined channel manager tools (Push Suite, Fetch Suite, Webhook Ingestion, and Audit Logs).
3. **Comprehensive Page-by-Page Usability & Polish Run-Through:** Eliminated hardcoded dates, misleading static badges, non-functioning modals, and schema integrity constraints across the entire application.

---

## 2. Page-by-Page Deep Dive, Issues Identified & Fixes Implemented

### A. Operations Dashboard (`src/features/dashboard/DashboardView.tsx`)
- **Issues Identified:**
  1. *Hardcoded Header Date:* Rendered a static `"Wednesday, 16 Sep 2026"` date string regardless of the actual date.
  2. *Hardcoded Financial & Operational Metrics:*
     - Realized Revenue displayed a hardcoded `₹84,500` instead of calculating from active folio charges and payments.
     - In-House Guests used a fake formula `inHouseReservations.length * 2 + 12`.
     - Pending Tasks displayed a static `"7"`.
     - Subtitles displayed hardcoded `"4 check-ins expected"` and `"2 check-outs scheduled"`.
  3. *Static Triage Cards:* Displayed hardcoded fake issues (`"Room 105 & 204 require turnover"`, `"RES-8935 (Harish Kumar, Walk-in)"`, and `"Airbnb Rate Mapping Disparity"`).
- **Fixes Applied:**
  - Dynamic date formatting using `new Date().toLocaleDateString(...)` for true live operations.
  - Calculated revenue dynamically from checked-in folios and collected payments.
  - Calculated active guests from actual reservation guest occupancy (`adults + children`).
  - Dynamic pending task counter summing dirty rooms, unassigned arrivals, and open maintenance tickets.
  - Dynamically populated operational triage cards:
    - Housekeeping card displays real dirty room count and lists specific room numbers awaiting turnover.
    - Front Desk card displays real unassigned arrival count and guest name/category awaiting allocation.
    - Channel card reflects real-time status: `"Aiosell 2-Way Channel Sync"` across 26 connected channels.

---

### B. Channel Manager (`src/features/channels/ChannelsView.tsx`)
- **Issues Identified:**
  1. Cluttered UI with simulated email parsing, manual CSV upload reconcilers, and iCal calendar import/export.
  2. Only supported 4 hardcoded channels (MakeMyTrip, Booking.com, Agoda, Airbnb).
  3. No live integration with Aiosell's API endpoints or webhook format.
- **Fixes Applied:**
  - Removed all email, CSV, and iCal tabs and backend endpoints.
  - Seeded and integrated all **26 official partner channels** from the master spreadsheet categorized into OTAs, Channel Managers, Booking Engines, and Aggregators.
  - Built a comprehensive 5-tab suite:
    1. **Connected Channels:** Card/table grid with per-channel markup sliders, auto-ingest counters, and active listings.
    2. **Push Suite:** Broadcast Rates (`POST /update-rates/{pms}`), Inventory (`POST /update/{pms}`), Restrictions (Stop Sell, Min Stay, CTA/CTD), Channel Multipliers (`POST /channel_multiplier/{pms}`), and OTA No-Show reporting (`POST /marknoshow/{pms}`).
    3. **Fetch & Verify:** Live fetch of inventory, rates, and bookings from Aiosell API.
    4. **Webhook Simulator:** Test and verify incoming reservation actions (`book`, `modify`, `cancel`) with Basic Auth validation, optional guest details handling (Rule 11), and free-text special requests (Rule 12).
    5. **Audit Logs:** Immutable audit log of all channel synchronization events.

---

### C. Rates & Yield Pricing (`src/features/rates/RatesView.tsx`)
- **Issues Identified:**
  1. *Hardcoded Dates:* Sample matrix was hardcoded to `['2026-09-16'...'2026-09-22']`.
  2. *Dead Rate Inputs:* Rate matrix input cells were not bound to state and had no ability to push modified rates to channel distribution feeds.
  3. *Missing Plan Editor Modal:* Clicking "Edit Plan" (`setSelectedPlan(plan)`) never displayed an edit modal because the component only rendered the bulk surge modal.
- **Fixes Applied:**
  - Dynamic 7-day rolling window calculated from `new Date()`.
  - Rate inputs bound to dynamic state with quick editing support.
  - Added a direct **"Push Rates to Aiosell"** action that broadcasts modified baseline tariffs to Aiosell Channel Manager.
  - Built full **Edit Rate Plan Modal** allowing hoteliers to edit Plan Name, Meal Plan package (EP/CP/MAP/AP), Base Markup %, Discount %, Min Stay, and Cancellation Policies.

---

### D. Availability & Restrictions (`src/features/rates/AvailabilityView.tsx`)
- **Issues Identified:**
  1. Hardcoded date range from September 2026.
  2. Stop Sell and Min Stay toggles only existed in local React state and were never pushed to OTA channels.
- **Fixes Applied:**
  - Added rolling date generation with **7-Day / 14-Day toggle** and forward/backward date paging.
  - Added a direct **"Push Restrictions"** button that broadcasts Stop Sells and Minimum Stay rules directly to Aiosell Channel Manager (`POST /api/channels/aiosell/push-restrictions`).

---

### E. Reservation Tape Chart (`src/features/reservations/ReservationCalendar.tsx`)
- **Issues Identified:**
  1. Viewport was hardcoded to start on `2026-09-15`.
  2. Clicking the "Today" button hardcoded a jump back to `2026-09-15`.
- **Fixes Applied:**
  - Default start date dynamically initializes to yesterday (`new Date().setDate(now.getDate() - 1)`) so today's tape chart is immediately centered with context.
  - "Today" button dynamically resets to today's date.

---

### F. Navigation Sidebar (`src/components/layout/Sidebar.tsx`)
- **Issues Identified:**
  1. Displayed static, fake badge numbers:
     - Front Desk: `'4'`
     - Housekeeping: `'6'`
     - Maintenance: `'3'`
     - Messages: `'1'`
     These numbers never changed even when rooms were cleaned or maintenance was completed, causing confusion for staff.
- **Fixes Applied:**
  - Removed misleading static numeric badges.
  - Cleaned navigation items so badges are reserved exclusively for genuine system status indicators (`HQ` for Platform Super Admin, `Add-on` for optional modules).

---

### G. Financial Ledger & Invoicing (`backend/routers/billing.py`, `backend/models.py`, `backend/routers/reservations.py`)
- **Issues Identified:**
  1. Direct payment recording (`POST /api/billing/payments` for walk-ins, spa, dining) caused SQLite `IntegrityError: NOT NULL constraint failed: payments.reservation_ref` because `reservation_ref` was passed as `None`.
  2. Departure checkout invoice generation caused `TypeError: 'reservation_id' is an invalid keyword argument for Invoice` because `Invoice` model had `reservation_ref`, `grand_total`, `tax_total`, `date` instead of `reservation_id`, `amount`, `issued_at`.
  3. Housekeeping checkout turnover caused `TypeError: 'task_type' is an invalid keyword argument for HousekeepingTask`.
- **Fixes Applied:**
  - Made `payments.reservation_ref` nullable with default `"DIRECT"` for non-room settlements.
  - Added `reservation_id`, `amount`, `tax_amount`, and `issued_at` columns/aliases to `Invoice` model.
  - Added `task_type` column to `HousekeepingTask` model.
  - Ensured departure checkout invoices are generated with compliant Indian GST breakdown (CGST + SGST) and `"Paid"` settlement status.

### H. Role-Based Dashboard Access Architecture (`src/features/dashboard/DashboardView.tsx`, `src/components/layout/ViewRouter.tsx`)
- **Issues Identified:**
  1. Every staff member saw the exact same executive dashboard regardless of their role.
  2. Housekeeping attendants and maintenance technicians were exposed to macro financial charts, company revenue, and private folio balances.
  3. Front desk agents were burdened by executive portfolio metrics instead of immediate shift priorities (pending arrivals, checkouts, room assignments, walk-ins).
  4. Finance and Revenue Managers lacked purpose-built financial and yield distribution summaries.
- **Fixes Applied:**
  - Implemented tailored, role-specific dashboard views dynamically rendered based on the logged-in user's role:
    1. **Front Office (`Front Desk`, `Front Desk Agent`, `Night Auditor`):**
       - Primary KPIs: Expected Arrivals Today (checked in vs pending), Scheduled Departures, Ready Rooms to Sell, and Awaiting Room Allocation.
       - Shift Action Center: Unassigned arrivals due soon, dirty rooms in turnover, and departure folio balances.
       - Main Operational Pipeline: Side-by-side Today's Arrivals and Scheduled Departures with direct `Check-In`, `Check-Out`, `Express Walk-In`, and `Tape Chart` actions.
    2. **Housekeeping (`Housekeeping`):**
       - Primary KPIs: Rooms to Clean (Dirty), In-Progress Servicing, Clean & Ready to Sell, and Out-of-Order / Defect.
       - Priority Turnover Queue: Rooms awaiting turnover before incoming guest check-ins with one-click status transitions.
       - Defect Reporting: Direct shortcut to log maintenance defect tickets. Sensitive financial revenue data is completely removed from view.
    3. **Maintenance & Facilities (`Maintenance`):**
       - Primary KPIs: Open Work Orders, Urgent/High Severity Defects, Out-of-Order Rooms Blocked from Inventory, and Operational Plant Health %.
       - Active Maintenance Queue: Ticket category, severity badges, reporter, assigned technician, and ticket management actions.
    4. **Finance & Accounts (`Finance`):**
       - Primary KPIs: Total Realized Revenue, Pending Folio Balances, Tax Invoices (GST SAC 996311 compliance), and Verified Collections.
       - Payment Instrument Split: Digital UPI / Instant QR volume, EDC Card Swipes, and Front Desk Cash Safe float.
       - Financial Ledger: Recent collections table with reference numbers and settlement statuses.
    5. **Revenue & Distribution (`Revenue Manager`):**
       - Primary KPIs: Average Daily Rate (ADR), RevPAR, Portfolio Occupancy %, and 26 Connected Aiosell Feeds.
       - Yield Performance Chart: 7-day revenue, ADR, and occupancy trends.
       - Feed Status Grid: Top OTA partner performance (Booking.com, GoMMT, Agoda, Airbnb, Expedia) with monthly revenue, bookings ingested, and markup controls.
    6. **Executive / Management (`Owner`, `Group Admin`, `Property Manager`):**
       - Complete GM command center integrating portfolio revenue, occupancy %, active in-house guests, cross-department pending tasks, performance trajectory chart, 3-column operational breakdown, and operational pipeline.

---

## 3. Verification & Live Sandbox Proof

| Verification Area | Method | Result |
| :--- | :--- | :--- |
| **Aiosell Sandbox Login** | Browser subagent navigation to `https://live.aiosell.com` with `sandboxpms / sandboxpms` | **Verified & Logged In** |
| **Aiosell Live Rate Push** | `POST /update-rates/sample-pms` with room `EXECUTIVE EP`, rate plan `S`, Oct 15–17, 2026, rate `2499` | **Reflected Live on Aiosell Grid** |
| **Aiosell Inbound Webhook** | Book, Modify (state replacement), Cancel with Basic Auth & plain-text special requests | **5/5 Tests Passed** (`test_aiosell_integration.py`) |
| **26 Channel Integrations** | Verified all 26 partner configurations seeded & active in database | **Verified** |
| **HMS Full Lifecycle** | Walk-in check-in, room occupation, room reassign, checkout turnover, invoice creation | **8/8 Tests Passed** (`test_lifecycle_interconnection.py`) |
| **System Integrity** | 26 channels, rate plans, room availability | **5/5 Tests Passed** (`test_system_integrity.py`) |
| **Role-Based Dashboards** | Front Office, Housekeeping, Maintenance, Finance, Revenue Manager, Executive | **Verified & Built** |
| **Frontend Production Build** | `npm run build` (Vite production bundle) | **Built with 0 errors** |

---

## 4. Summary of Modified Codebase Files

- [DashboardView.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/features/dashboard/DashboardView.tsx): Role-based dashboards for Front Office, Housekeeping, Maintenance, Finance, Revenue Manager, and Executive roles with dynamic data scoping.
- [ViewRouter.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/components/layout/ViewRouter.tsx): Injected role and department data collections into DashboardView.
- [ChannelsView.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/features/channels/ChannelsView.tsx): 26 Aiosell channels, push suite, fetch verify, webhook simulator, removed legacy email/CSV/iCal.
- [RatesView.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/features/rates/RatesView.tsx): Dynamic rolling dates, editable rate matrix, Aiosell rate push sync, full Rate Plan edit modal.
- [AvailabilityView.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/features/rates/AvailabilityView.tsx): Rolling window selector (7/14 days), Aiosell restrictions push sync (Stop Sell / Min Stay).
- [ReservationCalendar.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/features/reservations/ReservationCalendar.tsx): Dynamic calendar initialization and today navigation.
- [Sidebar.tsx](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/src/components/layout/Sidebar.tsx): Removed misleading static badges.
- [models.py](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/backend/models.py): Added `reservation_id`, `amount`, `tax_amount`, `issued_at` to `Invoice`; added `task_type` to `HousekeepingTask`; made `payments.reservation_ref` nullable with `"DIRECT"` default.
- [reservations.py](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/backend/routers/reservations.py): Fixed departure checkout invoice fields and checkout settlement status.
- [billing.py](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/backend/routers/billing.py): Fixed direct payment recording and invoice creation.
- [schemas.py](file:///c:/Users/fudha/antigravity/SIGNINN-HMS/backend/schemas.py): Added `status` to `ReservationCreate`.
