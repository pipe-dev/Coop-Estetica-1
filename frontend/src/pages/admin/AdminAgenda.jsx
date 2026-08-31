import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Filter, Plus, Clock, User, Phone, CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { getLocalDateString } from '../../utils/currencyUtils'
import ConfirmSaleModal from '../../components/admin/ConfirmSaleModal'
import CancelAppointmentModal from '../../components/admin/CancelAppointmentModal'
import TimePickerUniversal from '../../components/ui/TimePickerUniversal'
import styles from './AdminAgenda.module.css'

const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
]

export default function AdminAgenda() {
  const { 
    appointments, 
    teamMembers, 
    servicesList, 
    addAppointment, 
    updateAppointmentStatus, 
    updateAppointment, 
    deleteAppointment, 
    cancelAppointment, 
    reactivateAppointment, 
    addTransaction,
    currentUserRole,
    currentSpecialistId
  } = useAdmin()

  const isSpecialist = currentUserRole === 'SPECIALIST'
  const activeSpecialistObj = teamMembers.find(m => m.id === (currentSpecialistId || '2'))

  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [selectedSpecialist, setSelectedSpecialist] = useState(isSpecialist ? (currentSpecialistId || '2') : 'all')

  // Auto-sync filter if specialist role is active
  React.useEffect(() => {
    if (isSpecialist) {
      setSelectedSpecialist(currentSpecialistId || '2')
    }
  }, [isSpecialist, currentSpecialistId])

  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState(null)

  // Custom Big Gold Calendar Modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const initialDateObj = new Date(selectedDate + 'T00:00:00')
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth())

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(prev => prev - 1)
    } else {
      setViewMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(prev => prev + 1)
    } else {
      setViewMonth(prev => prev + 1)
    }
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const handleSelectDay = (dayNum) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0')
    const formattedDay = String(dayNum).padStart(2, '0')
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`
    setSelectedDate(dateStr)
    setShowCalendarModal(false)
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [serviceId, setServiceId] = useState(servicesList[0]?.id || '1')
  const [specialistId, setSpecialistId] = useState(teamMembers[0]?.id || '1')
  const [addDate, setAddDate] = useState(getLocalDateString())
  const [time, setTime] = useState('10:00 AM')

  // Block Modal state
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockSpecialistId, setBlockSpecialistId] = useState(teamMembers[0]?.id || '1')
  const [blockReason, setBlockReason] = useState('Almuerzo')
  const [customBlockReason, setCustomBlockReason] = useState('')
  const [blockStartTime, setBlockStartTime] = useState('01:00 PM')
  const [blockEndTime, setBlockEndTime] = useState('02:00 PM')
  const [blockNotes, setBlockNotes] = useState('')
  const [activeTimeTab, setActiveTimeTab] = useState('start')

  const handleBlockSubmit = (e) => {
    e.preventDefault()
    const specObj = teamMembers.find(m => m.id === blockSpecialistId)
    const finalReason = blockReason === 'Otro' ? (customBlockReason.trim() || 'Otro Motivo') : blockReason

    addAppointment({
      id: `block-${Date.now()}`,
      clientName: `🚫 Espacio Bloqueado (${finalReason})`,
      clientPhone: 'N/A',
      serviceId: 'block',
      serviceName: `[${finalReason}] ${blockNotes ? blockNotes : 'Bloqueo de Horario'}`,
      specialistId: blockSpecialistId,
      specialistName: specObj?.name || 'Especialista',
      date: selectedDate,
      time: `${blockStartTime} - ${blockEndTime}`,
      price: 0,
      status: 'Cancelada',
      isBlockedSlot: true
    })

    setShowBlockModal(false)
    setBlockNotes('')
    setCustomBlockReason('')
  }

  // Edit Modal State (Citas)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [editClientName, setEditClientName] = useState('')
  const [editClientPhone, setEditClientPhone] = useState('')
  const [editServiceId, setEditServiceId] = useState('')
  const [editSpecialistId, setEditSpecialistId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState('Reservada')

  // Edit Blocked Slot State (Modal Simplificado para Bloqueos)
  const [editingBlockSlot, setEditingBlockSlot] = useState(null)
  const [editBlockReason, setEditBlockReason] = useState('')
  const [editBlockSpecialistId, setEditBlockSpecialistId] = useState('')
  const [editBlockStartTime, setEditBlockStartTime] = useState('01:00 PM')
  const [editBlockEndTime, setEditBlockEndTime] = useState('02:00 PM')
  const [editBlockDate, setEditBlockDate] = useState('')

  const handleOpenEditModal = (app) => {
    const isBlocked = app.clientName && (app.clientName.includes('Espacio Bloqueado') || app.serviceName.includes('Bloqueo de Horario'))

    if (isBlocked) {
      setEditingBlockSlot(app)
      const rawReason = app.clientName
        .replace('🚫 Espacio Bloqueado', '')
        .replace('Espacio Bloqueado', '')
        .replace(/[()]/g, '')
        .trim()
      setEditBlockReason(rawReason || 'Permiso / Almuerzo')
      setEditBlockSpecialistId(app.specialistId || teamMembers[0]?.id)
      setEditBlockDate(app.date)

      if (app.time && app.time.includes('-')) {
        const parts = app.time.split('-')
        setEditBlockStartTime(parts[0].trim())
        setEditBlockEndTime(parts[1].trim())
      } else {
        setEditBlockStartTime(app.time || '01:00 PM')
        setEditBlockEndTime('02:00 PM')
      }
      return
    }

    setEditingAppointment(app)
    setEditClientName(app.clientName)
    setEditClientPhone(app.clientPhone)
    setEditServiceId(app.serviceId || servicesList[0]?.id)
    setEditSpecialistId(app.specialistId || teamMembers[0]?.id)
    setEditDate(app.date)
    setEditTime(app.time)
    setEditStatus(app.status)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editingAppointment) return

    const sObj = servicesList.find(s => s.id === editServiceId)
    const mObj = teamMembers.find(m => m.id === editSpecialistId)

    updateAppointment(editingAppointment.id, {
      clientName: editClientName,
      clientPhone: editClientPhone,
      serviceId: editServiceId,
      serviceName: sObj?.name || editingAppointment.serviceName,
      price: sObj?.price || editingAppointment.price,
      specialistId: editSpecialistId,
      specialistName: mObj?.name || editingAppointment.specialistName,
      date: editDate,
      time: editTime,
      status: editStatus
    })

    setEditingAppointment(null)
  }

  const handleEditBlockSubmit = (e) => {
    e.preventDefault()
    if (!editingBlockSlot) return

    const specialistObj = teamMembers.find(m => m.id === editBlockSpecialistId)
    const formattedTimeRange = `${editBlockStartTime} - ${editBlockEndTime}`
    const finalReasonName = editBlockReason || 'Permiso / Almuerzo'

    updateAppointment(editingBlockSlot.id, {
      clientName: `🚫 Espacio Bloqueado (${finalReasonName})`,
      serviceName: `[${finalReasonName}] Bloqueo de Horario`,
      specialistId: editBlockSpecialistId,
      specialistName: specialistObj?.name || editingBlockSlot.specialistName,
      date: editBlockDate,
      time: formattedTimeRange
    })

    setEditingBlockSlot(null)
  }

  const handleDeleteAppointment = (app) => {
    if (app.serviceId === 'block') {
      if (window.confirm(`¿Estás seguro de desbloquear este horario de "${app.specialistName}"?`)) {
        deleteAppointment(app.id)
      }
    } else {
      setSelectedAppointmentForCancel(app)
    }
  }

  const [selectedAppointmentForSale, setSelectedAppointmentForSale] = useState(null)

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

  const formatCategoryDateHeader = (dateStr) => {
    if (!dateStr) return { type: 'DATE', label: '' }
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)

    const formatted = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1)

    if (dateStr === todayStr) {
      return { type: 'HOY', label: capitalized }
    }
    if (dateStr === tomorrowStr) {
      return { type: 'MAÑANA', label: capitalized }
    }
    return { type: 'DATE', label: capitalized }
  }

  const startDateStr = selectedDate || todayStr
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number)
  const day2DateObj = new Date(sYear, sMonth - 1, sDay + 1)
  const day2Str = getLocalDateString(day2DateObj)

  const activeDates = [startDateStr, day2Str]

  const filteredAppointments = appointments
    .filter(a => {
      const matchDate = activeDates.includes(a.date)
      const matchSpec = selectedSpecialist === 'all' || a.specialistId === selectedSpecialist
      return matchDate && matchSpec
    })
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return timeToMinutes(a.time) - timeToMinutes(b.time)
    })

  const groupedByDate = activeDates.reduce((acc, dateKey) => {
    acc[dateKey] = filteredAppointments.filter(a => a.date === dateKey)
    return acc
  }, {})

  const dateKeys = activeDates

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!clientName || !clientPhone) return

    const serviceObj = servicesList.find(s => s.id === serviceId)
    const specialistObj = teamMembers.find(m => m.id === specialistId)

    addAppointment({
      id: `app-${Date.now()}`,
      clientName,
      clientPhone,
      serviceId,
      serviceName: serviceObj?.name || 'Servicio de Estética',
      specialistId,
      specialistName: specialistObj?.name || 'Especialista',
      date: addDate || selectedDate,
      time,
      price: serviceObj?.price || 150000,
      status: 'Reservada'
    })

    setClientName('')
    setClientPhone('')
    setShowAddModal(false)
  }

  const handleConfirmSale = ({ appointmentId, paymentMethod, totalPrice, notes }) => {
    const appObj = appointments.find(a => a.id === appointmentId)
    updateAppointmentStatus(appointmentId, 'Pagada')
    addTransaction({
      id: `tx-app-${Date.now()}`,
      type: 'Ingreso',
      amount: totalPrice,
      description: `Cita Pagada: ${appObj?.serviceName || 'Servicio'} - ${appObj?.clientName || 'Cliente'}${notes ? ` (${notes})` : ''}`,
      category: 'Servicios',
      paymentMethod,
      date: selectedDate
    })
    setSelectedAppointmentForSale(null)
  }

  const specialistNetToday = React.useMemo(() => {
    if (!isSpecialist) return 0
    const specApps = appointments.filter(a => a.specialistId === (currentSpecialistId || '2') && a.date === selectedDate && a.status !== 'Cancelada')
    const specRate = activeSpecialistObj?.commissionRate || 45
    return specApps.reduce((sum, a) => {
      const net = a.commissionAmount !== undefined ? a.commissionAmount : (a.price * specRate) / 100
      return sum + net
    }, 0)
  }, [isSpecialist, appointments, currentSpecialistId, selectedDate, activeSpecialistObj])

  return (
    <div className={styles.agendaContainer}>
      
      {/* SPECIALIST NET EARNINGS BANNER */}
      {isSpecialist && (
        <div className={styles.specialistBanner}>
          <div className={styles.specialistBannerInfo}>
            <span className={styles.specialistBadge}>Agenda de Especialista: {activeSpecialistObj?.name || 'Especialista'}</span>
            <p className={styles.specialistBannerSub}>
              Consulta tu horario asignado y el cálculo automático de tus honorarios netos correspondientes a los servicios del día.
            </p>
          </div>
          <div className={styles.specialistNetCard}>
            <span className={styles.specialistNetLabel}>Acumulado Neto Hoy</span>
            <span className={styles.specialistNetValue}>${specialistNetToday.toLocaleString()} COP</span>
            <small className={styles.specialistRateLabel}>Comisión: {activeSpecialistObj?.commissionRate || 45}%</small>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.inputWrapper} onClick={() => setShowCalendarModal(true)} style={{ cursor: 'pointer' }}>
            <CalendarIcon size={18} className={styles.goldIcon} />
            <span className={styles.dateDisplaySpan}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <input
              type="date"
              className={styles.dateInputHidden}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          <div className={styles.inputWrapper}>
            <Filter size={18} className={styles.goldIcon} />
            <select
              className={styles.selectInput}
              value={selectedSpecialist}
              onChange={e => setSelectedSpecialist(e.target.value)}
              disabled={isSpecialist}
            >
              {!isSpecialist && <option value="all">Todas las Especialistas</option>}
              {teamMembers
                .filter(m => !isSpecialist || m.id === (currentSpecialistId || '2'))
                .map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
          </div>

        </div>

        <div className={styles.btnGroupRow}>
          <button className={styles.blockBtn} onClick={() => {
            if (selectedSpecialist !== 'all') {
              setBlockSpecialistId(selectedSpecialist)
            }
            setShowBlockModal(true)
          }}>
            <span>Bloquear Almuerzo / Permiso</span>
          </button>

          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Agendar Cita Manual</span>
          </button>
        </div>
      </div>

      {/* APPOINTMENTS TIMELINE / CATEGORIZED BY DATES */}
      <div className={styles.agendaTimelineContainer}>
        {dateKeys.length === 0 ? (
          <div className={styles.emptyAgenda}>
            <Clock size={42} className={styles.emptyIcon} />
            <h4>No hay citas registradas para los criterios seleccionados</h4>
            <p>Selecciona otra fecha o especialista, o pulsa "Agendar Cita Manual".</p>
          </div>
        ) : (
          dateKeys.map(dateKey => {
            const group = groupedByDate[dateKey]
            const headerInfo = formatCategoryDateHeader(dateKey)

            return (
              <div key={dateKey} className={styles.dateCategorySection}>
                <div className={styles.categoryHeaderRow}>
                  {headerInfo.type === 'HOY' && (
                    <div className={styles.categoryBadgeToday}>HOY — {headerInfo.label}</div>
                  )}
                  {headerInfo.type === 'MAÑANA' && (
                    <div className={styles.categoryBadgeTomorrow}>MAÑANA — {headerInfo.label}</div>
                  )}
                  {headerInfo.type === 'DATE' && (
                    <div className={styles.categoryBadgeDate}>{headerInfo.label}</div>
                  )}
                </div>

                {group.length === 0 ? (
                  <div className={styles.emptyDayNotice}>
                    <span>Sin citas ni bloqueos programados para este día</span>
                  </div>
                ) : (
                  <div className={styles.cardsGrid}>
                    {group.map(app => {
                    const isBlocked = app.clientName && app.clientName.includes('Espacio Bloqueado')
                    const rawReason = app.clientName
                      .replace('🚫 Espacio Bloqueado', '')
                      .replace('Espacio Bloqueado', '')
                      .replace(/[()]/g, '')
                      .trim()

                    if (isBlocked) {
                      return (
                        <div key={app.id} className={styles.blockedAgendaCard}>
                          <div className={styles.blockedCardHeader}>
                            <div className={styles.blockedHeaderLeft}>
                              <span className={styles.syneBlockedTitle}>BLOQUEO</span>
                            </div>

                            <div className={styles.cardHeaderRight}>
                              <button
                                type="button"
                                className={styles.iconEditBtn}
                                onClick={() => handleOpenEditModal(app)}
                                title="Editar bloqueo"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                type="button"
                                className={styles.iconDeleteBtn}
                                onClick={() => handleDeleteAppointment(app)}
                                title="Eliminar bloqueo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.blockedCardBody}>
                            <div className={styles.blockedTimeRow}>
                              <span className={styles.syneBlockedTimeVal}>{app.time}</span>
                            </div>

                            <div className={styles.blockedDetailLine}>
                              <span className={styles.syneBlockedName}>{app.specialistName}</span>
                              <span className={styles.bodyBlockedReason}> — {rawReason || 'Permiso / Almuerzo'}</span>
                            </div>
                          </div>

                          <div className={styles.blockedCardFooter}>
                            <button
                              className={styles.unblockBtn}
                              onClick={() => handleDeleteAppointment(app)}
                            >
                              <span>Desbloquear Horario</span>
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={app.id} className={styles.appointmentCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.timeBadge}>
                            <span>{app.time}</span>
                          </div>

                          <div className={styles.cardHeaderRight}>
                            <span className={`${styles.statusPill} ${styles[`status_${app.status.replace(/\s+/g, '_')}`]}`}>
                              {app.status}
                            </span>

                            <button
                              type="button"
                              className={styles.iconEditBtn}
                              onClick={() => handleOpenEditModal(app)}
                              title="Editar cita"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              className={styles.iconDeleteBtn}
                              onClick={() => handleDeleteAppointment(app)}
                              title="Eliminar cita"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.cardBody}>
                          <h4 className={styles.clientTitle}>{app.clientName}</h4>
                          <div className={styles.phoneRow}>
                            <Phone size={13} />
                            <span>{app.clientPhone}</span>
                          </div>

                          <div className={styles.divider} />

                          <div className={styles.infoRow}>
                            <span className={styles.label}>Servicio:</span>
                            <span className={styles.value}>{app.serviceName}</span>
                          </div>

                          <div className={styles.infoRow}>
                            <span className={styles.label}>Especialista:</span>
                            <span className={styles.value}>{app.specialistName}</span>
                          </div>

                          <div className={styles.infoRow}>
                            <span className={styles.label}>{isSpecialist ? 'Tu Monto Neto:' : 'Valor Oficial:'}</span>
                            <span className={styles.priceValue}>
                              ${(isSpecialist 
                                  ? (app.commissionAmount !== undefined ? app.commissionAmount : (app.price * (activeSpecialistObj?.commissionRate || 45)) / 100) 
                                  : app.price
                                ).toLocaleString()} COP
                            </span>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          {app.status === 'Reservada' && (
                            <button
                              className={styles.attendBtn}
                              onClick={() => updateAppointmentStatus(app.id, 'En Atención')}
                            >
                              Iniciar Atención
                            </button>
                          )}

                          {app.status === 'En Atención' && (
                            <button
                              className={styles.finishBtn}
                              onClick={() => setSelectedAppointmentForSale(app)}
                            >
                              <CheckCircle size={14} />
                              <span>Cobrar & Marcar Pagada</span>
                            </button>
                          )}

                          {app.status !== 'Pagada' && app.status !== 'Cancelada' && (
                            <button
                              className={styles.cancelBtn}
                              onClick={() => updateAppointmentStatus(app.id, 'Cancelada')}
                              title="Cancelar cita"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          {(app.status === 'Pagada' || app.status === 'Cancelada') && (
                            <button
                              className={styles.reactivateBtn}
                              onClick={() => reactivateAppointment(app.id)}
                              title="Reactivar cita marcada por error"
                            >
                              <RotateCcw size={14} />
                              <span>Reactivar Cita</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })
        )}
      </div>

      {/* MANUAL BOOKING MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Agendar Nueva Cita</h3>
            
            <form onSubmit={handleAddSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre de la Clienta</label>
                <input
                  type="text"
                  placeholder="Ej. Ana María Suárez"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. 3001234567"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Servicio</label>
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar servicio...</option>
                  {servicesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Especialista</label>
                <select
                  value={specialistId}
                  onChange={e => setSpecialistId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar especialista...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha de la Cita</label>
                  <input
                    type="date"
                    value={addDate || selectedDate}
                    onChange={e => setAddDate(e.target.value)}
                    required
                  />
                </div>

                <TimePickerUniversal
                  label="Hora de la Cita"
                  value={time}
                  onChange={setTime}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCK TIME / PERMISSION MODAL */}
      {showBlockModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBlockModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitleBlock}>
              <h3>Bloquear Horario</h3>
              <p className={styles.modalSubtitle}>Registra almuerzos, descansos o permisos del personal</p>
            </div>
            
            <form onSubmit={handleBlockSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Especialista</label>
                <select
                  value={blockSpecialistId}
                  onChange={e => setBlockSpecialistId(e.target.value)}
                  required
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* QUICK CHIPS FOR REASON */}
              <div className={styles.formGroup}>
                <label>Motivo</label>
                <div className={styles.chipGrid}>
                  {[
                    { label: '🍱 Almuerzo', val: 'Almuerzo' },
                    { label: '☕ Descanso', val: 'Descanso' },
                    { label: '🏥 Cita Médica', val: 'Cita Médica' },
                    { label: '🏖️ Permiso', val: 'Permiso' },
                    { label: '🎓 Capacitación', val: 'Capacitación' },
                    { label: '✏️ Otro', val: 'Otro' }
                  ].map(item => (
                    <button
                      type="button"
                      key={item.val}
                      className={`${styles.chipBtn} ${blockReason === item.val ? styles.activeChip : ''}`}
                      onClick={() => setBlockReason(item.val)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {blockReason === 'Otro' && (
                <div className={styles.formGroup}>
                  <label>Escribe el Motivo Personalizado</label>
                  <input
                    type="text"
                    placeholder="Ej. Diligencia personal, Mantenimiento, etc."
                    value={customBlockReason}
                    onChange={e => setCustomBlockReason(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* UNIVERSAL TIME PICKER SECTION */}
              <div className={styles.formRow}>
                <TimePickerUniversal
                  label="Desde"
                  value={blockStartTime}
                  onChange={setBlockStartTime}
                />

                <TimePickerUniversal
                  label="Hasta"
                  value={blockEndTime}
                  onChange={setBlockEndTime}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Observaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Detalles adicionales o motivo especial..."
                  value={blockNotes}
                  onChange={e => setBlockNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setShowBlockModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.blockSubmitBtn}>
                  Confirmar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT APPOINTMENT MODAL */}
      {editingAppointment && (
        <div className={styles.modalOverlay} onClick={() => setEditingAppointment(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>✏️ Editar Cita</h3>
            
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre de la Clienta</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={e => setEditClientName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono WhatsApp</label>
                <input
                  type="text"
                  value={editClientPhone}
                  onChange={e => setEditClientPhone(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Servicio</label>
                <select
                  value={editServiceId}
                  onChange={e => setEditServiceId(e.target.value)}
                  required
                >
                  {servicesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Especialista</label>
                <select
                  value={editSpecialistId}
                  onChange={e => setEditSpecialistId(e.target.value)}
                  required
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    required
                  />
                </div>

                <TimePickerUniversal
                  label="Hora de la Cita"
                  value={editTime}
                  onChange={setEditTime}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Estado de la Cita</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="Reservada">Reservada</option>
                  <option value="En Atención">En Atención</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setEditingAppointment(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMPLIFIED EDIT BLOCKED SLOT MODAL */}
      {editingBlockSlot && (
        <div className={styles.modalOverlay} onClick={() => setEditingBlockSlot(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeaderBlock}>
              <span className={styles.syneBlockedHeaderTag}>BLOQUEO</span>
              <h3>Editar Horario Bloqueado</h3>
              <p className={styles.modalSubtitle}>Modifica el motivo, especialista o el rango de tiempo de este bloqueo.</p>
            </div>

            <form onSubmit={handleEditBlockSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Motivo del Bloqueo</label>
                <input
                  type="text"
                  placeholder="Ej. Cita Médica, Almuerzo, Diligencia..."
                  value={editBlockReason}
                  onChange={e => setEditBlockReason(e.target.value)}
                  required
                />
              </div>

              {/* QUICK CHIPS */}
              <div className={styles.chipGrid}>
                {['Almuerzo', 'Cita Médica', 'Capacitación', 'Diligencia Personal', 'Mantenimiento'].map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.chipBtn} ${editBlockReason === m ? styles.activeChip : ''}`}
                    onClick={() => setEditBlockReason(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className={styles.formGroup}>
                <label>Especialista Afectada</label>
                <select
                  value={editBlockSpecialistId}
                  onChange={e => setEditBlockSpecialistId(e.target.value)}
                  required
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* UNIVERSAL TIME PICKER RANGE */}
              <div className={styles.formRow}>
                <TimePickerUniversal
                  label="Desde"
                  value={editBlockStartTime}
                  onChange={setEditBlockStartTime}
                />

                <TimePickerUniversal
                  label="Hasta"
                  value={editBlockEndTime}
                  onChange={setEditBlockEndTime}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Fecha del Bloqueo</label>
                <input
                  type="date"
                  value={editBlockDate}
                  onChange={e => setEditBlockDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setEditingBlockSlot(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBlockBtn}>
                  Guardar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM SALE & CASH CALCULATOR MODAL */}
      {selectedAppointmentForSale && (
        <ConfirmSaleModal
          appointment={selectedAppointmentForSale}
          onClose={() => setSelectedAppointmentForSale(null)}
          onConfirm={handleConfirmSale}
        />
      )}

      {/* CUSTOM BIG GOLD CALENDAR MODAL */}
      {showCalendarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCalendarModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={styles.bigCalendarModalCard}
            onClick={e => e.stopPropagation()}
          >
            {/* CALENDAR HEADER */}
            <div className={styles.calNavHeader}>
              <button type="button" className={styles.calNavBtn} onClick={handlePrevMonth}>
                <ChevronLeft size={22} />
              </button>

              <div className={styles.calMonthYearTitle}>
                <h3>{months[viewMonth]} {viewYear}</h3>
              </div>

              <button type="button" className={styles.calNavBtn} onClick={handleNextMonth}>
                <ChevronRight size={22} />
              </button>
            </div>

            {/* WEEKDAY HEADERS */}
            <div className={styles.calWeekGrid}>
              {weekDays.map((wd, i) => (
                <div key={i} className={styles.calWeekDayHeader}>{wd}</div>
              ))}
            </div>

            {/* DAYS GRID */}
            <div className={styles.calDaysGrid}>
              {/* Empty padding cells for first day of week */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className={styles.calDayEmpty} />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const formattedM = String(viewMonth + 1).padStart(2, '0')
                const formattedD = String(dayNum).padStart(2, '0')
                const dateKey = `${viewYear}-${formattedM}-${formattedD}`
                const isSelected = selectedDate === dateKey
                const isToday = getLocalDateString() === dateKey

                // Count appointments on this day
                const dayApps = appointments.filter(a => a.date === dateKey)

                return (
                  <button
                    key={dayNum}
                    type="button"
                    className={`${styles.calDayCell} ${isSelected ? styles.calDaySelected : ''} ${isToday ? styles.calDayToday : ''}`}
                    onClick={() => handleSelectDay(dayNum)}
                  >
                    <span className={styles.calDayNumber}>{dayNum}</span>
                    {dayApps.length > 0 && (
                      <div className={styles.appDotContainer}>
                        {dayApps.slice(0, 3).map((a, i) => (
                          <span key={i} className={`${styles.appDot} ${a.status === 'Pagada' ? styles.dotGreen : styles.dotGold}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* FOOTER ACTIONS */}
            <div className={styles.calFooterActions}>
              <button
                type="button"
                className={styles.todayQuickBtn}
                onClick={() => {
                  const today = getLocalDateString()
                  setSelectedDate(today)
                  const tObj = new Date(today + 'T00:00:00')
                  setViewYear(tObj.getFullYear())
                  setViewMonth(tObj.getMonth())
                  setShowCalendarModal(false)
                }}
              >
                Ir a Hoy
              </button>

              <button
                type="button"
                className={styles.closeCalBtn}
                onClick={() => setShowCalendarModal(false)}
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
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
