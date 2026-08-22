# Design Spec: Admin Suite (Catheryne Ríos Estética)

**Date:** 2026-08-10  
**Status:** Approved  
**Topic:** Separate-Route Admin Management System  

---

## 1. Overview & Goals
The Admin Suite for **Catheryne Ríos Estética** provides a comprehensive management dashboard for business operations, including cash flow tracking, appointment calendar management, team payroll/commission calculation, and service catalog administration.

Inspired by the administrative architecture of *Barba Larga*, this suite uses **independent React Router routes** under `/admin/*` wrapped in a shared layout (`AdminLayout.jsx`). This approach ensures that mobile back-button navigation (e.g. Android triangle button) operates naturally within the browser history stack without abruptly exiting the admin application.

---

## 2. Route Architecture & Layout

### 2.1 Shared Layout Wrapper (`AdminLayout.jsx` & `AdminLayout.module.css`)
- **Header Bar:**
  - Back button (`← Volver`) calling `navigate(-1)` for seamless backward step navigation.
  - Active Section Title (e.g. "Dashboard General", "Flujo de Caja").
  - Current Date & Cash Box Status indicator (Abierta / Cerrada).
  - Quick action buttons (New Sale, New Booking).
- **Navigation Bars:**
  - **Desktop:** Left collapsible sidebar.
  - **Mobile:** Sticky bottom tab navigation bar with gold icon highlights:
    - 📊 Dashboard (`/admin`)
    - 📅 Agenda (`/admin/agenda`)
    - 💰 Caja (`/admin/caja`)
    - 👩‍⚕️ Equipo (`/admin/equipo`)
    - ✂️ Servicios (`/admin/servicios`)

---

## 3. Sub-Module Requirements

### 3.1 Dashboard General (`/admin` -> `AdminDashboard.jsx`)
- **KPI Summary Cards:**
  - Total Daily Sales ($ COP).
  - Total Appointments (Today / Pending / Completed).
  - Net Profit ($ COP) and Pending Staff Commissions.
- **Today's Schedule Quick View:** List of appointments for the current day with status badges and quick action buttons ("Confirmar Venta", "Finalizar Cita").
- **Quick Cash Action:** Express modal to record cash sale or income.

### 3.2 Agenda & Appointments (`/admin/agenda` -> `AdminAgenda.jsx`)
- **Specialist Filter:** Filter appointments by all team members or specific worker.
- **Date Selector:** Day navigator to inspect past/future schedules.
- **Status Pipeline:** Transition appointments between `Confirmada`, `En Atención`, `Finalizada`, `Cancelada`.
- **Manual Booking Modal:** Create walk-in or manual phone appointments.

### 3.3 Cash Flow & Finances (`/admin/caja` -> `AdminCaja.jsx`)
- **Transaction Recorder:** Form to add `Ingreso` (Sales/Services) or `Egreso` (Expenses/Supplies/Rent).
- **Financial Balance:** Real-time calculation of Gross Income, Total Expenses, and Net Profit.
- **Filterable History Table:** List transactions by date range and type.
- **Daily Cash Closure:** Generate a summary report of daily totals.

### 3.4 Team & Payroll (`/admin/equipo` -> `AdminEquipo.jsx`)
- **Team Roster:** List of specialists with role, avatar, and active status.
- **Commission Calculator:** Configurable commission rate (%) per specialist.
- **Payout Ledger:** Accrued commissions per worker based on completed appointments, with "Registrar Pago" button to pay worker and log expense in cash flow.
- **Member Management:** Add new worker, edit commission %, toggle active state.

### 3.5 Service Catalog (`/admin/servicios` -> `AdminServicios.jsx`)
- **Catalog Management:** Add, edit, or disable beauty treatments.
- **Attributes:** Name, Category (Uñas, Cabello, Facial, Maquillaje, Corporal, Spa), Price ($ COP), Duration (mins), Description.

---

## 4. State Management & Data Persistence (`AdminContext.jsx`)
- Single central provider managing appointments, financial transactions, team members, and services.
- Automatic sync with `localStorage` (`spa_admin_data`) with pre-populated demo data so all changes persist instantly across sub-route navigations and page refreshes.

---

## 5. UI/UX Aesthetic Standards
- **Palette:** Luxury Gold (`#D4AF37`), Obsidian Black (`#0E0E0E`), Charcoal (`#1A1A1A`), Soft Cream text (`#F5F2EB`).
- **Responsive:** Mobile-first layout with touch targets >= 44px, smooth transitions, and glassmorphic card overlays.
