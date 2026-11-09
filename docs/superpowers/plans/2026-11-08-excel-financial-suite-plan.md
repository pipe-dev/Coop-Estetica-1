# Suite Financiera & Operativa (Excel a Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete financial and operational suite for the Administrador de Servicios in Catheryne Ríos Estética, replicating and automating the 3 Excel workflows: (1) Planilla Diaria de Liquidación con reparto dinámico de comisiones, insumos, gastos operativos y anticipos, (2) Libro Mayor Mensual de Tesorería con arqueo de efectivo real vs transacciones bancarias, y (3) Flujo Periódico de Ingresos y Egresos por Categoría de Servicio, integrando además la configuración de costo de insumos en el catálogo de servicios.

**Architecture:**
- **Backend:** Prisma schema extended with `supplyCost` on `Service`, enhanced payment & supply tracking on `Appointment`, category and specialist tagging on `Transaction`. `CashService` and `CashController` expanded with specialized endpoints for daily matrix aggregation, monthly ledger computation, category cashflow analysis, and expense/advance management.
- **Frontend:**
  - `AdminServicios.jsx`: Added "Costo de Insumos ($ COP)" field in the service creation/editing drawer.
  - `AdminAgenda.jsx`: Enhanced "Cobrar Cita" modal that automatically suggests the service's supply cost, dynamically computes the specialist commission (% or $), allows payment method selection (Efectivo vs. Transferencia), and logs cash inflow in real time.
  - `AdminCaja.jsx`: Modern 4-tab interface:
    - Tab 1: **Arqueo y Turno Actual** (control de caja chica y arqueo ciego).
    - Tab 2: **Planilla Diaria de Liquidación** (matriz idéntica al Excel diario: agrupada por categoría, columnas por especialista, porción de estética, insumos, gastos del día, anticipos, y balance neto).
    - Tab 3: **Libro Mensual de Tesorería** (matriz idéntica a la hoja de Septiembre: Total Día, Transacciones Banco, Gastos, Efectivo Día, Efectivo Real Acumulado, y filas doradas de cortes y pagos).
    - Tab 4: **Flujo por Categorías** (cuadros idénticos a la hoja de Octubre para Manicure, Peluquería, Depilación, Lifting con ingresos por citas vs compras de insumos).

**Tech Stack:** React 19, Vite, NestJS, Prisma ORM, PostgreSQL, Lucide React, Framer Motion, Vanilla CSS Modules.

## Global Constraints
- Strictly "Catheryne Ríos Estética" — ZERO occurrences of the word "spa".
- Luxury aesthetic: Gold `#D4AF37` / `#DFBA44` accents on dark charcoal `#141417` and card backgrounds `rgba(255, 255, 255, 0.03)`.
- Resilient offline fallback: All components must function smoothly with local state and localStorage if the backend is temporarily offline.
- TDD & verification: Every backend endpoint and frontend build must be verified with automated test scripts and clean production builds.

---

### Task 1: Prisma Schema & Backend DTO Extensions

**Files:**
- Modify: `backend/prisma/schema.prisma:105-135, 160-195, 215-230`
- Modify: `backend/src/services/services.service.ts:110-150`
- Modify: `backend/src/appointments/appointments.service.ts:660-690`
- Test: `backend/test/test-schema-financial-suite.ts`

**Interfaces:**
- `Service.supplyCost: Float? @default(0)`
- `Appointment.supplyCost: Float? @default(0)`
- `Appointment.commissionRate: Float?`
- `Appointment.aestheticAmount: Float?`
- `Appointment.paymentMethod: String? @default("Efectivo")`
- `Transaction.specialistId: String?`
- `Transaction.specialistName: String?`
- `Transaction.serviceCategoryId: String?`
- `Transaction.serviceCategoryName: String?`

- [ ] **Step 1: Update Prisma schema with new financial fields**
- [ ] **Step 2: Generate Prisma Client (`npx prisma generate`)**
- [ ] **Step 3: Update `services.service.ts` to accept and return `supplyCost`**
- [ ] **Step 4: Update `appointments.service.ts` to accept `supplyCost`, `aestheticAmount`, `commissionRate`, and `paymentMethod` in `updateStatus`**
- [ ] **Step 5: Write and run verification script `backend/test/test-schema-financial-suite.ts`**
- [ ] **Step 6: Commit changes: `git commit -m "feat(backend): add supplyCost and financial metadata to services, appointments, and transactions"`**

---

### Task 2: Backend Cash Aggregation Engine (Daily Matrix, Monthly Ledger & Category Flow)

**Files:**
- Modify: `backend/src/cash/cash.service.ts`
- Modify: `backend/src/cash/cash.controller.ts`
- Test: `backend/test/test-cash-engine.ts`

**Interfaces:**
- `getDailyMatrix(date: string): Promise<DailyMatrixResponse>`
  - Returns: `{ date, categories: [...], specialists: [...], rows: [...], totals: {...}, expenses: [...], advances: [...], paymentSummary: {...} }`
- `getMonthlyLedger(year: number, month: number): Promise<MonthlyLedgerResponse>`
  - Returns: `{ year, month, days: [...], payrollCuts: [...], supplyRestocks: [...], totals: {...} }`
- `getCategoryFlow(startDate: string, endDate: string): Promise<CategoryFlowResponse>`
  - Returns: `{ startDate, endDate, categories: [{ id, name, totalIncome, totalExpenses, netMargin, incomeEntries: [...], expenseEntries: [...] }], grandTotalNet: number }`
- `createExpense(dto: CreateExpenseDto): Promise<Transaction>`
- `createAdvance(dto: CreateAdvanceDto): Promise<Transaction>`

- [ ] **Step 1: Implement `getDailyMatrix` calculation in `cash.service.ts`**
- [ ] **Step 2: Implement `getMonthlyLedger` calculation in `cash.service.ts`**
- [ ] **Step 3: Implement `getCategoryFlow` calculation in `cash.service.ts`**
- [ ] **Step 4: Implement `createExpense` and `createAdvance` helper methods in `cash.service.ts`**
- [ ] **Step 5: Add corresponding controller endpoints in `cash.controller.ts` with `@Roles('OWNER', 'ADMIN_SERVICIOS', 'ADMIN')`**
- [ ] **Step 6: Write automated test in `backend/test/test-cash-engine.ts` verifying all 3 aggregations with mocked data**
- [ ] **Step 7: Run test, verify 0 errors, build backend**
- [ ] **Step 8: Commit changes: `git commit -m "feat(backend): implement daily matrix, monthly ledger, and category cashflow endpoints"`**

---

### Task 3: Frontend - Costo de Insumos en Catálogo de Servicios (`AdminServicios.jsx`)

**Files:**
- Modify: `frontend/src/pages/admin/AdminServicios.jsx`
- Modify: `frontend/src/context/AdminContext.jsx`
- Modify: `frontend/src/api/client.js`

- [ ] **Step 1: Update `client.js` and `AdminContext.jsx` to pass `supplyCost` when creating or updating services**
- [ ] **Step 2: In `AdminServicios.jsx`, add input field "Costo Sugerido de Insumos ($ COP)" with COP currency formatting helper**
- [ ] **Step 3: In the services table/cards, display a subtle badge showing the default supply cost (e.g. `Insumos: $2.000`)**
- [ ] **Step 4: Build frontend (`npm run --prefix frontend build`) and verify 0 errors**
- [ ] **Step 5: Commit changes: `git commit -m "feat(frontend): allow services admin to configure supply cost per service"`**

---

### Task 4: Frontend - Modal Inteligente de Cobro en Agenda (`AdminAgenda.jsx`)

**Files:**
- Modify: `frontend/src/pages/admin/AdminAgenda.jsx`
- Modify: `frontend/src/pages/admin/AdminAgenda.module.css`

- [ ] **Step 1: In `AdminAgenda.jsx`, when opening the "Cobrar / Finalizar Cita" modal:**
  - Auto-populate `supplyCost` from the assigned `service.supplyCost` (editable input).
  - Calculate `aestheticAmount = price - commissionAmount`.
  - Add radio/toggle selector for `paymentMethod`: "Efectivo" vs. "Transferencia (Nequi / Daviplata / Banco)".
- [ ] **Step 2: On payment confirmation:**
  - Call `updateAppointmentStatus(app.id, 'Pagada', { commissionAmount, commissionRate, supplyCost, aestheticAmount, paymentMethod })`.
  - Automatically log the transaction in Cash Session as an income.
- [ ] **Step 3: Build frontend and verify 0 errors**
- [ ] **Step 4: Commit changes: `git commit -m "feat(frontend): integrate dynamic commission, supply cost, and payment method in appointment checkout modal"`**

---

### Task 5: Frontend - Planilla Diaria de Liquidación en Caja (`AdminCaja.jsx`)

**Files:**
- Modify: `frontend/src/pages/admin/AdminCaja.jsx`
- Modify: `frontend/src/pages/admin/AdminCaja.module.css`
- Create: `frontend/src/components/admin/caja/PlanillaDiariaView.jsx`
- Create: `frontend/src/components/admin/caja/PlanillaDiariaView.module.css`

- [ ] **Step 1: Create `PlanillaDiariaView.jsx` replicating the Sábado 12 de Septiembre matrix:**
  - Date picker (defaults to today, historical date selection).
  - Key KPI summary cards (Total Bruto, Liquidación Especialistas, Insumos, Utilidad Neta Estética, Efectivo vs Transferencias).
  - Table grouped by Category (`Uñas`, `Peluquería / Otros`, `Facial`).
  - Columns: Procedimiento, Total, [Dynamic column per active Specialist], Estética, Insumos, Método de Pago.
  - Subtotals row at the bottom with total owed to each specialist.
  - Bottom panel: Egresos y Gastos del Día (with `+ Registrar Gasto` modal) & Anticipos a Especialistas (with `+ Registrar Anticipo` modal).
  - Net payout calculation per specialist: `Comisión Ganada - Anticipos = Total a Entregar`.
  - Button to print or export the daily settlement sheet.
- [ ] **Step 2: Style with gold accents, luxury dark theme, and responsive mobile horizontal scroll**
- [ ] **Step 3: Build frontend and verify 0 errors**
- [ ] **Step 4: Commit changes: `git commit -m "feat(frontend): implement daily settlement matrix view in admin caja"`**

---

### Task 6: Frontend - Libro Mensual de Tesorería (`AdminCaja.jsx`)

**Files:**
- Create: `frontend/src/components/admin/caja/LibroMensualView.jsx`
- Create: `frontend/src/components/admin/caja/LibroMensualView.module.css`
- Modify: `frontend/src/pages/admin/AdminCaja.jsx`

- [ ] **Step 1: Create `LibroMensualView.jsx` replicating the Septiembre master sheet:**
  - Month/Year selector (e.g. Septiembre 2026, Octubre 2026, Noviembre 2026).
  - Table with all days of the month:
    - `Fecha` | `Total Día (Estética)` | `Transacciones (Banco/Nequi)` | `Gastos del Día` | `Gastos sin Registrar` | `Efectivo del Día` | `Efectivo Real (Acumulado)`.
  - Highlighted yellow/gold rows for cutoffs & disbursements (Pagos a Diana, Leidy, Edith, etc. and Insumos compras).
  - Monthly totals row at the bottom.
  - Quick action to add unrecorded expenses or audit adjustments.
- [ ] **Step 2: Style with luxury theme and responsive layout**
- [ ] **Step 3: Build frontend and verify 0 errors**
- [ ] **Step 4: Commit changes: `git commit -m "feat(frontend): implement monthly treasury ledger view in admin caja"`**

---

### Task 7: Frontend - Flujo Semanal por Categorías (`AdminCaja.jsx`)

**Files:**
- Create: `frontend/src/components/admin/caja/FlujoCategoriasView.jsx`
- Create: `frontend/src/components/admin/caja/FlujoCategoriasView.module.css`
- Modify: `frontend/src/pages/admin/AdminCaja.jsx`

- [ ] **Step 1: Create `FlujoCategoriasView.jsx` replicating the 13-17 de Octubre 4-block sheet:**
  - Date range picker (This week, last week, custom date range).
  - 4 major interactive category cards (or dynamic categories from CMS):
    - `Manicure`
    - `Peluquería`
    - `Depilación`
    - `Lifting y Henna`
  - In each category: table of `Fecha` | `Ingreso` | `Salida` | `Descripción`.
  - Button `+ Registrar Insumo/Gasto de Categoría` (e.g. $25.000 "REM CUT, NOVI MASGLO", $27.400 "TINTES").
  - Subtotals and Net Profit per category.
  - Grand total header displaying consolidated net profit across all lines of business.
- [ ] **Step 2: Connect all 4 tabs in `AdminCaja.jsx`:**
  - Tab 1: Arqueo y Turno Actual
  - Tab 2: Planilla Diaria de Liquidación
  - Tab 3: Libro Mensual de Tesorería
  - Tab 4: Flujo por Categorías
- [ ] **Step 3: Build frontend and verify 0 errors**
- [ ] **Step 4: Commit changes: `git commit -m "feat(frontend): implement weekly category cashflow view and unified caja tab navigation"`**

---

### Task 8: End-to-End Verification & Brand Audit

**Files:**
- Create: `backend/test/e2e-financial-suite.ts`

- [ ] **Step 1: Write and run E2E test simulating:**
  1. Creating a service with supplyCost ($2.000).
  2. Booking and checking out an appointment with commission (50%), supplyCost ($2.000), and paymentMethod ('Transferencia').
  3. Registering an operational expense ("Bolsas y ambientador", $9.000).
  4. Registering a specialist advance (Diana, $15.000).
  5. Querying the daily matrix and verifying exact math.
  6. Querying monthly ledger and verifying running cash balance.
  7. Querying category flow and verifying category net margin.
- [ ] **Step 2: Run brand audit: ensure 0 occurrences of "spa" in all source code**
- [ ] **Step 3: Build full project (backend & frontend)**
- [ ] **Step 4: Commit and push: `git push origin main`**
