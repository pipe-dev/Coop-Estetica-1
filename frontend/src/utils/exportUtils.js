/**
 * Export Utilities for Excel / CSV formatted downloads
 * Uses UTF-8 BOM (\uFEFF) to guarantee 100% proper rendering of Spanish accents,
 * 'ñ', and Colombian peso formatting in Microsoft Excel, Google Sheets and Numbers.
 */

// Helper to escape values for RFC 4180 compliant CSV
function escapeCSVValue(val) {
  if (val === null || val === undefined) return '""'
  const stringVal = String(val)
  // If value contains comma, double quote, or newline, wrap in quotes and escape quotes
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes(';')) {
    return `"${stringVal.replace(/"/g, '""')}"`
  }
  return `"${stringVal}"`
}

/**
 * Downloads data as a .csv file
 * @param {Array<Object>} data Array of objects or arrays
 * @param {Array<string>} headers Column header names
 * @param {string} filename Output file name (e.g., 'Reporte_Caja_Agosto_2026.csv')
 */
export function downloadCSV({ headers, rows, filename = 'reporte.csv' }) {
  if (!headers || !rows || rows.length === 0) {
    alert('No hay datos disponibles para exportar con los filtros seleccionados.')
    return
  }

  // UTF-8 BOM + CSV Content
  let csvContent = '\uFEFF'

  // Header row
  csvContent += headers.map(escapeCSVValue).join(';') + '\r\n'

  // Data rows
  rows.forEach(row => {
    csvContent += row.map(escapeCSVValue).join(';') + '\r\n'
  })

  // Create Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export Formatter: Caja & Transacciones
 */
export function exportCajaTransactions(transactions, periodLabel = 'General') {
  const headers = [
    'ID Transacción',
    'Fecha',
    'Tipo',
    'Concepto / Descripción',
    'Categoría',
    'Método de Pago',
    'Monto ($ COP)'
  ]

  const rows = transactions.map(t => [
    t.id || 'N/A',
    t.date || '',
    t.type || 'Ingreso',
    t.description || '',
    t.category || 'General',
    t.paymentMethod || 'Efectivo',
    Number(t.amount || 0).toLocaleString('es-CO')
  ])

  // Summary row
  const totalIn = transactions.filter(t => t.type === 'Ingreso').reduce((a, b) => a + Number(b.amount || 0), 0)
  const totalOut = transactions.filter(t => t.type === 'Egreso').reduce((a, b) => a + Number(b.amount || 0), 0)
  const net = totalIn - totalOut

  rows.push(['---', '---', '---', '---', '---', '---', '---'])
  rows.push(['TOTALES', '', 'INGRESOS TOTALES', '', '', '', `$${totalIn.toLocaleString('es-CO')} COP`])
  rows.push(['TOTALES', '', 'EGRESOS TOTALES', '', '', '', `$${totalOut.toLocaleString('es-CO')} COP`])
  rows.push(['TOTALES', '', 'BALANCE NETO', '', '', '', `$${net.toLocaleString('es-CO')} COP`])

  const dateStamp = new Date().toISOString().split('T')[0]
  downloadCSV({
    headers,
    rows,
    filename: `Reporte_Caja_${periodLabel}_${dateStamp}.csv`
  })
}

/**
 * Export Formatter: Historial & Auditoría Completa
 */
export function exportAuditHistory(auditEvents) {
  const headers = [
    'ID Evento',
    'Fecha',
    'Hora / Timestamp',
    'Tipo de Movimiento',
    'Título / Concepto',
    'Detalle / Justificación',
    'Registrado / Autorizado Por',
    'Monto ($ COP)'
  ]

  const rows = auditEvents.map(e => [
    e.id || 'N/A',
    e.rawDate || '',
    e.displayTime || '',
    e.typeLabel || '',
    e.title || '',
    e.details || '',
    e.actor || 'Sistema',
    e.amount ? `${e.amountPrefix || ''}$${Number(e.amount).toLocaleString('es-CO')} COP` : 'N/A'
  ])

  const dateStamp = new Date().toISOString().split('T')[0]
  downloadCSV({
    headers,
    rows,
    filename: `Auditoria_Historial_Movimientos_${dateStamp}.csv`
  })
}

/**
 * Export Formatter: Directorio de Clientas
 */
export function exportClientsDirectory(clients, appointments = []) {
  const headers = [
    'ID Clienta',
    'Nombre Completo',
    'Teléfono / WhatsApp',
    'Email',
    'Total Visitas',
    'Total Invertido ($ COP)',
    'Último Servicio',
    'Fecha Última Visita',
    'Notas / Ficha'
  ]

  const rows = clients.map(c => {
    const clientApps = appointments.filter(a => a.clientPhone === c.phone || a.clientName.toLowerCase() === c.name.toLowerCase())
    const visitsCount = clientApps.length || c.visits || 1
    const totalSpent = clientApps.filter(a => a.status === 'Pagada').reduce((acc, a) => acc + (a.price || 0), 0) || c.totalSpent || 0
    const lastApp = clientApps[0]

    return [
      c.id || 'N/A',
      c.name || '',
      c.phone || '',
      c.email || 'No registrado',
      visitsCount,
      `$${totalSpent.toLocaleString('es-CO')} COP`,
      lastApp ? lastApp.serviceName : (c.lastService || 'Servicio General'),
      lastApp ? lastApp.date : (c.lastVisit || ''),
      c.notes || 'Cliente regular'
    ]
  })

  const dateStamp = new Date().toISOString().split('T')[0]
  downloadCSV({
    headers,
    rows,
    filename: `Directorio_Clientas_CatheryneRios_${dateStamp}.csv`
  })
}

/**
 * Export Formatter: Nómina & Comisiones de Especialistas
 */
export function exportPayrollReport(teamMembers, appointments = []) {
  const headers = [
    'ID Especialista',
    'Nombre Completo',
    'Especialidad / Rol',
    '% Comisión Asignado',
    'Citas Pagadas Atendidas',
    'Total Facturado Bruto ($ COP)',
    'Pago Neto Nómina ($ COP)',
    'Retención Spa ($ COP)'
  ]

  const rows = teamMembers.map(m => {
    const validApps = appointments.filter(a => a.specialistId === m.id && (a.status === 'Pagada' || a.status === 'Finalizada'))
    const totalGenerated = validApps.reduce((acc, a) => acc + (Number(a.price) || 0), 0)
    const rate = Number(m.commissionRate) || 40
    const commissionAmount = Math.round((totalGenerated * rate) / 100)
    const salonRetention = totalGenerated - commissionAmount

    return [
      m.id || 'N/A',
      m.name || '',
      m.role || '',
      `${rate}%`,
      validApps.length,
      `$${totalGenerated.toLocaleString('es-CO')} COP`,
      `$${commissionAmount.toLocaleString('es-CO')} COP`,
      `$${salonRetention.toLocaleString('es-CO')} COP`
    ]
  })

  const dateStamp = new Date().toISOString().split('T')[0]
  downloadCSV({
    headers,
    rows,
    filename: `Reporte_Nomina_Comisiones_${dateStamp}.csv`
  })
}

/**
 * Export Formatter: Inventario de Productos
 */
export function exportProductsInventory(products) {
  const headers = [
    'ID Producto',
    'Nombre del Producto',
    'Categoría',
    'Marca',
    'Precio de Venta ($ COP)',
    'Stock Actual (Unidades)',
    'Estado',
    'Valor Total en Inventario ($ COP)'
  ]

  const rows = products.map(p => [
    p.id || 'N/A',
    p.name || '',
    p.category || 'facial',
    p.brand || 'ÁUREA LUXURY',
    `$${Number(p.price || 0).toLocaleString('es-CO')} COP`,
    p.stock || 0,
    p.status || (p.stock > 0 ? 'Disponible' : 'Agotado'),
    `$${(Number(p.price || 0) * Number(p.stock || 0)).toLocaleString('es-CO')} COP`
  ])

  const totalValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stock || 0)), 0)
  rows.push(['---', '---', '---', '---', '---', '---', '---', '---'])
  rows.push(['TOTALES', '', '', '', '', '', 'VALOR TOTAL INVENTARIO', `$${totalValue.toLocaleString('es-CO')} COP`])

  const dateStamp = new Date().toISOString().split('T')[0]
  downloadCSV({
    headers,
    rows,
    filename: `Inventario_Productos_Tienda_${dateStamp}.csv`
  })
}
