import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionTitle from '../components/ui/SectionTitle'
import Button from '../components/ui/Button'
import { CylinderCarousel } from '../components/ui/CylinderCarousel'
import { team } from '../data/team'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaTiktok } from 'react-icons/fa6'
import styles from './About.module.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

const baseImages = [
  { id: 1, src: '/images/service_nails.png', category: 'unas', alt: 'Diseño de uñas premium' },
  { id: 2, src: '/images/service_hair.png', category: 'cabello', alt: 'Estilismo capilar' },
  { id: 3, src: '/images/service_facial.png', category: 'rostro', alt: 'Tratamiento facial' },
  { id: 4, src: '/images/service_makeup.png', category: 'maquillaje', alt: 'Maquillaje profesional' },
  { id: 5, src: '/images/service_body.png', category: 'cuerpo', alt: 'Tratamiento corporal' },
  { id: 6, src: '/images/hero_spa_interior.png', category: 'spa', alt: 'Interior del spa' },
]

// Duplicate images to create a fuller cylinder (12 images)
const galleryImages = [...baseImages, ...baseImages.map(img => ({ ...img, id: img.id + 6 }))]

function About() {
  const [selectedMember, setSelectedMember] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  // Contact form state & handlers
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Close lightbox on scroll
  useEffect(() => {
    if (!lightbox) return;

    const handleScroll = () => {
      setLightbox(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, once: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lightbox]);

  return (
    <main className={styles.about}>


      {/* TEAM SECTION */}
      <section className={styles.teamSection}>
        <div className="container">
          <SectionTitle
            subtitle="Nuestro Equipo"
            title="Expertos a tu disposición"
            description="Conoce a los profesionales encargados de resaltar tu belleza."
          />
          <motion.div
            className={styles.teamGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {team.map((member, i) => (
              <motion.div
                key={member.id}
                className={styles.memberCard}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedMember(member)}
              >
                <div className={styles.memberImageWrapper}>
                  <img src={member.avatar} alt={member.name} className={styles.memberImage} />
                  <div className={styles.memberOverlay}>
                    <span className={styles.viewMore}>Ver perfil</span>
                  </div>
                </div>
                <div className={styles.memberInfo}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <p className={styles.memberRole}>{member.role}</p>
                  <p className={styles.memberExp}>{member.experience} de experiencia</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className={styles.gallerySection}>
        <div className="container">
          <SectionTitle
            subtitle="Nuestros Trabajos"
            title="Galería e Instalaciones"
            description="Un vistazo a los resultados que ofrecemos y el espacio donde creamos magia."
            light
          />
        </div>
        
        {/* Full-width Carousel wrapper outside container */}
        <div className={styles.carouselWrapper}>
          <CylinderCarousel images={galleryImages} cardWidth={320} animationDuration={40} onImageClick={setLightbox} />
        </div>
      </section>

      {/* CONTACT SECTION (Moved from Contact page) */}
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
                    <p>Av. Elegancia #1234, Col. Premium<br />Ciudad, CP 00000</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>📞</span>
                  <div>
                    <h4>Teléfono</h4>
                    <p>+52 (55) 1234-5678</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}><FaWhatsapp /></span>
                  <div>
                    <h4>WhatsApp</h4>
                    <p>+52 (55) 1234-5678</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>✉️</span>
                  <div>
                    <h4>Email</h4>
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
                <a href="#" className={styles.socialLink} aria-label="Instagram"><FaInstagram style={{marginRight: '6px'}} /> Instagram</a>
                <a href="#" className={styles.socialLink} aria-label="Facebook"><FaFacebookF style={{marginRight: '6px'}} /> Facebook</a>
                <a href="#" className={styles.socialLink} aria-label="TikTok"><FaTiktok style={{marginRight: '6px'}} /> TikTok</a>
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

      {/* Modals Container */}
      <AnimatePresence>
        {/* Team Modal */}
        {selectedMember && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => setSelectedMember(null)}>✕</button>
              <div className={styles.modalContent}>
                <img src={selectedMember.avatar} alt={selectedMember.name} className={styles.modalImage} />
                <div className={styles.modalDetails}>
                  <h2>{selectedMember.name}</h2>
                  <p className={styles.modalRole}>{selectedMember.role}</p>
                  <div className={styles.modalDivider} />
                  <p className={styles.modalBio}>{selectedMember.bio}</p>
                  
                  <div className={styles.modalStats}>
                    <div className={styles.modalStat}>
                      <span>Experiencia</span>
                      <strong>{selectedMember.experience}</strong>
                    </div>
                    <div className={styles.modalStat}>
                      <span>Especialidad</span>
                      <strong>{selectedMember.specialty}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lightbox Modal (Podium) */}
        {lightbox && (
          <motion.div
            className={styles.lightboxBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <div className={styles.lightboxImageWrapper}>
              <motion.img 
                layoutId={`carousel-image-${lightbox.id}`}
                src={lightbox.src} 
                alt={lightbox.alt} 
                className={styles.lightboxImage}
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className={styles.lightboxCloseInside} 
                onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default About
