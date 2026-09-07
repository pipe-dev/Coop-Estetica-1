import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  History, 
  Calendar, 
  Filter, 
  DollarSign, 
  ShieldCheck, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Search, 
  Clock, 
  FileText, 
  Ban, 
  Download, 
  ChevronDown,
  Scissors
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { getLocalDateString } from '../../utils/currencyUtils'
import { exportAuditHistory, exportSpecialistHistory } from '../../utils/exportUtils'
import styles from './AdminHistorial.module.css'

export default function AdminHistorial() {
  const {
    appointments = [],
    transactions = [],
    cashSessions = [],
    reconciliations = [],
    currentUserRole,
    currentSpecialistId,
    setCurrentSpecialistId,
    teamMembers = []
  } = useAdmin()

  const isSpecialist = currentUserRole === 'SPECIALIST'
  const activeSpecialistObj = teamMembers.find(m => String(m.id) === String(currentSpecialistId)) || teamMembers[0]
  const activeSpecId = currentSpecialistId || activeSpecialistObj?.id
  const specRate = activeSpecialistObj?.commissionRate || 40

  // Audit Filters
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month'
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'sale' | 'expense' | 'cash' | 'reconciliation'
  const [searchTerm, setSearchTerm] = useState('')

  const todayStr = getLocalDateString()

  // Calculate Monday of current week
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const daysFromMonday = (currentDayOfWeek + 6) % 7
  const mondayObj = new Date(now)
  mondayObj.setDate(now.getDate() - daysFromMonday)
  const mondayStr = getLocalDateString(mondayObj)
  const currentYearMonth = todayStr.substring(0, 7)

  // Build unified audit feed safely
  const auditEvents = []

  if (isSpecialist) {
    // ----------------------------------------------------
    // FEED PERSONAL DE ESPECIALISTA: Sus servicios y honorarios
    // ----------------------------------------------------
    appointments.forEach(a => {
      const matchSpec = String(a.specialistId) === String(activeSpecId) || 
                        (activeSpecialistObj?.name && a.specialistName === activeSpecialistObj.name)
      
      if (matchSpec) {
        const isPaidOrDone = a.status === 'Pagada' || a.status === 'Finalizada' || a.status === 'Completada'
        const isCancelled = a.status === 'Cancelada'
        const netAmount = a.commissionAmount !== undefined 
          ? a.commissionAmount 
          : Math.round((Number(a.price || 0) * specRate) / 100)

        auditEvents.push({
          id: `evt-app-${a.id}`,
          rawDate: a.date || todayStr,
          timestamp: a.date || todayStr,
          displayTime: `${a.date || todayStr} • ${a.time || ''}`,
          category: 'service',
          typeLabel: a.status || 'Atendida',
          circleClass: isPaidOrDone ? styles.circleGreen : isCancelled ? styles.circleRed : styles.circleGold,
          badgePillClass: isPaidOrDone ? styles.badgePillGreen : isCancelled ? styles.badgePillRed : styles.badgePillGold,
          amountClass: isCancelled ? styles.amountRed : styles.amountGreen,
          icon: Scissors,
          title: a.serviceName || 'Servicio de Estética',
          actor: `Clienta: ${a.clientName || 'Cliente'} (${a.clientPhone || 'Sin teléfono'})`,
          details: `Precio de lista: $${Number(a.price || 0).toLocaleString()} COP • Honorario neto (${specRate}%): $${netAmount.toLocaleString()} COP`,
          amount: isCancelled ? 0 : netAmount,
          amountPrefix: isCancelled ? '🚫 ' : '+',
          originalApp: a,
          isPaidOrDone
        })
      }
    })
  } else {
    // ----------------------------------------------------
    // FEED COMPLETO DE AUDITORÍA: Dueña y Administradora
    // ----------------------------------------------------
    // 1. Transactions (Sales & Expenses)
    transactions.forEach(t => {
      const isIncome = t.type === 'Ingreso'
      auditEvents.push({
        id: `evt-tx-${t.id}`,
        rawDate: t.date || todayStr,
        timestamp: t.date || todayStr,
        displayTime: t.date || todayStr,
        category: isIncome ? 'sale' : 'expense',
        typeLabel: isIncome ? 'Venta / Ingreso' : 'Egreso / Gasto',
        circleClass: isIncome ? styles.circleGreen : styles.circleRed,
        badgePillClass: isIncome ? styles.badgePillGreen : styles.badgePillRed,
        amountClass: isIncome ? styles.amountGreen : styles.amountRed,
        icon: isIncome ? ArrowUpRight : ArrowDownRight,
        title: t.description || 'Movimiento Financiero',
        actor: t.paymentMethod ? `Método: ${t.paymentMethod}` : 'Sistema',
        details: t.category ? `Categoría: ${t.category}` : 'General',
        amount: Number(t.amount) || 0,
        amountPrefix: isIncome ? '+' : '-'
      })
    })

    // 2. Cash Sessions (Open & Close)
    cashSessions.forEach(s => {
      const openDateStr = s.openedAt ? (s.openedAt.includes(' ') ? s.openedAt.split(' ')[0] : s.openedAt) : todayStr
      const initBase = Number(s.initialBase) || 0
      auditEvents.push({
        id: `evt-sess-open-${s.id}`,
        rawDate: openDateStr,
        timestamp: openDateStr,
        displayTime: s.openedAt || openDateStr,
        category: 'cash',
        typeLabel: 'Apertura de Caja',
        circleClass: styles.circleGold,
        badgePillClass: styles.badgePillGold,
        amountClass: styles.amountGold,
        icon: Wallet,
        title: `Apertura de Turno con Base`,
        actor: `Responsable: ${s.responsibleName || 'Staff'}`,
        details: s.notes ? `Nota: ${s.notes}` : 'Inicio de sesión de caja',
        amount: initBase,
        amountPrefix: '+'
      })

      if (s.status === 'Cerrada' && s.closedAt) {
        const closeDateStr = s.closedAt.includes(' ') ? s.closedAt.split(' ')[0] : s.closedAt
        const diff = Number(s.difference) || 0
        const expCash = Number(s.expectedCash) || 0
        const rCash = Number(s.realCash) || 0
        auditEvents.push({
          id: `evt-sess-close-${s.id}`,
          rawDate: closeDateStr,
          timestamp: closeDateStr,
          displayTime: s.closedAt,
          category: 'cash',
          typeLabel: 'Cierre de Caja & Arqueo',
          circleClass: diff === 0 ? styles.circleGreen : diff < 0 ? styles.circleRed : styles.circleGold,
          badgePillClass: diff === 0 ? styles.badgePillGreen : diff < 0 ? styles.badgePillRed : styles.badgePillGold,
          amountClass: diff >= 0 ? styles.amountGreen : styles.amountRed,
          icon: ShieldCheck,
          title: `Cierre de Turno (Esperado: $${expCash.toLocaleString()} | Real: $${rCash.toLocaleString()})`,
          actor: `Responsable: ${s.responsibleName || 'Staff'}`,
          details: s.closingNotes ? `Nota: ${s.closingNotes}` : `Diferencia en arqueo: $${diff.toLocaleString()} COP`,
          amount: Math.abs(diff),
          amountPrefix: diff >= 0 ? '+' : '-'
        })
      }
    })

    // 3. Reconciliations & Security Audits
    reconciliations.forEach(r => {
      const recDateStr = r.resolvedAt ? (r.resolvedAt.includes(' ') ? r.resolvedAt.split(' ')[0] : r.resolvedAt) : todayStr
      const recAmount = Number(r.amount) || 0
      const isCancellation = r.resolutionType === 'Anulación de Cita'

      auditEvents.push({
        id: `evt-rec-${r.id}`,
        rawDate: recDateStr,
        timestamp: recDateStr,
        displayTime: r.resolvedAt || recDateStr,
        category: isCancellation ? 'cancellation' : 'reconciliation',
        typeLabel: isCancellation ? 'Anulación de Cita' : 'Reconciliación',
        circleClass: isCancellation ? styles.circleRed : styles.circlePurple,
        badgePillClass: isCancellation ? styles.badgePillRed : styles.badgePillPurple,
        amountClass: isCancellation ? styles.amountRed : styles.amountGold,
        icon: isCancellation ? Ban : Scale,
        title: isCancellation ? r.reason : `[${r.resolutionType || 'Ajuste'}] ${r.reason || 'Reconciliación de Descuadre'}`,
        actor: `Autorizado por: ${r.resolvedBy || 'Administración'}`,
        details: isCancellation ? 'Control de Auditoría Anti-Fraude' : 'Estado: Auditoría Cuadrada y Validada',
        amount: recAmount,
        amountPrefix: isCancellation ? '🚫 ' : '='
      })
    })
  }

  // Sort chronological descending (newest first)
  auditEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Filter events
  const filteredEvents = auditEvents.filter(evt => {
    if (dateFilter === 'today' && evt.rawDate !== todayStr) return false
    if (dateFilter === 'week' && (evt.rawDate < mondayStr || evt.rawDate > todayStr)) return false
    if (dateFilter === 'month' && !evt.rawDate.startsWith(currentYearMonth)) return false
    if (!isSpecialist && typeFilter !== 'all' && evt.category !== typeFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (evt.title && evt.title.toLowerCase().includes(term)) ||
             (evt.actor && evt.actor.toLowerCase().includes(term)) ||
             (evt.details && evt.details.toLowerCase().includes(term)) ||
             (evt.typeLabel && evt.typeLabel.toLowerCase().includes(term))
    }
    return true
  })

  // Calculate quick metrics
  const totalInflows = filteredEvents.filter(e => e.category === 'sale').reduce((acc, e) => acc + e.amount, 0)
  const totalOutflows = filteredEvents.filter(e => e.category === 'expense').reduce((acc, e) => acc + e.amount, 0)
  const totalSpecialistEarned = isSpecialist 
    ? filteredEvents.reduce((acc, e) => acc + (e.amount || 0), 0)
    : 0

  return (
    <div className={styles.container}>
      {/* EXECUTIVE HEADER */}
      <div className={styles.header}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>
            {isSpecialist ? `Historial Personal: ${activeSpecialistObj?.name || 'Especialista'}` : 'Historial & Auditoría General'}
          </h2>
          <p className={styles.subtitle}>
            {isSpecialist 
              ? `Registro de servicios atendidos y cálculo de honorarios netos correspondientes al ${specRate}% de comisión.`
              : 'Registro cronológico e inmutable de todos los movimientos de caja, ventas y operaciones del spa.'
            }
          </p>
        </div>

        {/* SUMMARY STATS BADGES + EXPORT */}
        <div className={styles.headerRight}>
          <div className={styles.statsSummaryPills}>
            <div className={styles.summaryPill}>
              <span>{isSpecialist ? 'Servicios:' : 'Movimientos:'}</span>
              <strong>{filteredEvents.length}</strong>
            </div>
            {isSpecialist ? (
              <>
                <div className={`${styles.summaryPill} ${styles.pillGreen}`}>
                  <span>Total Ganado:</span>
                  <strong>+${totalSpecialistEarned.toLocaleString()} COP</strong>
                </div>
                <div className={styles.summaryPill}>
                  <span>Comisión:</span>
                  <strong>{specRate}%</strong>
                </div>
              </>
            ) : (
              <>
                <div className={`${styles.summaryPill} ${styles.pillGreen}`}>
                  <span>Ingresos:</span>
                  <strong>+${totalInflows.toLocaleString()} COP</strong>
                </div>
                <div className={`${styles.summaryPill} ${styles.pillRed}`}>
                  <span>Egresos:</span>
                  <strong>-${totalOutflows.toLocaleString()} COP</strong>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => {
              if (isSpecialist) {
                exportSpecialistHistory(filteredEvents.map(e => e.originalApp).filter(Boolean), activeSpecialistObj)
              } else {
                exportAuditHistory(filteredEvents)
              }
            }}
            title="Descargar reporte como archivo Excel / CSV"
          >
            <Download size={15} />
            <span>Exportar Historial</span>
          </button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          {isSpecialist ? (
            teamMembers.length > 1 && (
              <div className={styles.inputWrapper}>
                <Scissors size={16} className={styles.goldIcon} />
                <select 
                  value={String(activeSpecId)} 
                  onChange={e => setCurrentSpecialistId(e.target.value)} 
                  className={styles.selectInput}
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name} ({m.role || 'Especialista'})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </div>
            )
          ) : (
            <div className={styles.inputWrapper}>
              <Filter size={16} className={styles.goldIcon} />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={styles.selectInput}>
                <option value="all">Todos los Eventos</option>
                <option value="sale">Solo Ventas e Ingresos</option>
                <option value="expense">Solo Egresos y Gastos</option>
                <option value="cancellation">Anulaciones de Citas (Auditadas)</option>
                <option value="cash">Aperturas y Cierres de Caja</option>
                <option value="reconciliation">Reconciliaciones de Descuadre</option>
              </select>
              <ChevronDown size={14} className={styles.chevronIcon} />
            </div>
          )}

          <div className={styles.inputWrapper}>
            <Calendar size={16} className={styles.goldIcon} />
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={styles.selectInput}>
              <option value="all">Todo el Historial</option>
              <option value="today">Solo Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
            </select>
            <ChevronDown size={14} className={styles.chevronIcon} />
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={isSpecialist ? "Buscar por servicio, clienta o teléfono..." : "Buscar por concepto, cliente o responsable..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* TIMELINE LOG LIST */}
      <div className={styles.timelineList}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState}>
            {isSpecialist ? (
              <>
                <Scissors size={36} className={styles.emptyIcon} />
                <p>No se encontraron servicios registrados en tu historial con los filtros seleccionados.</p>
                <small style={{ color: '#737373', fontSize: '0.78rem' }}>
                  A medida que atiendas y cobres citas desde tu Agenda, aquí se guardará el registro inmutable de tus honorarios ganados.
                </small>
              </>
            ) : (
              <>
                <ShieldCheck size={36} className={styles.emptyIcon} />
                <p>No se encontraron movimientos registrados con los filtros seleccionados.</p>
              </>
            )}
          </div>
        ) : (
          filteredEvents.map(evt => {
            const IconComponent = evt.icon || ShieldCheck
            return (
              <div key={evt.id} className={styles.timelineItem}>
                <div className={styles.itemLeftGroup}>
                  <div className={`${styles.iconCircle} ${evt.circleClass}`}>
                    <IconComponent size={20} />
                  </div>
                  
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.evtTitle}>{evt.title}</span>
                      <span className={`${styles.badgePill} ${evt.badgePillClass}`}>{evt.typeLabel}</span>
                      <span className={styles.evtTime}>{evt.displayTime}</span>
                    </div>

                    <div className={styles.timelineBody}>
                      <span>{evt.details}</span>
                      <span>•</span>
                      <span className={styles.evtActor}>{evt.actor}</span>
                    </div>
                  </div>
                </div>

                {evt.amount > 0 && (
                  <div className={`${styles.timelineAmount} ${evt.amountClass}`}>
                    {evt.amountPrefix}${evt.amount.toLocaleString()} COP
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
