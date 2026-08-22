# Universal Time Picker Component Design Spec

**Date:** 2026-08-11  
**Project:** Catheryne Ríos Estética - Admin Suite  
**Topic:** Universal Executive 12-Hour Time Picker Component (`TimePickerUniversal`)

---

## 1. Overview
The goal is to create a unified, elegant, and highly functional time picker component (`TimePickerUniversal`) used across all modules of the Admin Suite (Agenda, Appointment Booking, Time Slot Blocking, Cash Register Opening/Closing, Edit Modals).

This replaces previous radial clock overlays and raw text inputs with a foolproof 12-hour (AM/PM) popover component.

---

## 2. Component Architecture & Props

### File Locations:
- `frontend/src/components/ui/TimePickerUniversal.jsx`
- `frontend/src/components/ui/TimePickerUniversal.module.css`

### Props Interface:
```ts
interface TimePickerUniversalProps {
  value: string; // Formatted 12-hour time string, e.g., "10:30 AM"
  onChange: (newTimeStr: string) => void; // Callback emitting formatted string
  label?: string; // Optional field label
  disabled?: boolean; // Optional disabled state
}
```

---

## 3. UI & Interaction Flow

### Closed State (Trigger Button):
- Executive dark-gold pill input button: `[ 🕒 10:30 AM  ▼ ]`.
- Styled with dark background (`#141414`), subtle gold glass border (`rgba(212, 175, 55, 0.3)`), and gold hover highlight.

### Open State (Popover Overlay):
When clicked, a floating popover opens below the button with:
1. **Quick Presets Bar (Top):**
   - 1-tap buttons for common spa hours: `08:00 AM`, `10:00 AM`, `12:00 PM`, `02:00 PM`, `04:00 PM`, `06:00 PM`.
2. **Segmented 3-Column Custom Selector:**
   - **Column 1 (Hours):** `1` to `12` grid buttons.
   - **Column 2 (Minutes):** `:00`, `:15`, `:30`, `:45` interval buttons.
   - **Column 3 (Period):** `AM` and `PM` toggle buttons.
3. **Close / Outside Click Handling:**
   - Automatically closes upon selection or when clicking outside.

---

## 4. Integration Target Modules
1. **`AdminAgenda.jsx` - Block Time Slot Modal (`showBlockModal`):**
   - Replacing the previous radial clock with `TimePickerUniversal` for `Desde` and `Hasta`.
2. **`AdminAgenda.jsx` - Add Appointment Modal & Edit Appointment Modal:**
   - Replacing raw selects with `TimePickerUniversal` for `Hora de Cita`.
3. **`AdminDashboard.jsx` & `AdminCaja.jsx`:**
   - Estandarizing any time selection across executive tools.

---

## 5. Verification Plan
- Build check: `npm run build` cleanly in `frontend/`.
- Functionality check: Verify opening popover, selecting hours/minutes/AM-PM, and applying changes to appointment & block slots.
