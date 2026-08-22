# Team Commission & Payroll Settlement Architecture Design Spec

**Date:** 2026-08-11  
**Project:** Catheryne Ríos Estética - Admin Suite  
**Topic:** Relocating Commission % Configuration to Team Management and Enabling 1-Click Payroll Settlement in Historial

---

## 1. Overview
The commission percentage (`commissionRate`, e.g., 50%, 40%, 45%) is a contractual attribute belonging to each specialist's profile. Therefore:
1. Commission percentage configuration moves to **Equipo (`AdminEquipo.jsx` & `AdminContext.jsx`)** where admins create or edit specialists.
2. Payroll calculation & liquidation moves to **Historial (`AdminHistorial.jsx`)**, where the system automatically calculates earned commissions from completed appointments and provides a 1-click **`💰 Liquidar / Pagar Nómina`** action that registers an Expense (`Egreso`) in the Cash Register.

---

## 2. Component Modifications & Data Flow

### A. Context & Data Model (`AdminContext.jsx`):
- Update `initialTeamMembers` to include default `commissionRate` (e.g. Catheryne: 50%, Valentina: 40%, Camila: 45%).
- Add `updateTeamMember` function to update specialist profile parameters (role, phone, active status, color, `commissionRate`).
- Expose `updateTeamMember` in `AdminContext`.

### B. Team Module (`AdminEquipo.jsx`):
- Add `% Comisión` input field in **Agregar Especialista** modal and **Editar Especialista** modal.
- Display `% Comisión` badge on each team member card in `/admin/equipo`.

### C. History & Payroll Module (`AdminHistorial.jsx`):
- Read `commissionRate` directly from `teamMembers` context.
- Calculate:
  - `totalFacturado` = sum of prices of completed/paid appointments for that specialist.
  - `pagoNomen` = `totalFacturado * (commissionRate / 100)`.
  - `retencionSpa` = `totalFacturado - pagoNomen`.
- Add **`💰 Liquidar / Pagar Nómina`** button:
  - Prompts confirmation.
  - Automatically creates a new Transaction of type `'Egreso'`, category `'Nómina'`, description `'Pago de Nómina - [Nombre Especialista]'`, amount `pagoNomen`.
  - Displays status badge if payroll was already settled.

---

## 3. Verification Plan
- Build check: `npm run build` in `frontend/`.
- Functionality check:
  1. Go to `/admin/equipo`, edit commission rate for a specialist.
  2. Go to `/admin/historial`, verify calculated payroll uses configured rate.
  3. Click `Liquidar Nómina`, verify transaction appears in `/admin/caja` as an `Egreso`.
