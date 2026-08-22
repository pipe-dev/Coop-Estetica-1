# Team Commission & Payroll Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate commission rate configuration (`commissionRate`) to Team Management (`AdminEquipo.jsx`), update `AdminContext.jsx` with `updateTeamMember`, and enable automatic payroll calculations & 1-click liquidation in History & Payroll (`AdminHistorial.jsx`).

**Architecture:** Data flows from `teamMembers` context -> `commissionRate` -> `AdminEquipo.jsx` (config) & `AdminHistorial.jsx` (settlement). 1-click settlement creates an `Egreso` transaction in `AdminContext`.

**Tech Stack:** React, Context API, Lucide Icons, CSS Modules, Vite.

## Global Constraints
- Currency: COP ($) with thousands dot formatting (`180.000 COP`).
- Design: Dark Gold VIP Executive Aesthetics.

---

### Task 1: Update `AdminContext.jsx` with `commissionRate` and `updateTeamMember`

**Files:**
- Modify: `frontend/src/context/AdminContext.jsx`

**Interfaces:**
- Produces: `updateTeamMember(id, updatedFields)` exposed in `useAdmin()` context.

- [ ] **Step 1: Add `commissionRate` property to `initialTeamMembers` in `AdminContext.jsx`**
- [ ] **Step 2: Define and export `updateTeamMember` function in `AdminContext.jsx`**
- [ ] **Step 3: Run `npm run build` to verify clean compilation**

---

### Task 2: Add Commission Rate Config to `AdminEquipo.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/AdminEquipo.jsx`
- Modify: `frontend/src/pages/admin/AdminEquipo.module.css`

**Interfaces:**
- Consumes: `updateTeamMember` from `useAdmin()`

- [ ] **Step 1: Add `% Comisión` input to Add and Edit Specialist modals in `AdminEquipo.jsx`**
- [ ] **Step 2: Display `% Comisión` badge on team member cards in `AdminEquipo.jsx`**
- [ ] **Step 3: Run `npm run build` to verify clean compilation**

---

### Task 3: Update `AdminHistorial.jsx` with Automatic Payroll Calculation & 1-Click Liquidation

**Files:**
- Modify: `frontend/src/pages/admin/AdminHistorial.jsx`
- Modify: `frontend/src/pages/admin/AdminHistorial.module.css`

**Interfaces:**
- Consumes: `teamMembers` with `commissionRate`, `addTransaction` from `useAdmin()`

- [ ] **Step 1: Bind payroll cards in `AdminHistorial.jsx` to `m.commissionRate` from `teamMembers`**
- [ ] **Step 2: Add `💰 Liquidar / Pagar Nómina` button that creates an `Egreso` transaction in `transactions`**
- [ ] **Step 3: Run `npm run build` to verify clean compilation**
