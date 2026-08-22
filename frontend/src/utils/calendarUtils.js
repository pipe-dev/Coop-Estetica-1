/**
 * Generates a Google Calendar Web Event URL (100% client-side, free).
 */
export function generateGoogleCalendarUrl({ title, description, location, startDate, durationMinutes = 60 }) {
  const start = new Date(startDate)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const formatIsoUtc = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '')
  }

  const dates = `${formatIsoUtc(start)}/${formatIsoUtc(end)}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Cita de Estética - Catheryne Ríos',
    details: description || 'Reserva confirmada en Catheryne Ríos Estética.',
    location: location || 'Av. Elegancia #1234, Col. Premium',
    dates: dates
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Downloads an iCalendar (.ics) file directly in browser (Apple iCal / Outlook).
 */
export function downloadIcsFile({ title, description, location, startDate, durationMinutes = 60, filename = 'cita-estetica.ics' }) {
  const start = new Date(startDate)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const formatIsoUtc = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '')
  }

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
    `LOCATION:${location || 'Av. Elegancia #1234, Col. Premium'}`,
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
