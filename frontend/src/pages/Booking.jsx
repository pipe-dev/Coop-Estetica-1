import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import { serviceCategories } from '../data/services'
import { team } from '../data/team'
import styles from './Booking.module.css'

/* ⚠️ NOTA: "Catheryne Ríos Estética" es placeholder. Cambiar cuando se defina el nombre real. */

const steps = ['Servicio', 'Especialista', 'Fecha y Hora', 'Confirmación']

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
]

function Booking() {
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState({
    category: null,
    service: null,
    specialist: null,
    date: '',
    time: ''
  })

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
                    <Button variant="primary" size="lg" onClick={handleNext} className={!booking.service ? styles.disabled : ''}>
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
                    <Button variant="primary" size="lg" onClick={handleNext} className={!booking.specialist ? styles.disabled : ''}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className={styles.stepTitle}>Selecciona fecha y hora</h2>
                  <div className={styles.dateTimeGrid}>
                    <div className={styles.dateSection}>
                      <label className={styles.fieldLabel}>Fecha</label>
                      <input
                        type="date"
                        value={booking.date}
                        onChange={e => setBooking({ ...booking, date: e.target.value })}
                        className={styles.dateInput}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className={styles.timeSection}>
                      <label className={styles.fieldLabel}>Hora</label>
                      <div className={styles.timeGrid}>
                        {timeSlots.map(slot => (
                          <button
                            key={slot}
                            className={`${styles.timeSlot} ${booking.time === slot ? styles.timeSelected : ''}`}
                            onClick={() => setBooking({ ...booking, time: slot })}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.stepActions}>
                    <Button variant="outline" size="md" onClick={handleBack}>Atrás</Button>
                    <Button variant="primary" size="lg" onClick={handleNext} className={!(booking.date && booking.time) ? styles.disabled : ''}>
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
                  <div className={styles.stepActions}>
                    <Button variant="outline" size="md" onClick={handleBack}>Atrás</Button>
                    <Button variant="primary" size="lg" onClick={() => alert('✨ ¡Reserva confirmada! Te enviaremos un mensaje de confirmación.')}>
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
