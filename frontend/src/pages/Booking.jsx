import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Edit3,
  MessageSquare,
  Phone,
  User,
  Mail,
  Send,
  AlertTriangle,
  ShoppingBag,
  X,
  Trash2
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAdmin } from '../context/AdminContext'
import { serviceCategories } from '../data/services'
import { team } from '../data/team'
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils'
import { api } from '../services/api'
import styles from './Booking.module.css'

/* Nombre oficial: Catheryne Ríos Estética */
const steps = ['Categoría', 'Servicio', 'Especialista', 'Fecha y Hora']

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
]

function Booking() {
  const { 
    addAppointment, 
    serviceCategories: adminCategories, 
    teamMembers: adminTeam, 
    businessConfig,
    isDateClosed,
    closedDates 
  } = useAdmin()
  const currentCategories = adminCategories || serviceCategories
  const currentTeam = adminTeam || team
  
  const [activeStep, setActiveStep] = useState(0)
  const [booking, setBooking] = useState({
    category: null,
    service: null,
    specialist: null,
    date: '',
    time: ''
  })

  // Bolsa de Tratamientos (Multi-Servicio)
  const [selectedServices, setSelectedServices] = useState([])
  const [showBagModal, setShowBagModal] = useState(false)
  const [availableSlots, setAvailableSlots] = useState(timeSlots)
  const [suggestedSpecialist, setSuggestedSpecialist] = useState(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Duración e Inversión Total Acumulada
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      const d = typeof s.duration === 'string' ? parseInt(s.duration.replace(/\D/g, '')) : Number(s.duration)
      return sum + (isNaN(d) || !d ? 45 : d)
    }, 0)
  }, [selectedServices])

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
  }, [selectedServices])

  // Contact Info State
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const [confirmedData, setConfirmedData] = useState(null)

  // Full-size interactive calendar navigation state
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const todayZero = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const firstDayOfWeek = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
    return (firstDayIndex + 6) % 7 // Monday = 0
  }, [viewYear, viewMonth])

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate()
  }, [viewYear, viewMonth])

  const handlePrevCalMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(prev => prev - 1)
    } else {
      setViewMonth(prev => prev - 1)
    }
  }

  const handleNextCalMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(prev => prev + 1)
    } else {
      setViewMonth(prev => prev + 1)
    }
  }

  const handleTodayCal = () => {
    setViewMonth(now.getMonth())
    setViewYear(now.getFullYear())
  }

  // Selected entities resolution
  const selectedCategory = currentCategories.find(c => c.id === booking.category)
  const effectiveSpecialistId = booking.specialist === 'any' ? suggestedSpecialist : booking.specialist
  const selectedSpecialist = currentTeam.find(t => t.id === effectiveSpecialistId) || (booking.specialist === 'any' ? { id: 'any', name: 'Asignación Inteligente', role: 'Especialista de Turno' } : null)

  // Toggle Tratamiento en la Bolsa
  const toggleService = (srv, catName) => {
    setSelectedServices(prev => {
      const exists = prev.some(item => item.id === srv.id)
      if (exists) {
        return prev.filter(item => item.id !== srv.id)
      } else {
        return [...prev, { ...srv, categoryName: catName || selectedCategory?.name }]
      }
    })
  }

  const removeService = (srvId) => {
    setSelectedServices(prev => prev.filter(item => item.id !== srvId))
  }

  // Consulta de Disponibilidad de Bloque Continuo
  useEffect(() => {
    if (!booking.date) return

    let isMounted = true
    setIsLoadingSlots(true)

    const dur = totalDuration > 0 ? totalDuration : 60
    api.getAvailability(booking.date, dur, booking.specialist)
      .then(res => {
        if (!isMounted) return
        if (res?.availableSlots && res.availableSlots.length > 0) {
          setAvailableSlots(res.availableSlots)
        } else if (res?.availableSlots && res.availableSlots.length === 0) {
          setAvailableSlots([])
        } else {
          setAvailableSlots(timeSlots)
        }
        if (res?.suggestedSpecialistId) {
          setSuggestedSpecialist(res.suggestedSpecialistId)
        }
      })
      .catch(() => {
        if (isMounted) setAvailableSlots(timeSlots)
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false)
      })

    return () => { isMounted = false }
  }, [booking.date, booking.specialist, totalDuration])

  // 1-CLICK AUTO-ADVANCE HANDLERS
  const handleCategorySelect = (catId) => {
    setBooking(prev => ({
      ...prev,
      category: catId
    }))
    setActiveStep(1) // Auto-advance to Step 1 (Servicios)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  const handleSpecialistSelect = (specId) => {
    setBooking(prev => ({
      ...prev,
      specialist: specId
    }))
    setActiveStep(3) // Auto-advance to Step 3 (Fecha y Hora)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Handle Time select in Step 3
  const handleTimeSelect = (slot) => {
    setBooking(prev => ({
      ...prev,
      time: slot
    }))
  }

  // Confirm Reservation -> Sincronización con el Sistema Central
  const handleConfirmReservation = async () => {
    setBookingError('')

    if (selectedServices.length === 0 || !selectedSpecialist || !booking.date || !booking.time) {
      setBookingError('Por favor selecciona al menos un tratamiento, especialista, día y hora.')
      return
    }

    if (!clientName.trim() || !clientPhone.trim()) {
      setBookingError('Por favor escribe tu nombre y número de celular para poder apartarte el turno.')
      return
    }

    setIsSubmitting(true)

    const combinedServiceName = selectedServices.map(s => s.name).join(' + ')
    const assignedSpec = booking.specialist === 'any'
      ? (currentTeam.find(t => t.id === suggestedSpecialist) || currentTeam[0])
      : selectedSpecialist

    const payload = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      serviceIds: selectedServices.map(s => s.id),
      serviceId: selectedServices[0]?.id,
      serviceName: combinedServiceName,
      specialistId: assignedSpec?.id || 'spec-default',
      specialistName: assignedSpec?.name || 'Catheryne Ríos',
      date: booking.date,
      time: booking.time,
      price: totalPrice,
    }

    try {
      // 1. Registro directo en la Base de Datos
      const serverResult = await api.bookAppointment(payload)

      // 2. Guardar en el estado local si se confirmó la reserva
      addAppointment({
        id: serverResult?.id || `app-${Date.now()}`,
        ...payload,
        status: 'Reservada'
      })

      setConfirmedData({
        ...payload,
        id: serverResult?.id || `app-${Date.now()}`,
        categoryName: selectedServices[0]?.categoryName || selectedCategory?.name
      })

      setActiveStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      console.error('Error al agendar cita:', e)
      setBookingError(e.message || 'No pudimos confirmar tu cita por un problema de conexión. Por favor revisa tu internet o escríbenos por WhatsApp para apartarte el turno de inmediato.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetBooking = () => {
    setBooking({
      category: null,
      service: null,
      specialist: null,
      date: '',
      time: ''
    })
    setSelectedServices([])
    setClientName('')
    setClientPhone('')
    setClientEmail('')
    setConfirmedData(null)
    setActiveStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Animation variants
  const pageVariants = {
    enter: { opacity: 0, x: 25 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 }
  }

  return (
    <main className={styles.booking}>
      {/* HERO HEADER */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Reserva tu <span className={styles.accent}>Experiencia</span>
          </motion.h1>
        </div>
      </section>

      <section className={styles.bookingSection}>
        <div className="container">
          {/* INTERACTIVE PROGRESS STEPPER BAR (4 Pasos del Agendamiento) */}
          {!confirmedData && (
            <div className={styles.progress}>
              {steps.map((label, i) => {
                const isDone = activeStep > i
                const isActive = activeStep === i
                const isClickable = i < activeStep

                return (
                  <div 
                    key={i} 
                    className={`
                      ${styles.progressStep} 
                      ${isActive ? styles.progressActive : ''} 
                      ${isDone ? styles.progressDone : ''}
                      ${isClickable ? styles.progressClickable : ''}
                    `}
                    onClick={() => {
                      if (isClickable) setActiveStep(i)
                    }}
                  >
                    <div className={styles.progressCircle}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={styles.progressLabel}>{label}</span>
                    {i < steps.length - 1 && <div className={styles.progressLine} />}
                  </div>
                )
              })}
            </div>
          )}

          {/* SELECTION BREADCRUMBS BAR (Active when selections exist) */}
          {activeStep > 0 && activeStep < 4 && (
            <motion.div 
              className={styles.breadcrumbsBar}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.crumbItem} onClick={() => setActiveStep(0)}>
                <span className={styles.crumbLabel}>Categoría:</span>
                <span className={styles.crumbValue}>{selectedCategory?.name || '—'}</span>
                <Edit3 size={12} className={styles.crumbEditIcon} />
              </div>

              {selectedServices.length > 0 && (
                <>
                  <span className={styles.crumbDivider}>/</span>
                  <div className={styles.crumbItem} onClick={() => setActiveStep(1)}>
                    <span className={styles.crumbLabel}>Tratamientos ({selectedServices.length}):</span>
                    <span className={styles.crumbValue}>
                      {selectedServices.map(s => s.name).join(', ')}
                    </span>
                    <Edit3 size={12} className={styles.crumbEditIcon} />
                  </div>
                </>
              )}

              {booking.specialist && (
                <>
                  <span className={styles.crumbDivider}>/</span>
                  <div className={styles.crumbItem} onClick={() => setActiveStep(2)}>
                    <span className={styles.crumbLabel}>Especialista:</span>
                    <span className={styles.crumbValue}>{booking.specialist === 'any' ? 'Asignación Inteligente' : selectedSpecialist?.name || '—'}</span>
                    <Edit3 size={12} className={styles.crumbEditIcon} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* MAIN WIZARD CONTAINER WITH AUTO-ADVANCE */}
          <div className={styles.stepContainer}>
            <AnimatePresence mode="wait">
              {/* ─────────────────────────────────────────────────────────────────
                  PASO 0: CATEGORÍA (Click -> Pasa automáticamente a Servicios)
                 ───────────────────────────────────────────────────────────────── */}
              {activeStep === 0 && (
                <motion.div
                  key="step-category"
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className={styles.stepBlock}
                >
                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Elige tu categoría</h2>
                    <p className={styles.stepSubtitle}>Selecciona el área que deseas consentir hoy</p>
                  </div>

                  {currentCategories.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: 16,
                      maxWidth: 600,
                      margin: '20px auto'
                    }}>
                      <Sparkles size={32} style={{ color: '#D4AF37', marginBottom: 12 }} />
                      <h3 style={{ color: '#FEFEFE', fontFamily: 'var(--font-heading)', fontSize: 20, marginBottom: 8 }}>
                        Agenda Digital en Actualización
                      </h3>
                      <p style={{ color: '#A3A3A3', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                        Estamos configurando nuevos servicios y horarios de atención. Puedes reservar tu cita prioritaria directamente comunicándote a nuestra línea oficial de WhatsApp.
                      </p>
                      {businessConfig?.whatsappNumber && (
                        <a
                          href={`https://wa.me/57${businessConfig.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Me gustaría agendar una cita en ' + (businessConfig?.businessName || 'Catheryne Ríos Estética'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                            color: '#0D0D0D',
                            padding: '12px 24px',
                            borderRadius: 9999,
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: 'none'
                          }}
                        >
                          <MessageSquare size={16} />
                          <span>Contactar por WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className={styles.categoriesGrid}>
                      {currentCategories.map(cat => (
                        <div
                          key={cat.id}
                          className={`${styles.categoryCard} ${booking.category === cat.id ? styles.categorySelected : ''}`}
                          onClick={() => handleCategorySelect(cat.id)}
                        >
                          <img src={cat.image} alt={cat.name} className={styles.categoryImg} />
                          <div className={styles.categoryOverlay} />
                          <span className={styles.categoryName}>{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────────
                  PASO 1: SERVICIOS (Multi-Servicio «Bolsa de Tratamientos»)
                 ───────────────────────────────────────────────────────────────── */}
              {activeStep === 1 && (
                <motion.div
                  key="step-service"
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className={styles.stepBlock}
                >
                  <div className={styles.stepTopNav}>
                    <button 
                      type="button" 
                      className={styles.backBtn}
                      onClick={() => setActiveStep(0)}
                    >
                      <ArrowLeft size={16} /> Cambiar Categoría
                    </button>
                    <span className={styles.currentCategoryBadge}>
                      {selectedCategory?.name}
                    </span>
                  </div>

                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Selecciona tus tratamientos</h2>
                    <p className={styles.stepSubtitle}>Puedes elegir varios tratamientos para consentirte en una sola sesión</p>
                  </div>

                  <div className={styles.servicesList}>
                    {selectedCategory?.services.map(s => {
                      const isServiceSelected = selectedServices.some(item => item.id === s.id)
                      return (
                        <div
                          key={s.id}
                          className={`${styles.serviceOption} ${isServiceSelected ? styles.serviceSelected : ''}`}
                          onClick={() => toggleService(s, selectedCategory?.name)}
                        >
                          <div className={styles.serviceMainInfo}>
                            <div className={styles.serviceRadioCircle}>
                              {isServiceSelected && <span className={styles.radioDot} />}
                            </div>
                            <div>
                              <p className={styles.serviceOptName}>{s.name}</p>
                              <p className={styles.serviceOptDesc}>{s.description}</p>
                            </div>
                          </div>
                          <div className={styles.serviceOptMeta}>
                            <span className={styles.durationBadge}>
                              <Clock size={13} /> {s.duration}
                            </span>
                            <span className={styles.serviceOptPrice}>${s.price.toLocaleString()}</span>
                            <span style={{ fontSize: '0.75rem', color: isServiceSelected ? 'var(--color-gold)' : '#A3A3A3', fontWeight: 700 }}>
                              {isServiceSelected ? '✓ En la Bolsa' : '+ Agregar'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────────
                  PASO 2: ESPECIALISTAS (Específica o Asignación Inteligente)
                 ───────────────────────────────────────────────────────────────── */}
              {activeStep === 2 && (
                <motion.div
                  key="step-specialist"
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className={styles.stepBlock}
                >
                  <div className={styles.stepTopNav}>
                    <button 
                      type="button" 
                      className={styles.backBtn}
                      onClick={() => setActiveStep(1)}
                    >
                      <ArrowLeft size={16} /> Cambiar Tratamientos
                    </button>
                    <span className={styles.currentCategoryBadge}>
                      {selectedServices.length} Tratamiento{selectedServices.length > 1 ? 's' : ''} (${totalPrice.toLocaleString()})
                    </span>
                  </div>

                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Elige tu especialista</h2>
                    <p className={styles.stepSubtitle}>Toca a tu profesional de preferencia o elige asignación automática</p>
                  </div>

                  <div className={styles.specialistsGrid}>
                    {/* CUALQUIERA - ASIGNACIÓN INTELIGENTE */}
                    <div
                      className={`${styles.specialistCard} ${styles.specialistCardAny} ${booking.specialist === 'any' ? styles.specialistSelected : ''}`}
                      onClick={() => handleSpecialistSelect('any')}
                    >
                      <span className={styles.smartBadge}>Recomendado</span>
                      <div className={styles.specialistAvatarWrapper}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)', border: '1.5px solid var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)', fontSize: 24, margin: '0 auto' }}>
                          ✦
                        </div>
                        {booking.specialist === 'any' && <span className={styles.specialistCheckBadge}>✓</span>}
                      </div>
                      <h4 className={styles.specialistName}>Cualquiera</h4>
                      <p className={styles.specialistRole}>Asignación Inteligente</p>
                      <p className={styles.specialistExp}>Mayor disponibilidad y balance de citas</p>
                    </div>

                    {currentTeam.map(member => {
                      const isSelected = booking.specialist === member.id
                      return (
                        <div
                          key={member.id}
                          className={`${styles.specialistCard} ${isSelected ? styles.specialistSelected : ''}`}
                          onClick={() => handleSpecialistSelect(member.id)}
                        >
                          <div className={styles.specialistAvatarWrapper}>
                            <img src={member.avatar} alt={member.name} className={styles.specialistImg} />
                            {isSelected && <span className={styles.specialistCheckBadge}>✓</span>}
                          </div>
                          <h4 className={styles.specialistName}>{member.name}</h4>
                          <p className={styles.specialistRole}>{member.role}</p>
                          <p className={styles.specialistExp}>{member.experience}</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────────
                  PASO 3: FECHA Y HORA (Selección de fecha/hora y Confirmación)
                 ───────────────────────────────────────────────────────────────── */}
              {activeStep === 3 && (
                <motion.div
                  key="step-datetime"
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className={styles.stepBlock}
                >
                  <div className={styles.stepTopNav}>
                    <button 
                      type="button" 
                      className={styles.backBtn}
                      onClick={() => setActiveStep(2)}
                    >
                      <ArrowLeft size={16} /> Cambiar Especialista
                    </button>
                    <span className={styles.currentCategoryBadge}>
                      Con: {selectedSpecialist?.name}
                    </span>
                  </div>

                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Selecciona fecha y hora</h2>
                    <p className={styles.stepSubtitle}>Elige tu día y horario para agendar tu espacio</p>
                  </div>

                  <div className={styles.dateTimeGrid}>
                    {/* LEFT: FULL-SIZED LUXURY EMBEDDED CALENDAR */}
                    <div className={styles.calendarContainer}>
                      <div className={styles.calHeader}>
                        <div className={styles.calMonthYearGroup}>
                          <span className={styles.calMonthName}>{months[viewMonth]}</span>
                          <span className={styles.calYearName}>{viewYear}</span>
                        </div>

                        <div className={styles.calNavControls}>
                          <button
                            type="button"
                            className={styles.calTodayBtn}
                            onClick={() => {
                              const now = new Date()
                              setViewMonth(now.getMonth())
                              setViewYear(now.getFullYear())
                            }}
                          >
                            Hoy
                          </button>
                          <button
                            type="button"
                            className={styles.calNavBtn}
                            onClick={handlePrevCalMonth}
                            aria-label="Mes anterior"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            className={styles.calNavBtn}
                            onClick={handleNextCalMonth}
                            aria-label="Mes siguiente"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>

                      {/* WEEKDAYS HEADER */}
                      <div className={styles.calWeekdaysRow}>
                        {weekDays.map(wd => (
                          <div key={wd} className={styles.calWeekdayCell}>{wd}</div>
                        ))}
                      </div>

                      {/* DAYS GRID */}
                      <div className={styles.calDaysGrid}>
                        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                          <div key={`empty-${idx}`} className={styles.calDayEmpty} />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const dayNum = idx + 1
                          const formattedM = String(viewMonth + 1).padStart(2, '0')
                          const formattedD = String(dayNum).padStart(2, '0')
                          const dateKey = `${viewYear}-${formattedM}-${formattedD}`

                          const cellDate = new Date(viewYear, viewMonth, dayNum)
                          cellDate.setHours(0, 0, 0, 0)
                          const isPast = cellDate < todayZero
                          const closedInfo = isDateClosed ? isDateClosed(dateKey) : null
                          const isClosed = Boolean(closedInfo)
                          const isToday = cellDate.getTime() === todayZero.getTime()
                          const isSelected = booking.date === dateKey

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              disabled={isPast || isClosed}
                              title={isClosed ? `Cerrado: ${closedInfo.reason}` : undefined}
                              className={`
                                ${styles.calDayBtn}
                                ${isPast ? styles.calDayPast : ''}
                                ${isClosed ? styles.calDayClosed : ''}
                                ${isToday ? styles.calDayToday : ''}
                                ${isSelected ? styles.calDaySelected : ''}
                              `}
                              onClick={() => {
                                if (!isPast && !isClosed) {
                                  setBooking(prev => ({ ...prev, date: dateKey, time: '' }))
                                }
                              }}
                            >
                              <span className={styles.calDayNum}>{dayNum}</span>
                              {isToday && <span className={styles.calTodayDot} />}
                              {isClosed && <span className={styles.calClosedIndicator}>•</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* RIGHT: TIME SLOTS */}
                    <div className={styles.timeSection}>
                      <div className={styles.timeSectionHeader}>
                        <label className={styles.fieldLabel}>Horarios Disponibles</label>
                        {booking.date && (
                          <span className={styles.selectedDateBadge}>
                            {booking.date}
                          </span>
                        )}
                      </div>

                      {!booking.date ? (
                        <div className={styles.selectDatePrompt}>
                          <CalendarIcon size={32} className={styles.promptIcon} />
                          <p>Selecciona un día en el calendario para ver los horarios disponibles.</p>
                        </div>
                      ) : isDateClosed && isDateClosed(booking.date) ? (
                        <div className={styles.closedDatePrompt}>
                          <AlertTriangle size={32} className={styles.closedPromptIcon} />
                          <strong className={styles.closedPromptTitle}>Sede Cerrada en Esta Fecha</strong>
                          <p className={styles.closedPromptDesc}>{isDateClosed(booking.date)?.reason || 'Cierre programado'}</p>
                          <span className={styles.closedPromptSub}>Por favor selecciona otro día en el calendario para apartar tu cita.</span>
                        </div>
                      ) : isLoadingSlots ? (
                        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-gold)' }}>
                          <Clock size={28} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Calculando horarios continuos...</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(212,175,55,0.2)' }}>
                          <AlertTriangle size={28} style={{ color: '#F59E0B', margin: '0 auto 8px' }} />
                          <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: 4 }}>
                            Sin Horarios Continuos Libres
                          </strong>
                          <p style={{ color: '#A0A0A0', fontSize: '0.78rem', margin: 0 }}>
                            No encontramos un bloque continuo de {Math.floor(totalDuration / 60)}h {totalDuration % 60}m libre para esta fecha. Por favor elige otro día.
                          </p>
                        </div>
                      ) : (
                        <div className={styles.timeGrid}>
                          {availableSlots.map(slot => {
                            const isTimeSelected = booking.time === slot
                            return (
                              <button
                                key={slot}
                                type="button"
                                className={`${styles.timeSlot} ${isTimeSelected ? styles.timeSelected : ''}`}
                                onClick={() => handleTimeSelect(slot)}
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUMMARY & CONTACT INFO FORM (Active when Date + Time are chosen) */}
                  <AnimatePresence>
                    {booking.date && booking.time && (
                      <motion.div 
                        className={styles.readyConfirmBox}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <div className={styles.readySummaryRow}>
                          <div className={styles.readyDetail}>
                            <span className={styles.readyLabel}>Tratamientos ({selectedServices.length}):</span>
                            <span className={styles.readyValue}>
                              {selectedServices.map(s => s.name).join(' + ')}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)', marginTop: 4, display: 'block' }}>
                              Especialista: {booking.specialist === 'any' ? 'Asignación Inteligente' : selectedSpecialist?.name} • Fecha: {booking.date} • Hora: {booking.time} • Duración: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                            </span>
                          </div>
                          <div className={styles.readyPriceGroup}>
                            <span className={styles.readyPriceLabel}>Inversión Total</span>
                            <span className={styles.readyPrice}>${totalPrice.toLocaleString()} COP</span>
                          </div>
                        </div>

                        {/* CLIENT CONTACT INPUTS */}
                        <div className={styles.contactFormSection}>
                          <h4 className={styles.contactFormTitle}>Datos de Contacto para Confirmación</h4>
                          
                          <div className={styles.contactGrid}>
                            <div className={styles.contactInputGroup}>
                              <label>Nombre y Apellido</label>
                              <div className={styles.inputIconWrapper}>
                                <User size={16} />
                                <input
                                  type="text"
                                  placeholder="Tu nombre completo"
                                  value={clientName}
                                  onChange={e => setClientName(e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            <div className={styles.contactInputGroup}>
                              <label>Número de WhatsApp / Celular</label>
                              <div className={styles.inputIconWrapper}>
                                <Phone size={16} />
                                <input
                                  type="tel"
                                  placeholder="Ej. 300 123 4567"
                                  value={clientPhone}
                                  onChange={e => setClientPhone(e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            <div className={`${styles.contactInputGroup} ${styles.fullWidthInput}`}>
                              <label>Correo Electrónico (Opcional - Para recibir comprobante)</label>
                              <div className={styles.inputIconWrapper}>
                                <Mail size={16} />
                                <input
                                  type="email"
                                  placeholder="tu.correo@ejemplo.com"
                                  value={clientEmail}
                                  onChange={e => setClientEmail(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={styles.readyBtnWrapper}>
                          <Button
                            variant="dark"
                            size="lg"
                            pulse={true}
                            onClick={handleConfirmReservation}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Registrando Reserva...' : 'Confirmar y Agendar Cita'}
                          </Button>
                        </div>

                        {bookingError && (
                          <div className={styles.bookingErrorBanner}>
                            <p className={styles.bookingErrorText}>
                              {bookingError}
                            </p>
                            {(() => {
                              const cleanPhone = (businessConfig?.whatsappNumber || '').replace(/\D/g, '')
                              if (!cleanPhone) return null
                              const combinedNames = selectedServices.map(s => s.name).join(' + ')
                              const specName = booking.specialist === 'any' ? 'Asignación Inteligente' : selectedSpecialist?.name
                              const msg = `Hola Catheryne Ríos Estética, tuve una falla de internet al intentar agendar en la página web. ¿Me podrían ayudar a apartar mi cita manualmente por favor?\n\n• Tratamientos: ${combinedNames}\n• Especialista: ${specName}\n• Fecha deseada: ${booking.date}\n• Hora deseada: ${booking.time}\n• Inversión Total: $${totalPrice.toLocaleString()} COP\n• Mi Nombre: ${clientName || 'Cliente'}\n• Mi Celular: ${clientPhone || 'No especificado'}\n\nQuedo atenta a su confirmación.`
                              return (
                                <a 
                                  href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(msg)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.errorWhatsappBtn}
                                >
                                  <MessageSquare size={15} />
                                  <span>Agendar Directamente por WhatsApp</span>
                                </a>
                              )
                            })()}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────────
                  PASO 4: VOUCHER DE CONFIRMACIÓN EXITOSA
                 ───────────────────────────────────────────────────────────────── */}
              {activeStep === 4 && confirmedData && (
                <motion.div
                  key="step-success"
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className={styles.confirmationSuccessCard}
                >
                  <div className={styles.successIconBadge}>
                    <CheckCircle2 size={44} className={styles.successCheckIcon} />
                  </div>
                  <h2 className={styles.successTitle}>Reserva Confirmada con Éxito</h2>
                  <p className={styles.successSubtitle}>
                    Tu cita ha sido registrada en el sistema de <strong>Catheryne Ríos Estética</strong>.
                  </p>

                  {/* WHATSAPP INSTANT NOTIFICATION BANNER */}
                  {(() => {
                    const cleanPhone = (businessConfig?.whatsappNumber || '').replace(/\D/g, '')
                    if (!cleanPhone) return null
                    const whatsappMsg = `Hola Catheryne Ríos Estética, acabo de agendar mi cita en la web:\n\n• Tratamiento: ${confirmedData.serviceName}\n• Especialista: ${confirmedData.specialistName}\n• Fecha: ${confirmedData.date}\n• Hora: ${confirmedData.time}\n• Inversión: $${confirmedData.price.toLocaleString()} COP\n• Cliente: ${confirmedData.clientName}\n• Teléfono: ${confirmedData.clientPhone}\n\nQuedo atenta para confirmar los detalles.`
                    const whatsappLink = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`

                    return (
                      <div className={styles.whatsappActionCard}>
                        <div className={styles.whatsappActionText}>
                          <strong>Notificación Directa a Recepción</strong>
                          <p>Envía los detalles de tu cita a nuestro canal oficial de WhatsApp para asegurar tu turno de inmediato.</p>
                        </div>
                        <a 
                          href={whatsappLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={styles.whatsappDirectBtn}
                        >
                          <MessageSquare size={18} />
                          <span>Enviar Confirmación por WhatsApp</span>
                        </a>
                      </div>
                    )
                  })()}

                  <div className={styles.voucherCard}>
                    <div className={styles.voucherHeader}>
                      <span className={styles.voucherBrand}>CATHERYNE RÍOS ESTÉTICA</span>
                      <span className={styles.voucherStatusBadge}>CITA AGENDADA</span>
                    </div>

                    <div className={styles.voucherDetailsGrid}>
                      <div className={styles.voucherField}>
                        <span className={styles.voucherLabel}>Cliente</span>
                        <span className={styles.voucherValue}>{confirmedData.clientName}</span>
                      </div>
                      <div className={styles.voucherField}>
                        <span className={styles.voucherLabel}>Tratamiento</span>
                        <span className={styles.voucherValue}>{confirmedData.serviceName}</span>
                      </div>
                      <div className={styles.voucherField}>
                        <span className={styles.voucherLabel}>Especialista</span>
                        <span className={styles.voucherValue}>{confirmedData.specialistName}</span>
                      </div>
                      <div className={styles.voucherField}>
                        <span className={styles.voucherLabel}>Fecha y Hora</span>
                        <span className={styles.voucherValue}>{confirmedData.date} a las {confirmedData.time}</span>
                      </div>
                      <div className={`${styles.voucherField} ${styles.voucherTotalField}`}>
                        <span className={styles.voucherLabel}>Inversión Total</span>
                        <span className={styles.voucherPrice}>${confirmedData.price.toLocaleString()} COP</span>
                      </div>
                    </div>

                    {/* CALENDAR SYNC BUTTONS */}
                    <div className={styles.calendarButtonsBox}>
                      <span className={styles.calendarBoxTitle}>Agrega tu cita a tu agenda:</span>
                      <div className={styles.calendarBtnGroup}>
                        <a
                          href={generateGoogleCalendarUrl({
                            title: `Cita: ${confirmedData.serviceName}`,
                            description: `Tratamiento: ${confirmedData.serviceName}\nEspecialista: ${confirmedData.specialistName}\nLugar: Catheryne Ríos Estética`,
                            date: confirmedData.date,
                            time: confirmedData.time
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.googleCalBtn}
                        >
                          Google Calendar
                        </a>
                        <button
                          type="button"
                          className={styles.iCalBtn}
                          onClick={() => downloadIcsFile({
                            title: `Cita: ${confirmedData.serviceName}`,
                            description: `Tratamiento: ${confirmedData.serviceName}\nEspecialista: ${confirmedData.specialistName}\nLugar: Catheryne Ríos Estética`,
                            date: confirmedData.date,
                            time: confirmedData.time,
                            filename: `cita-${confirmedData.date}.ics`
                          })}
                        >
                          Apple / Outlook (.ics)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.successActions}>
                    <button 
                      type="button" 
                      className={styles.resetBookingBtn} 
                      onClick={handleResetBooking}
                    >
                      <RotateCcw size={16} /> Agendar Otra Cita
                    </button>
                    <Link to="/" className={styles.homeReturnBtn}>
                      Volver al Inicio <ArrowRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* BARRA FLOTANTE DORADA INFERIOR (STICKY LUXURY CART BAR) */}
        {selectedServices.length > 0 && activeStep <= 1 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.floatingCartBar}
          >
            <div className={styles.cartBarInfo}>
              <span className={styles.cartBadge}>
                ✦ {selectedServices.length} Tratamiento{selectedServices.length > 1 ? 's' : ''}
              </span>
              <span className={styles.cartDuration}>
                ⏳ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </span>
              <span className={styles.cartTotal}>
                ${totalPrice.toLocaleString()} COP
              </span>
            </div>

            <div className={styles.cartActions}>
              <button
                type="button"
                className={styles.cartBagBtn}
                onClick={() => setShowBagModal(true)}
              >
                <ShoppingBag size={15} />
                <span>Ver Bolsa</span>
              </button>

              <button
                type="button"
                className={styles.cartContinueBtn}
                onClick={() => {
                  setActiveStep(2)
                  window.scrollTo({ top: 120, behavior: 'smooth' })
                }}
              >
                <span>Elegir Especialista</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* MODAL DE BOLSA DE TRATAMIENTOS */}
        {showBagModal && (
          <div className={styles.bagModalOverlay} onClick={() => setShowBagModal(false)}>
            <div className={styles.bagModalCard} onClick={e => e.stopPropagation()}>
              <div className={styles.bagModalHeader}>
                <h3 className={styles.bagModalTitle}>Bolsa de Tratamientos</h3>
                <button
                  type="button"
                  className={styles.bagCloseBtn}
                  onClick={() => setShowBagModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.bagItemList}>
                {selectedServices.map(item => (
                  <div key={item.id} className={styles.bagItem}>
                    <div className={styles.bagItemDetails}>
                      <span className={styles.bagItemName}>{item.name}</span>
                      <span className={styles.bagItemSub}>{item.duration} • {item.categoryName || 'Tratamiento'}</span>
                    </div>
                    <div className={styles.bagItemRight}>
                      <span className={styles.bagItemPrice}>${item.price.toLocaleString()}</span>
                      <button
                        type="button"
                        className={styles.bagRemoveBtn}
                        onClick={() => removeService(item.id)}
                        title="Quitar de la bolsa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.bagSummaryRow}>
                <div>
                  <span className={styles.bagTotalLabel}>Duración estimada: </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.85rem' }}>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</strong>
                </div>
                <div>
                  <span className={styles.bagTotalLabel}>Inversión Total: </span>
                  <span className={styles.bagTotalVal}>${totalPrice.toLocaleString()} COP</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className={styles.cartBagBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowBagModal(false)}
                >
                  Seguir Agregando
                </button>
                <button
                  type="button"
                  className={styles.cartContinueBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setShowBagModal(false)
                    setActiveStep(2)
                    window.scrollTo({ top: 120, behavior: 'smooth' })
                  }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default Booking
