/**
 * Utility functions for Colombian Peso ($ COP) live input formatting
 */

// Formats a raw number or string into thousand-separated Colombian format (e.g. "120000" -> "120.000")
export function formatCOPInput(value) {
  if (value === null || value === undefined || value === '') return ''
  // Remove all non-digits
  const cleanNumber = value.toString().replace(/\D/g, '')
  if (!cleanNumber) return ''
  // Format with dots
  return parseInt(cleanNumber, 10).toLocaleString('es-CO')
}

// Formats a number to currency string with dollar sign ($ 120.000)
export function formatCOP(value) {
  if (value === null || value === undefined) return '$0'
  const num = Number(value) || 0
  return `$${num.toLocaleString('es-CO')}`
}

// Parses a formatted string back to raw number (e.g. "120.000" -> 120000)
export function parseCOPInput(formattedStr) {
  if (!formattedStr) return 0
  const cleanNumber = formattedStr.toString().replace(/\D/g, '')
  return cleanNumber ? parseInt(cleanNumber, 10) : 0
}

// Returns local Colombian YYYY-MM-DD date without UTC timezone shift
export function getLocalDateString(dateInput = new Date()) {
  const d = new Date(dateInput)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Returns local Colombian YYYY-MM-DD hh:mm a date and time string
export function getLocalDateTimeString(dateInput = new Date()) {
  const d = new Date(dateInput)
  const dateStr = getLocalDateString(d)
  const timeStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${dateStr} ${timeStr}`
}
