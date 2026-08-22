# Admin Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Admin Suite for Catheryne Ríos Estética using independent React Router routes (`/admin`, `/admin/agenda`, `/admin/caja`, `/admin/equipo`, `/admin/servicios`) wrapped in a shared layout (`AdminLayout.jsx`) with mobile back-button support and central state persistence (`AdminContext.jsx`).

**Architecture:** A central `AdminContext.jsx` manages data persistence with `localStorage`. `AdminLayout.jsx` provides mobile bottom-tab navigation and top header with `← Volver` navigation. Sub-routes render dedicated management pages for Dashboard, Agenda, Cash Flow, Team/Commissions, and Service Catalog.

**Tech Stack:** React 19, React Router 7, Framer Motion, Lucide React, React Icons, CSS Modules, Vite.

## Global Constraints

- Primary Brand Colors: Obsidian (`#0E0E0E`), Luxury Gold (`#D4AF37`), Soft Cream (`#F5F2EB`).
- Routes must be independent in `App.jsx` (`/admin`, `/admin/agenda`, `/admin/caja`, `/admin/equipo`, `/admin/servicios`).
- Back button (`← Volver`) calls `navigate(-1)` to preserve browser history stack and Android back-button behavior.
- All tasks must pass `npm run build`.

---

### Task 1: Global Admin State Provider (`AdminContext.jsx`)

**Files:**
- Create: `src/context/AdminContext.jsx`

**Interfaces:**
- Consumes: Initial mock data from services and team data.
- Produces: `useAdmin()` hook exposing `appointments`, `transactions`, `teamMembers`, `servicesList`, and mutation methods (`addAppointment`, `updateAppointmentStatus`, `addTransaction`, `addTeamMember`, `updateTeamMember`, `payWorker`, `addService`, `updateService`).

- [ ] **Step 1: Create AdminContext.jsx**
Write `src/context/AdminContext.jsx` with initial state and local storage sync:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext()

const initialTeam = [
  { id: '1', name: 'Catheryne Ríos', role: 'Directora & Lash Artist', commissionRate: 50, active: true },
  { id: '2', name: 'Valentina Silva', role: 'Especialista en Uñas', commissionRate: 40, active: true },
  { id: '3', name: 'Camila Torres', role: 'Cosmiatra & Faciales', commissionRate: 45, active: true }
]

const initialServices = [
  { id: '1', name: 'Manicura Rusa VIP', category: 'unas', price: 120000, duration: 60, active: true },
  { id: '2', name: 'Limpieza Facial Profunda', category: 'rostro', price: 180000, duration: 75, active: true },
  { id: '3', name: 'Masaje Relajante de Spa', category: 'cuerpo', price: 220000, duration: 90, active: true }
]

const initialAppointments = [
  { id: 'app-1', clientName: 'Sofía Martínez', serviceId: '1', serviceName: 'Manicura Rusa VIP', specialistId: '2', specialistName: 'Valentina Silva', date: '2026-08-10', time: '10:00 AM', price: 120000, status: 'Confirmada' },
  { id: 'app-2', clientName: 'Lucía Gómez', serviceId: '2', serviceName: 'Limpieza Facial Profunda', specialistId: '3', specialistName: 'Camila Torres', date: '2026-08-10', time: '02:00 PM', price: 180000, status: 'Finalizada' }
]

const initialTransactions = [
  { id: 'tx-1', type: 'Ingreso', amount: 180000, description: 'Pago Limpieza Facial - Lucía Gómez', category: 'Servicios', date: '2026-08-10' },
  { id: 'tx-2', type: 'Egreso', amount: 45000, description: 'Compra de Insumos de Uñas', category: 'Insumos', date: '2026-08-10' }
]

export function AdminProvider({ children }) {
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_team')
      return saved ? JSON.parse(saved) : initialTeam
    } catch (e) { return initialTeam }
  })

  const [servicesList, setServicesList] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_services')
      return saved ? JSON.parse(saved) : initialServices
    } catch (e) { return initialServices }
  })

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_appointments')
      return saved ? JSON.parse(saved) : initialAppointments
    } catch (e) { return initialAppointments }
  })

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_transactions')
      return saved ? JSON.parse(saved) : initialTransactions
    } catch (e) { return initialTransactions }
  })

  useEffect(() => {
    localStorage.setItem('spa_admin_team', JSON.stringify(teamMembers))
  }, [teamMembers])

  useEffect(() => {
    localStorage.setItem('spa_admin_services', JSON.stringify(servicesList))
  }, [servicesList])

  useEffect(() => {
    localStorage.setItem('spa_admin_appointments', JSON.stringify(appointments))
  }, [appointments])

  useEffect(() => {
    localStorage.setItem('spa_admin_transactions', JSON.stringify(transactions))
  }, [transactions])

  const addAppointment = (app) => setAppointments(prev => [app, ...prev])
  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const addTransaction = (tx) => setTransactions(prev => [tx, ...prev])
  
  const addTeamMember = (member) => setTeamMembers(prev => [...prev, member])
  const updateTeamMember = (id, updated) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
  }

  const addService = (service) => setServicesList(prev => [...prev, service])
  const updateService = (id, updated) => {
    setServicesList(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
  }

  return (
    <AdminContext.Provider value={{
      teamMembers,
      servicesList,
      appointments,
      transactions,
      addAppointment,
      updateAppointmentStatus,
      addTransaction,
      addTeamMember,
      updateTeamMember,
      addService,
      updateService
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/context/AdminContext.jsx
git commit -m "feat: add AdminContext for global admin state management"
```

---

### Task 2: Layout & Navigation (`AdminLayout.jsx` & `AdminLayout.module.css`)

**Files:**
- Create: `src/components/admin/AdminLayout.jsx`
- Create: `src/components/admin/AdminLayout.module.css`

**Interfaces:**
- Consumes: React Router (`useLocation`, `useNavigate`, `Outlet`, `NavLink`).
- Produces: Executive Admin Header + Bottom Mobile Nav + Left Desktop Sidebar wrapper layout.

- [ ] **Step 1: Create AdminLayout.jsx**
- [ ] **Step 2: Create AdminLayout.module.css**
- [ ] **Step 3: Commit Task 2**

---

### Task 3: Main Dashboard Page (`AdminDashboard.jsx`)

**Files:**
- Create: `src/pages/admin/AdminDashboard.jsx`
- Create: `src/pages/admin/AdminDashboard.module.css`

**Interfaces:**
- Consumes: `useAdmin()` data for total sales, appointments count, profit metrics.
- Produces: Overview dashboard with KPI cards, today's schedule table, and quick transaction trigger.

- [ ] **Step 1: Create AdminDashboard.jsx & CSS**
- [ ] **Step 2: Commit Task 3**

---

### Task 4: Agenda & Calendar Page (`AdminAgenda.jsx`)

**Files:**
- Create: `src/pages/admin/AdminAgenda.jsx`
- Create: `src/pages/admin/AdminAgenda.module.css`

**Interfaces:**
- Consumes: `appointments`, `teamMembers`, `updateAppointmentStatus`, `addAppointment`.
- Produces: Specialist schedule filter, appointment status updater, manual booking modal.

- [ ] **Step 1: Create AdminAgenda.jsx & CSS**
- [ ] **Step 2: Commit Task 4**

---

### Task 5: Cash Flow & Finances Page (`AdminCaja.jsx`)

**Files:**
- Create: `src/pages/admin/AdminCaja.jsx`
- Create: `src/pages/admin/AdminCaja.module.css`

**Interfaces:**
- Consumes: `transactions`, `addTransaction`.
- Produces: Cash inflow/outflow register, balance calculations, transaction log.

- [ ] **Step 1: Create AdminCaja.jsx & CSS**
- [ ] **Step 2: Commit Task 5**

---

### Task 6: Team & Payroll Page (`AdminEquipo.jsx`)

**Files:**
- Create: `src/pages/admin/AdminEquipo.jsx`
- Create: `src/pages/admin/AdminEquipo.module.css`

**Interfaces:**
- Consumes: `teamMembers`, `appointments`, `addTransaction`, `addTeamMember`, `updateTeamMember`.
- Produces: Specialist commission calculator, worker payout logger, team roster manager.

- [ ] **Step 1: Create AdminEquipo.jsx & CSS**
- [ ] **Step 2: Commit Task 6**

---

### Task 7: Service Catalog Manager Page (`AdminServicios.jsx`)

**Files:**
- Create: `src/pages/admin/AdminServicios.jsx`
- Create: `src/pages/admin/AdminServicios.module.css`

**Interfaces:**
- Consumes: `servicesList`, `addService`, `updateService`.
- Produces: Service catalog manager with price/duration editing and toggle switches.

- [ ] **Step 1: Create AdminServicios.jsx & CSS**
- [ ] **Step 2: Commit Task 7**

---

### Task 8: Route Integration & Build Verification

**Files:**
- Modify: `src/App.jsx`
- Test: `npm run build`

- [ ] **Step 1: Register `/admin/*` sub-routes in `App.jsx` wrapped in `AdminProvider` and `AdminLayout`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: Commit Task 8**
