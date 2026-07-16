import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import SectionTitle from '../components/ui/SectionTitle'
import styles from './Contact.module.css'

/* ⚠️ NOTA: "Catheryne Ríos Estética" es placeholder. Cambiar cuando se defina el nombre real. */

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1 }
  })
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <main className={styles.contact}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className={styles.accent}>Contáctanos</span>
          </motion.h1>
          <motion.p className={styles.heroDesc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Estamos aquí para atenderte y resolver todas tus dudas
          </motion.p>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className="container">
          <div className={styles.contactGrid}>
            {/* Info */}
            <motion.div
              className={styles.infoCol}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div variants={fadeInUp}>
                <SectionTitle subtitle="Visítanos" title="Información de Contacto" align="left" />
              </motion.div>

              <motion.div className={styles.infoCards} variants={fadeInUp}>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>📍</span>
                  <div>
                    <h4>Ubicación</h4>
                    {/* ⚠️ Cambiar dirección real */}
                    <p>Av. Elegancia #1234, Col. Premium<br />Ciudad, CP 00000</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>📞</span>
                  <div>
                    <h4>Teléfono</h4>
                    {/* ⚠️ Cambiar teléfono real */}
                    <p>+52 (55) 1234-5678</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>💬</span>
                  <div>
                    <h4>WhatsApp</h4>
                    {/* ⚠️ Cambiar WhatsApp real */}
                    <p>+52 (55) 1234-5678</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>✉️</span>
                  <div>
                    <h4>Email</h4>
                    {/* ⚠️ Cambiar email real */}
                    <p>reservas@catheryneriosestetica.com</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>🕐</span>
                  <div>
                    <h4>Horario</h4>
                    <p>Lun - Sáb: 9:00 AM - 7:00 PM<br />Domingo: Cerrado</p>
                  </div>
                </div>
              </motion.div>

              <motion.div className={styles.socialLinks} variants={fadeInUp}>
                <a href="#" className={styles.socialLink} aria-label="Instagram">📸 Instagram</a>
                <a href="#" className={styles.socialLink} aria-label="Facebook">👤 Facebook</a>
                <a href="#" className={styles.socialLink} aria-label="TikTok">🎵 TikTok</a>
              </motion.div>
            </motion.div>

            {/* Form */}
            <motion.div
              className={styles.formCol}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.formCard}>
                <h3 className={styles.formTitle}>Envíanos un mensaje</h3>
                {sent ? (
                  <motion.div className={styles.successMsg} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <span className={styles.successIcon}>✨</span>
                    <p>¡Mensaje enviado! Te contactaremos pronto.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                      <div className={styles.field}>
                        <label>Nombre completo</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Tu nombre" />
                      </div>
                      <div className={styles.field}>
                        <label>Teléfono</label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Tu teléfono" />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>Email</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="tu@email.com" />
                    </div>
                    <div className={styles.field}>
                      <label>Servicio de interés</label>
                      <select name="service" value={form.service} onChange={handleChange}>
                        <option value="">Seleccionar...</option>
                        <option value="unas">Manos & Uñas</option>
                        <option value="pies">Pies</option>
                        <option value="cabello">Cabello</option>
                        <option value="rostro">Rostro</option>
                        <option value="maquillaje">Maquillaje</option>
                        <option value="cuerpo">Cuerpo</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>Mensaje</label>
                      <textarea name="message" value={form.message} onChange={handleChange} rows="4" placeholder="Cuéntanos cómo podemos ayudarte..." />
                    </div>
                    <Button variant="primary" size="lg">Enviar Mensaje</Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact
