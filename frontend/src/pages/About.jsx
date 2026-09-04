import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Phone, Mail, Clock, ExternalLink, Copy, Check, Navigation } from 'lucide-react'
import SectionTitle from '../components/ui/SectionTitle'
import Button from '../components/ui/Button'
import { CylinderCarousel } from '../components/ui/CylinderCarousel'
import GiftCardCustomizer from '../components/ui/GiftCardCustomizer'
import { useAdmin } from '../context/AdminContext'
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

const getSpaStatus = () => {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  if (day === 0) return { isOpen: false, text: 'Cerrado los Domingos' }
  if (hour >= 9 && hour < 19) return { isOpen: true, text: 'Abierto ahora (hasta 7:00 PM)' }
  return { isOpen: false, text: 'Cerrado ahora (Abre 9:00 AM)' }
}

const baseImages = [
  { id: 1, src: '/images/service_nails.png', category: 'unas', alt: 'Diseño de uñas premium', title: 'DISEÑO DE UÑAS', subtitle: 'Manicura & Pedicura de Lujo', cta: 'AGENDAR UÑAS' },
  { id: 2, src: '/images/service_hair.png', category: 'cabello', alt: 'Estilismo capilar', title: 'ESTILISMO CAPILAR', subtitle: 'Cortes, Color & Tratamientos', cta: 'AGENDAR CABELLO' },
  { id: 3, src: '/images/service_facial.png', category: 'rostro', alt: 'Tratamiento facial', title: 'TRATAMIENTOS FACIALES', subtitle: 'Rejuvenecimiento & Cuidado Facial', cta: 'AGENDAR FACIAL' },
  { id: 4, src: '/images/service_makeup.png', category: 'maquillaje', alt: 'Maquillaje profesional', title: 'MAQUILLAJE PROFESIONAL', subtitle: 'Maquillaje Social & Eventos', cta: 'AGENDAR MAQUILLAJE' },
  { id: 5, src: '/images/service_body.png', category: 'cuerpo', alt: 'Tratamiento corporal', title: 'TRATAMIENTOS CORPORALES', subtitle: 'Masajes & Terapias Corporales', cta: 'AGENDAR CORPORAL' },
  { id: 6, src: '/images/hero_spa_interior.png', category: 'spa', alt: 'Interior del spa', title: 'EXPERIENCIA SPA', subtitle: 'Sanctuary & Relajación Total', cta: 'AGENDAR EXPERIENCIA' },
]

// Duplicate images to create a fuller cylinder (12 images)
const galleryImages = [...baseImages, ...baseImages.map(img => ({ ...img, id: img.id + 6 }))]

function About() {
  const { teamMembers, businessConfig } = useAdmin()
  const currentTeam = teamMembers && teamMembers.length > 0 ? teamMembers : team

  const [selectedMember, setSelectedMember] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  const spaStatus = getSpaStatus()

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

  // Hide Navbar when lightbox or member modal is open
  useEffect(() => {
    if (lightbox || selectedMember) {
      window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: true } }))
    } else {
      window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
    }

    return () => {
      window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
    }
  }, [lightbox, selectedMember]);

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
          {currentTeam.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 16,
              maxWidth: 550,
              margin: '0 auto'
            }}>
              <p style={{ color: '#A3A3A3', fontSize: 14, lineHeight: 1.6 }}>
                En {businessConfig?.businessName || 'Catheryne Ríos Estética'} contamos con un equipo altamente calificado y en constante actualización para brindarte la mejor experiencia de cuidado y bienestar.
              </p>
            </div>
          ) : (
            <motion.div
              className={styles.teamGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              {currentTeam.map((member, i) => (
                <motion.div
                  key={member.id}
                  className={styles.memberCard}
                  variants={fadeInUp}
                  custom={i}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className={styles.memberImageWrapper}>
                    <img src={member.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'} alt={member.name} className={styles.memberImage} />
                    <div className={styles.memberOverlay}>
                      <span className={styles.viewMore}>Ver perfil</span>
                    </div>
                  </div>
                  <div className={styles.memberInfo}>
                    <h3 className={styles.memberName}>{member.name}</h3>
                    <p className={styles.memberRole}>{member.role}</p>
                    <p className={styles.memberExp}>{member.experience || 'Especialista'} de experiencia</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
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

      {/* GIFT CARD CUSTOMIZER MODULE SECTION */}
      <section className={styles.giftCardModuleSection}>
        <div className="container">
          <GiftCardCustomizer showTitle={true} />
        </div>
      </section>

      {/* INTERACTIVE CONTACT SECTION */}
      <section className={styles.contactSection}>
        <div className="container">
          <motion.div
            className={styles.infoColCentered}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeInUp} className={styles.contactHeader}>
              <SectionTitle subtitle="Visítanos" title="Información de Contacto" align="center" />
              
              {/* Dynamic Status Pill */}
              <div className={`${styles.statusBadge} ${spaStatus.isOpen ? styles.statusOpen : styles.statusClosed}`}>
                <span className={styles.statusDot} />
                <span>{spaStatus.text}</span>
              </div>
            </motion.div>

            <motion.div className={styles.interactiveGrid} variants={fadeInUp}>
              {/* 1. UBICACIÓN */}
              <div className={styles.interactiveCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconCircle}><MapPin size={20} /></div>
                  <span className={styles.cardBadge}>Nuestra Sede</span>
                </div>
                <h3 className={styles.cardTitle}>Ubicación</h3>
                <p className={styles.cardDesc}>{businessConfig?.address || 'Calle 123 #45-67, Barrio El Prado'}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(businessConfig?.address || 'Catheryne Rios Estetica')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionBtnPrimary}
                >
                  <Navigation size={14} />
                  <span>Cómo Llegar (Maps)</span>
                </a>
              </div>

              {/* 2. TELÉFONO Y WHATSAPP */}
              <div className={styles.interactiveCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconCircle}><Phone size={20} /></div>
                  <span className={styles.cardBadge}>Atención Inmediata</span>
                </div>
                <h3 className={styles.cardTitle}>Teléfono & WhatsApp</h3>
                <p className={styles.cardDesc}>+57 {businessConfig?.phone || '300 626 9056'}</p>
                <div className={styles.btnGroup}>
                  <a href={`tel:${businessConfig?.phone || '3006269056'}`} className={styles.actionBtnSecondary}>
                    <Phone size={14} />
                    <span>Llamar</span>
                  </a>
                  <a
                    href={`https://wa.me/57${businessConfig?.whatsappNumber || '3006269056'}?text=${encodeURIComponent('Hola! Me gustaría solicitar información o reservar una cita en ' + (businessConfig?.businessName || 'Catheryne Ríos Estética'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionBtnGold}
                  >
                    <FaWhatsapp size={15} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* 3. HORARIO Y AGENDAMIENTO */}
              <div className={styles.interactiveCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconCircle}><Clock size={20} /></div>
                  <span className={styles.cardBadge}>Horarios</span>
                </div>
                <h3 className={styles.cardTitle}>Horario de Atención</h3>
                <p className={styles.cardDesc}>{businessConfig?.openingHours || 'Lun - Sáb: 8:00 AM - 7:00 PM'}</p>
                <Link to="/servicios" className={styles.actionBtnPrimary}>
                  <Calendar size={14} />
                  <span>Agendar solo con cita</span>
                </Link>
              </div>
            </motion.div>

            {/* SOCIAL MEDIA HUB */}
            <div className={styles.socialHub}>
              <span className={styles.socialHubTitle}>Síguenos en Redes Sociales</span>
              <div className={styles.socialButtonsGroup}>
                <a href={businessConfig?.instagramUrl || 'https://instagram.com'} target="_blank" rel="noopener noreferrer" className={`${styles.socialPill} ${styles.igPill}`} aria-label="Instagram">
                  <FaInstagram size={16} />
                  <span>Instagram</span>
                </a>
                <a href={businessConfig?.facebookUrl || 'https://facebook.com'} target="_blank" rel="noopener noreferrer" className={`${styles.socialPill} ${styles.fbPill}`} aria-label="Facebook">
                  <FaFacebookF size={15} />
                  <span>Facebook</span>
                </a>
                <a href={businessConfig?.tiktokUrl || 'https://tiktok.com'} target="_blank" rel="noopener noreferrer" className={`${styles.socialPill} ${styles.ttPill}`} aria-label="TikTok">
                  <FaTiktok size={15} />
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </motion.div>
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

              <div className={styles.lightboxOverlayContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.lightboxTitle}>{lightbox.title || 'SERVICIO EXCLUSIVO'}</h3>
                <p className={styles.lightboxSubtitle}>{lightbox.subtitle || lightbox.alt}</p>

                <a 
                  href="/reservar" 
                  className={styles.lightboxCtaButton}
                  onClick={() => setLightbox(null)}
                >
                  <Calendar size={18} />
                  <span>{lightbox.cta || 'AGENDAR SERVICIO'}</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default About
