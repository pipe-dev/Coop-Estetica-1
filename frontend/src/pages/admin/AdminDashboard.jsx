import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Calendar as CalendarIcon, TrendingUp, Users, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput, getLocalDateString } from '../../utils/currencyUtils'
import ExecutiveAnalyticsModal from '../../components/admin/ExecutiveAnalyticsModal'
import ConfirmSaleModal from '../../components/admin/ConfirmSaleModal'
import CancelAppointmentModal from '../../components/admin/CancelAppointmentModal'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const { appointments, transactions, teamMembers, updateAppointmentStatus, deleteAppointment, addTransaction } = useAdmin()
  const [selectedAnalyticsCard, setSelectedAnalyticsCard] = useState(null)
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false)
  const [quickAmount, setQuickAmount] = useState('')
  const [quickDesc, setQuickDesc] = useState('')
  const [selectedAppointmentForSale, setSelectedAppointmentForSale] = useState(null)
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState(null)

  const todayStr = getLocalDateString()
  const tomorrowObj = new Date()
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrowObj)

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const firstTime = timeStr.split('-')[0].trim()
    const match = firstTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return 0
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const period = match[3].toUpperCase()

    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  const todayApps = [...appointments]
    .filter(a => a.date === todayStr)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  const tomorrowApps = [...appointments]
    .filter(a => a.date === tomorrowStr)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  const futureApps = [...appointments]
    .filter(a => a.date > tomorrowStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return timeToMinutes(a.time) - timeToMinutes(b.time)
    })

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const formatted = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const renderAppointmentTable = (appsList, headerElement) => (
    <div className={styles.tableCard} style={{ marginBottom: '28px' }}>
      {headerElement}

      {appsList.length === 0 ? (
        <div className={styles.emptyTable}>
          <Clock size={32} className={styles.emptyIcon} />
          <p>No hay citas ni bloqueos programados.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Especialista</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {appsList.map(app => {
                const isBlocked = app.clientName && app.clientName.includes('Espacio Bloqueado')
                const rawReason = app.clientName
                  .replace('🚫 Espacio Bloqueado', '')
                  .replace('Espacio Bloqueado', '')
                  .replace(/[()]/g, '')
                  .trim()

                if (isBlocked) {
                  return (
                    <tr key={app.id} className={styles.blockedBannerRow}>
                      <td colSpan={6}>
                        <div className={styles.blockedBannerContent}>
                          <span className={styles.syneBlockedTitle}>Bloqueo</span>
                          <div className={styles.blockedCenterTime}>
                            <span className={styles.blockedTimeVal}>{app.time}</span>
                          </div>
                          <div className={styles.blockedRightInfo}>
                            <span className={styles.syneBlockedName}>{app.specialistName}</span>
                            <span className={styles.bodyBlockedReason}> — {rawReason || 'Permiso'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionCellGroup}>
                          <button
                            type="button"
                            className={styles.deleteMiniBtn}
                            onClick={() => {
                              if (window.confirm(`¿Eliminar bloqueo de horario (${app.time})?`)) {
                                deleteAppointment(app.id)
                              }
                            }}
                            title="Desbloquear horario"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={app.id}>
                    <td>
                      <span className={styles.timeVal}>{app.time}</span>
                    </td>
                    <td>
                      <div className={styles.clientCell}>
                        <span className={styles.clientName}>{app.clientName}</span>
                        <span className={styles.clientPhone}>{app.clientPhone}</span>
                      </div>
                    </td>
                    <td>{app.serviceName}</td>
                    <td>{app.specialistName}</td>
                    <td className={styles.priceCell}>${app.price.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.statusTag} ${styles[`status_${app.status.replace(/\s+/g, '_')}`]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCellGroup}>
                        {app.status !== 'Pagada' ? (
                          <button
                            className={styles.completeBtn}
                            onClick={() => setSelectedAppointmentForSale(app)}
                          >
                            <CheckCircle size={14} />
                            <span>Cobrar Venta</span>
                          </button>
                        ) : (
                          <span className={styles.doneText}>✓ Pagada</span>
                        )}

                        <button
                          type="button"
                          className={styles.deleteMiniBtn}
                          onClick={() => setSelectedAppointmentForCancel(app)}
                          title="Anular / Cancelar cita de forma auditada"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const todayAppointments = appointments.filter(a => a.date === todayStr)

  const totalSalesToday = transactions
    .filter(t => t.type === 'Ingreso' && t.date === todayStr)
    .reduce((acc, t) => acc + t.amount, 0)

  const totalExpensesToday = transactions
    .filter(t => t.type === 'Egreso' && t.date === todayStr)
    .reduce((acc, t) => acc + t.amount, 0)

  const netProfitToday = totalSalesToday - totalExpensesToday

  const handleQuickSaleSubmit = (e) => {
    e.preventDefault()
    const parsedAmount = parseCOPInput(quickAmount)
    if (!parsedAmount) return

    addTransaction({
      id: `tx-${Date.now()}`,
      type: 'Ingreso',
      amount: parsedAmount,
      description: quickDesc || 'Venta Exprés de Productos/Servicios',
      category: 'Venta Directa',
      paymentMethod: 'Efectivo',
      date: todayStr
    })

    setQuickAmount('')
    setQuickDesc('')
    setShowQuickSaleModal(false)
  }

  const handleConfirmAppointmentSale = (appointmentId, totalPrice, paymentMethod, notes) => {
    const appObj = appointments.find(a => a.id === appointmentId)
    updateAppointmentStatus(appointmentId, 'Pagada')
    addTransaction({
      id: `tx-app-${Date.now()}`,
      type: 'Ingreso',
      amount: totalPrice,
      description: `Cita Pagada: ${appObj?.serviceName || 'Servicio'} - ${appObj?.clientName || 'Cliente'}${notes ? ` (${notes})` : ''}`,
      category: 'Servicios',
      paymentMethod,
      date: todayStr
    })
  }

  return (
    <div className={styles.dashboardContainer}>
      
      {/* METRICS CARDS GRID */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('ingresos')}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Ingresos de Hoy</span>
            <div className={`${styles.iconBadge} ${styles.goldBadge}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>${totalSalesToday.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <span className={styles.metricSubtext}>Ventas brutas del día</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Citas Programadas</span>
            <div className={`${styles.iconBadge} ${styles.blueBadge}`}>
              <CalendarIcon size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{todayAppointments.length} <span className={styles.currency}>Citas</span></div>
          <span className={styles.metricSubtext}>{todayAppointments.filter(a => a.status === 'Reservada' || a.status === 'En Atención').length} pendientes de atender</span>
        </div>

        <div className={`${styles.metricCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('balance')}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Ganancia Neta</span>
            <div className={`${styles.iconBadge} ${styles.greenBadge}`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>${netProfitToday.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <span className={styles.metricSubtext}>Deduciendo egresos del día</span>
        </div>
      </div>

      {/* EXPANDED ANALYTICS MODAL */}
      <ExecutiveAnalyticsModal
        cardType={selectedAnalyticsCard}
        onClose={() => setSelectedAnalyticsCard(null)}
        transactions={transactions}
      />



      {/* SEPARATED APPOINTMENT TABLES BY DAY (HOY & MAÑANA) */}
      <div className={styles.dashboardTablesSection}>
        {renderAppointmentTable(
          todayApps,
          <div className={styles.tableHeaderToday}>
            <span className={styles.todayBadge}>HOY</span>
            <h4>Citas & Agenda de Hoy — {formatDateHeader(todayStr)}</h4>
          </div>
        )}

        {renderAppointmentTable(
          tomorrowApps,
          <div className={styles.tableHeaderTomorrow}>
            <span className={styles.tomorrowBadge}>MAÑANA</span>
            <h4>Citas & Agenda de Mañana — {formatDateHeader(tomorrowStr)}</h4>
          </div>
        )}
      </div>



      {/* CONFIRM SALE & CASH CALCULATOR MODAL */}
      {selectedAppointmentForSale && (
        <ConfirmSaleModal
          appointment={selectedAppointmentForSale}
          onClose={() => setSelectedAppointmentForSale(null)}
          onConfirm={handleConfirmSale}
        />
      )}

      {/* AUDITED CANCEL APPOINTMENT MODAL */}
      {selectedAppointmentForCancel && (
        <CancelAppointmentModal
          appointment={selectedAppointmentForCancel}
          onClose={() => setSelectedAppointmentForCancel(null)}
        />
      )}
    </div>
  )
}
