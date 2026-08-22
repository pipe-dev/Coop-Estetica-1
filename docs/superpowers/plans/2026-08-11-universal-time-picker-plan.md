# Universal Executive 12-Hour Time Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable, foolproof 12-hour time picker component (`TimePickerUniversal.jsx`) with quick presets and 3-column selection, and integrate it across `AdminAgenda.jsx` and all Admin Suite modals.

**Architecture:** A dark-gold glassmorphic React component with popover floating overlay. When closed, it displays a pill button `[ 🕒 10:30 AM ▼ ]`. When clicked, it opens a floating menu with 1-click spa preset hours (`08:00 AM`, `10:00 AM`, `12:00 PM`...) and a 3-column hour/minute/period selector.

**Tech Stack:** React, Framer Motion, Lucide Icons, CSS Modules, Vite.

## Global Constraints
- Currency: COP ($) with thousands dot formatting.
- Time format: Strictly 12-hour AM/PM string (`HH:MM AM` or `HH:MM PM`).
- Design: VIP Dark Gold aesthetics (`#141414`, `#D4AF37`, `rgba(212, 175, 55, 0.3)`).

---

### Task 1: Create `TimePickerUniversal.jsx` Component & CSS Module

**Files:**
- Create: `frontend/src/components/ui/TimePickerUniversal.jsx`
- Create: `frontend/src/components/ui/TimePickerUniversal.module.css`

**Interfaces:**
- Produces: `<TimePickerUniversal value={timeStr} onChange={setTimeStr} label="Hora" />`

- [ ] **Step 1: Write `TimePickerUniversal.jsx`**
- [ ] **Step 2: Write `TimePickerUniversal.module.css`**
- [ ] **Step 3: Run `npm run build` to verify clean compilation**

---

### Task 2: Integrate `TimePickerUniversal` into `AdminAgenda.jsx` Modals

**Files:**
- Modify: `frontend/src/pages/admin/AdminAgenda.jsx`
- Modify: `frontend/src/pages/admin/AdminAgenda.module.css`

**Interfaces:**
- Consumes: `<TimePickerUniversal />`

- [ ] **Step 1: Replace time selects/inputs in `showBlockModal` (`blockStartTime` & `blockEndTime`) with `<TimePickerUniversal />`**
- [ ] **Step 2: Replace time input in `showAddModal` (`time`) with `<TimePickerUniversal />`**
- [ ] **Step 3: Replace time input in `editingAppointment` modal (`editTime`) with `<TimePickerUniversal />`**
- [ ] **Step 4: Run `npm run build` to verify clean compilation**
