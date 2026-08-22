import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAdmin } from '../context/AdminContext'
import { serviceCategories } from '../data/services'
import { team } from '../data/team'
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils'
import styles from './Booking.module.css'

/* ⚠️ NOTA: "Catheryne Ríos Estética" es placeholder. Cambiar cuando se defina el nombre real. */

const steps = ['Servicio', 'Especialista', 'Fecha y Hora', 'Confirmación']

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
  const { addAppointment } = useAdmin()
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState({
    category: null,
    service: null,
    specialist: null,
    date: '',
    time: ''
  })

  // Full-size interactive calendar navigation state
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const handlePrevCalMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const handleNextCalMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const todayZero = new Date()
  todayZero.setHours(0, 0, 0, 0)

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
  const firstDayOfWeek = (firstDayIndex + 6) % 7 // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const handleNext = () => setStep(s => Math.min(s + 1, 3))
  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 }
  }

  const selectedCategory = serviceCategories.find(c => c.id === booking.category)
  const selectedService = selectedCategory?.services.find(s => s.id === booking.service)
  const selectedSpecialist = team.find(t => t.id === booking.specialist)

  return (
    <main className={styles.booking}>
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
          {/* Progress */}
          <div className={styles.progress}>
            {steps.map((label, i) => (
              <div key={i} className={`${styles.progressStep} ${i <= step ? styles.progressActive : ''} ${i < step ? styles.progressDone : ''}`}>
                <div className={styles.progressCircle}>{i < step ? '✓' : i + 1}</div>
                <span className={styles.progressLabel}>{label}</span>
                {i < steps.length - 1 && <div className={styles.progressLine} />}
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className={styles.stepContainer}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className={styles.stepTitle}>Elige tu servicio</h2>
                  <div className={styles.categoriesGrid}>
                    {serviceCategories.map(cat => (
                      <div
                        key={cat.id}
                        className={`${styles.categoryCard} ${booking.category === cat.id ? styles.categorySelected : ''}`}
                        onClick={() => setBooking({ ...booking, category: cat.id, service: null })}
                      >
                        <img src={cat.image} alt={cat.name} className={styles.categoryImg} />
                        <div className={styles.categoryOverlay} />
                        <span className={styles.categoryName}>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                  {booking.category && (
                    <motion.div className={styles.servicesList} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <h3 className={styles.subTitle}>Selecciona el tratamiento</h3>
                      {selectedCategory.services.map(s => (
                        <div
                          key={s.id}
                          className={`${styles.serviceOption} ${booking.service === s.id ? styles.serviceSelected : ''}`}
                          onClick={() => setBooking({ ...booking, service: s.id })}
                        >
                          <div>
                            <p className={styles.serviceOptName}>{s.name}</p>
                            <p className={styles.serviceOptDesc}>{s.description}</p>
                          </div>
                          <div className={styles.serviceOptMeta}>
                            <span>{s.duration}</span>
                            <span className={styles.serviceOptPrice}>${s.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                  <div className={styles.stepActions}>
                    <Button variant="dark" size="lg" onClick={handleNext} className={!booking.service ? styles.disabled : ''}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className={styles.stepTitle}>Elige tu especialista</h2>
                  <div className={styles.specialistsGrid}>
                    {team.map(member => (
                      <div
                        key={member.id}
                        className={`${styles.specialistCard} ${booking.specialist === member.id ? styles.specialistSelected : ''}`}
                        onClick={() => setBooking({ ...booking, specialist: member.id })}
                      >
                        <img src={member.avatar} alt={member.name} className={styles.specialistImg} />
                        <h4 className={styles.specialistName}>{member.name}</h4>
                        <p className={styles.specialistRole}>{member.role}</p>
                        <p className={styles.specialistExp}>{member.experience}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.stepActions}>
                    <Button variant="outline" size="md" onClick={handleBack}>Atrás</Button>
                    <Button variant="dark" size="lg" onClick={handleNext} className={!booking.specialist ? styles.disabled : ''}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className={styles.stepTitle}>Selecciona fecha y hora</h2>
                  
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
                        {/* Empty padding cells for start of month */}
                        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                          <div key={`empty-${idx}`} className={styles.calDayEmpty} />
                        ))}

                        {/* Month Days */}
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const dayNum = idx + 1
                          const formattedM = String(viewMonth + 1).padStart(2, '0')
                          const formattedD = String(dayNum).padStart(2, '0')
                          const dateKey = `${viewYear}-${formattedM}-${formattedD}`

                          const cellDate = new Date(viewYear, viewMonth, dayNum)
                          cellDate.setHours(0, 0, 0, 0)
                          const isPast = cellDate < todayZero
                          const isToday = cellDate.getTime() === todayZero.getTime()
                          const isSelected = booking.date === dateKey

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              disabled={isPast}
                              className={`
                                ${styles.calDayBtn}
                                ${isPast ? styles.calDayPast : ''}
                                ${isToday ? styles.calDayToday : ''}
                                ${isSelected ? styles.calDaySelected : ''}
                              `}
                              onClick={() => {
                                if (!isPast) {
                                  setBooking({ ...booking, date: dateKey })
                                }
                              }}
                            >
                              <span className={styles.calDayNum}>{dayNum}</span>
                              {isToday && <span className={styles.calTodayDot} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* RIGHT: TIME SLOTS & SELECTION FEEDBACK */}
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
                          <CalendarIcon size={28} className={styles.promptIcon} />
                          <p>Por favor selecciona un día en el calendario para ver los horarios disponibles.</p>
                        </div>
                      ) : (
                        <div className={styles.timeGrid}>
                          {timeSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              className={`${styles.timeSlot} ${booking.time === slot ? styles.timeSelected : ''}`}
                              onClick={() => setBooking({ ...booking, time: slot })}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.stepActions}>
                    <Button variant="outline" size="md" onClick={handleBack}>Atrás</Button>
                    <Button variant="dark" size="lg" onClick={handleNext} className={!(booking.date && booking.time) ? styles.disabled : ''}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className={styles.stepTitle}>Confirma tu reserva</h2>
                  <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Servicio</span>
                      <span className={styles.summaryValue}>{selectedService?.name || '—'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Categoría</span>
                      <span className={styles.summaryValue}>{selectedCategory?.name || '—'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Especialista</span>
                      <span className={styles.summaryValue}>{selectedSpecialist?.name || '—'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Fecha</span>
                      <span className={styles.summaryValue}>{booking.date || '—'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Hora</span>
                      <span className={styles.summaryValue}>{booking.time || '—'}</span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
                      <span className={styles.summaryLabel}>Total</span>
                      <span className={styles.summaryPrice}>${selectedService?.price.toLocaleString() || '—'}</span>
                    </div>
                  </div>

                  {/* CALENDAR INTEGRATION BUTTONS */}
                  {booking.date && booking.time && (
                    <div className={styles.calendarButtonsBox}>
                      <span className={styles.calendarBoxTitle}>📅 Agrega tu cita a tu agenda:</span>
                      <div className={styles.calendarBtnGroup}>
                        <a
                          href={generateGoogleCalendarUrl({
                            title: `Cita: ${selectedService?.name || 'Estética'}`,
                            description: `Tratamiento: ${selectedService?.name}\nEspecialista: ${selectedSpecialist?.name}\nLugar: Catheryne Ríos Estética`,
                            startDate: `${booking.date}T${booking.time}:00`
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
                            title: `Cita: ${selectedService?.name || 'Estética'}`,
                            description: `Tratamiento: ${selectedService?.name}\nEspecialista: ${selectedSpecialist?.name}\nLugar: Catheryne Ríos Estética`,
                            startDate: `${booking.date}T${booking.time}:00`,
                            filename: `cita-${booking.date}.ics`
                          })}
                        >
                          Apple / Outlook (.ics)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.stepActions}>
                    <Button variant="outline" size="md" onClick={handleBack}>Atrás</Button>
                    <Button
                      variant="dark"
                      size="lg"
                      onClick={() => {
                        if (!selectedService || !selectedSpecialist || !booking.date || !booking.time) {
                          alert('Por favor completa todos los pasos para confirmar tu reserva.')
                          return
                        }

                        addAppointment({
                          id: `app-web-${Date.now()}`,
                          clientName: 'Reserva Web Online',
                          clientPhone: 'WhatsApp Web',
                          serviceId: selectedService.id,
                          serviceName: selectedService.name,
                          specialistId: selectedSpecialist.id,
                          specialistName: selectedSpecialist.name,
                          date: booking.date,
                          time: booking.time,
                          price: selectedService.price || 150000,
                          status: 'Reservada'
                        })

                        alert('✨ ¡Reserva confirmada con éxito! Ha sido agregada a la agenda.')
                      }}
                    >
                      ✨ Confirmar Reserva
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Booking
