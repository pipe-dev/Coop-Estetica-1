/**
 * Safely parses date and time strings (supports "YYYY-MM-DD", "10:00 AM", "02:30 PM", ISO strings, etc.)
 */
export function parseDateTime(dateStr, timeStr) {
  try {
    if (!dateStr) return new Date()

    // If single string passed that is already valid ISO or standard date
    if (!timeStr) {
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) return parsed
    }

    // Split date (YYYY-MM-DD)
    const parts = (dateStr || '').split('-').map(Number)
    if (parts.length < 3 || isNaN(parts[0])) return new Date()
    const [year, month, day] = parts

    let hours = 10
    let minutes = 0

    if (timeStr) {
      // e.g. "10:30 AM" or "02:00 PM" or "14:30"
      const isPM = /PM/i.test(timeStr)
      const isAM = /AM/i.test(timeStr)
      const cleanTime = timeStr.replace(/[^\d:]/g, '')
      const [h, m] = cleanTime.split(':').map(Number)

      hours = !isNaN(h) ? h : 10
      minutes = !isNaN(m) ? m : 0

      if (isPM && hours < 12) hours += 12
      if (isAM && hours === 12) hours = 0
    }

    const d = new Date(year, month - 1, day, hours, minutes, 0)
    return isNaN(d.getTime()) ? new Date() : d
  } catch (err) {
    console.error('Error parsing date/time in calendarUtils:', err)
    return new Date()
  }
}

/**
 * Formats a Date object to UTC ISO format required by calendar links (YYYYMMDDTHHmmssZ)
 */
function formatIsoUtc(date) {
  try {
    const validDate = (!date || isNaN(date.getTime())) ? new Date() : date
    return validDate.toISOString().replace(/-|:|\.\d+/g, '')
  } catch (e) {
    return new Date().toISOString().replace(/-|:|\.\d+/g, '')
  }
}

/**
 * Generates a Google Calendar Web Event URL (100% client-side, free).
 */
export function generateGoogleCalendarUrl({ title, description, location, date, time, startDate, durationMinutes = 60 }) {
  let start = date || time ? parseDateTime(date, time) : parseDateTime(startDate)
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60000)

  const dates = `${formatIsoUtc(start)}/${formatIsoUtc(end)}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Cita de Estética - Catheryne Ríos',
    details: description || 'Reserva confirmada en Catheryne Ríos Estética.',
    location: location || 'Catheryne Ríos Estética',
    dates: dates
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Downloads an iCalendar (.ics) file directly in browser (Apple iCal / Outlook).
 */
export function downloadIcsFile({ title, description, location, date, time, startDate, durationMinutes = 60, filename = 'cita-estetica.ics' }) {
  let start = date || time ? parseDateTime(date, time) : parseDateTime(startDate)
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60000)

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Catheryne Ríos Estética//Reservas//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@catheryneriosestetica.com`,
    `DTSTAMP:${formatIsoUtc(new Date())}`,
    `DTSTART:${formatIsoUtc(start)}`,
    `DTEND:${formatIsoUtc(end)}`,
    `SUMMARY:${title || 'Cita de Estética - Catheryne Ríos'}`,
    `DESCRIPTION:${description || 'Reserva confirmada.'}`,
    `LOCATION:${location || 'Catheryne Ríos Estética'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
