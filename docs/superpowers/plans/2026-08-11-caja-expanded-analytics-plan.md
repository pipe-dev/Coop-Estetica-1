# Executive Analytics Expanded Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a solid dark luxury expanded analytics modal (`ExecutiveAnalyticsModal.jsx`) triggered when clicking any of the 3 summary metric cards in Cash Register / Dashboard views, presenting animated charts and financial breakdowns.

**Architecture:** Solid dark background UI (`#121212`, `#1C1C1E`), zero glassmorphism, Framer Motion spring popover animations, interactive SVG charts (Donut Chart, Weekly Bar Chart, Financial Health Gauge).

**Tech Stack:** React, Framer Motion, Lucide Icons, CSS Modules, Vite.

## Global Constraints
- Currency: COP ($) with thousands dot formatting (`180.000 COP`).
- Design: Solid Dark Executive aesthetic (`#121212`, `#1C1C1E`, `#D4AF37`), strictly NO glassmorphism.

---

### Task 1: Create `ExecutiveAnalyticsModal.jsx` & `ExecutiveAnalyticsModal.module.css`

**Files:**
- Create: `frontend/src/components/admin/ExecutiveAnalyticsModal.jsx`
- Create: `frontend/src/components/admin/ExecutiveAnalyticsModal.module.css`

**Interfaces:**
- Produces: `<ExecutiveAnalyticsModal cardType="ingresos"|"egresos"|"balance" onClose={handleClose} transactions={txs} appointments={apps} />`

- [ ] **Step 1: Write `ExecutiveAnalyticsModal.jsx` with solid theme and SVG Framer Motion charts**
- [ ] **Step 2: Write `ExecutiveAnalyticsModal.module.css` with solid `#121212` backgrounds and gold accents**
- [ ] **Step 3: Run `npm run build` to verify clean compilation**

---

### Task 2: Integrate Card Click Triggers in `AdminCaja.jsx` and `AdminDashboard.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/AdminCaja.jsx`
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `<ExecutiveAnalyticsModal />`

- [ ] **Step 1: Add `selectedAnalyticsCard` state in `AdminCaja.jsx` and attach `onClick` handlers to the 3 metric cards**
- [ ] **Step 2: Render `<ExecutiveAnalyticsModal />` when `selectedAnalyticsCard` is non-null in `AdminCaja.jsx`**
- [ ] **Step 3: Add `selectedAnalyticsCard` state in `AdminDashboard.jsx` and attach `onClick` handlers to the summary cards**
- [ ] **Step 4: Run `npm run build` to verify clean compilation**
