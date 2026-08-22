# Executive Analytics Expanded Modal Design Spec

**Date:** 2026-08-11  
**Project:** Catheryne Ríos Estética - Admin Suite  
**Topic:** Solid Dark Gold Expanded Analytics Modal (`ExecutiveAnalyticsModal`)

---

## 1. Overview
When the admin clicks on any of the 3 summary financial metric cards (`Total Ingresos`, `Total Egresos`, `Balance Neto en Caja`) in the Cash Register or Dashboard views, a solid executive modal expands cleanly with Framer Motion, displaying detailed animated charts and financial breakdowns.

---

## 2. Design Aesthetics & Constraints
- **Styling:** Solid dark luxury theme (`#121212` container background, `#1C1C1E` card surfaces, `rgba(212, 175, 55, 0.4)` gold borders). **Strictly NO glassmorphism / no blur**.
- **Typography:** High-contrast executive fonts, gold monetary highlights in `$ COP` with thousands dot format (`180.000 COP`).
- **Animations:** Framer Motion spring popover (`initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}`).

---

## 3. Component Architecture

### File Locations:
- `frontend/src/components/admin/ExecutiveAnalyticsModal.jsx`
- `frontend/src/components/admin/ExecutiveAnalyticsModal.module.css`

### Component Props:
```ts
interface ExecutiveAnalyticsModalProps {
  cardType: 'ingresos' | 'egresos' | 'balance' | null;
  onClose: () => void;
  transactions: Transaction[];
  appointments: Appointment[];
}
```

---

## 4. Detailed Modal Views by Card Type

### A. View 1: `TOTAL INGRESOS` (`cardType === 'ingresos'`)
1. **Header:** Total Revenue (`$180.000 COP`), status badge, and close button.
2. **Chart 1 - Payment Method Donut (SVG + Framer Motion):**
   - Donut segments: Nequi ($180.000 / 100%), Efectivo ($0 / 0%), Tarjeta ($0 / 0%).
3. **Chart 2 - Weekly Revenue Bar Chart:**
   - 7 vertical bars (Lun - Dom) with animated heights and value labels.
4. **Service Breakdown List:**
   - List of top treatments contributing to today's revenue.

### B. View 2: `TOTAL EGRESOS` (`cardType === 'egresos'`)
1. **Header:** Total Expenses (`$45.000 COP`) & expense status indicator.
2. **Chart 1 - Expense Category Progress Bars:**
   - Insumos & Productos ($45.000 / 100%), Nómina ($0 / 0%), Operativos ($0 / 0%).
3. **Expenses Log Table:**
   - Chronological table of registered outflows with payment method tags.

### C. View 3: `BALANCE NETO EN CAJA` (`cardType === 'balance'`)
1. **Header:** Net Cash Balance (`$135.000 COP`) + Net Profit Margin Badge (`75% Margen`).
2. **Chart 1 - Income vs Expense Dual Comparison Bars:**
   - Side-by-side bar comparison: Ingresos vs Egresos.
3. **Chart 2 - Financial Health Arc Gauge (SVG):**
   - Circular arc gauge indicating liquidity status ("Óptima").
4. **End-of-Day Revenue Projection:**
   - Projection card factoring in pending appointments.

---

## 5. Integration Sites
- `frontend/src/pages/admin/AdminCaja.jsx`
- `frontend/src/pages/admin/AdminDashboard.jsx`

---

## 6. Verification Plan
- Build check: `npm run build` in `frontend/`.
- Functionality check: Click on each of the 3 cards in `/admin/caja` and `/admin/dashboard`, verify solid modal opening, smooth Framer Motion animations, exact numeric calculations, and closing via `X` or ESC key.
