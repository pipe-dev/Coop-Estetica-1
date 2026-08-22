import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Home as HomeIcon,
  Compass,
  Handshake,
  ShieldCheck,
  Award,
  Users,
  Leaf,
  Phone,
  Globe,
  X,
  Send,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa6'
import styles from './Contact.module.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const stagger = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const TypewriterTitle = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const textSegments = [
    { text: "HAZ REALIDAD", isGold: false },
    { text: "TU PROYECTO", isGold: true },
    { text: "CON NOSOTROS", isGold: false }
  ];

  const totalChars = textSegments.reduce((acc, seg, idx) => {
    return acc + seg.text.length + (idx < textSegments.length - 1 ? 1 : 0);
  }, 0);

  useEffect(() => {
    if (!hasStarted) return;

    if (visibleCount < totalChars) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 55);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowCursor(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, hasStarted, totalChars]);

  let globalCharIndex = 0;

  return (
    <motion.h2 
      className={styles.footerCallout}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      onViewportEnter={() => setHasStarted(true)}
      viewport={{ once: true, margin: "-50px" }}
    >
      {textSegments.map((segment, segIdx) => {
        return (
          <span key={segIdx} className={styles.titlePhrase}>
            {segment.text.split('').map((char, charIdx) => {
              const charGlobalIdx = globalCharIndex++;
              const isVisible = charGlobalIdx < visibleCount;
              const isCurrentCursorPos = isVisible && (charGlobalIdx === visibleCount - 1);

              return (
                <span
                  key={`${segIdx}-${charIdx}`}
                  className={segment.isGold ? styles.goldText : undefined}
                  style={{ opacity: isVisible ? 1 : 0 }}
                >
                  {char}
                  {isCurrentCursorPos && showCursor && visibleCount < totalChars && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className={styles.goldText}
                      style={{ marginLeft: '1px', fontWeight: 300, display: 'inline' }}
                    >
                      |
                    </motion.span>
                  )}
                </span>
              );
            })}
            {segIdx < textSegments.length - 1 && (() => {
              const spaceGlobalIdx = globalCharIndex++;
              const isSpaceVisible = spaceGlobalIdx < visibleCount;
              const isCurrentCursorPos = isSpaceVisible && (spaceGlobalIdx === visibleCount - 1);
              return (
                <span key={`space-${segIdx}`} style={{ opacity: isSpaceVisible ? 1 : 0 }}>
                  {'\u00A0'}
                  {isCurrentCursorPos && showCursor && visibleCount < totalChars && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className={styles.goldText}
                      style={{ marginLeft: '1px', fontWeight: 300, display: 'inline' }}
                    >
                      |
                    </motion.span>
                  )}
                </span>
              );
            })()}
          </span>
        );
      })}

      {showCursor && (visibleCount >= totalChars || visibleCount === 0) && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.7 }}
          className={styles.goldText}
          style={{ marginLeft: '2px', fontWeight: 300, display: 'inline' }}
        >
          |
        </motion.span>
      )}
    </motion.h2>
  );
};

function Contact() {
  const [introPhase, setIntroPhase] = useState('CENTER') // 'CENTER' | 'MOVING' | 'DONE'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectType: 'Residencial',
    message: ''
  })

  useEffect(() => {
    // Step 1: Hold giant emblem at center on solid background for 1.8s
    const timer1 = setTimeout(() => {
      setIntroPhase('MOVING')
    }, 1800)

    // Step 2 & 3: Emblem completes move to left at t=3.0s, then fade out solid background
    const timer2 = setTimeout(() => {
      setIntroPhase('DONE')
    }, 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormSent(true)

    const sponsorPhone = '573006269056'
    const messageLines = [
      '*SOLICITUD DE COTIZACIÓN - GRUPO SOL DEL RÍO*',
      '════════════════════════════',
      '',
      `► *Nombre:* ${formData.name}`,
      `► *Teléfono:* ${formData.phone}`,
      `► *Email:* ${formData.email}`,
      `► *Tipo de Proyecto:* ${formData.projectType}`,
      formData.message ? `► *Detalles / Mensaje:* ${formData.message}` : '',
      '',
      '════════════════════════════',
      '✦ _Enviado desde el portal web de Grupo Sol del Río_'
    ].filter(Boolean).join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${sponsorPhone}&text=${encodeURIComponent(messageLines)}`

    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
      setFormSent(false)
      setIsModalOpen(false)
      setFormData({ name: '', phone: '', email: '', projectType: 'Residencial', message: '' })
    }, 1200)
  }

  return (
    <main className={styles.solDelRioPage}>
      {/* ── 0. HIGH-IMPACT 3D INTRO PRELOADER ── */}
      <AnimatePresence>
        {introPhase !== 'DONE' && (
          <motion.div
            key="3d-preloader-overlay"
            className={styles.introOverlay}
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
            }}
          >

            {/* Centered Content during loading phase */}
            {introPhase === 'CENTER' && (
              <motion.div
                className={styles.introContent3d}
                initial={{ opacity: 0, scale: 0.5, rotateY: -35, perspective: 1200 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.introLogoFrame}>
                  <motion.img
                    layoutId="solDelRioLogoEmblem"
                    src="/images/logo_sol_del_rio_clean.svg"
                    alt="Grupo Empresarial Sol del Río"
                    className={styles.introLogoSvg}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <motion.div 
                  className={styles.introTitleBox}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                >
                  <span className={styles.introSubtitle}>GRUPO EMPRESARIAL</span>
                  <h1 className={styles.introTitle}>SOL <span className={styles.delGoldIntro}>DEL</span> RIO</h1>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. HERO / BRANDING & IMAGE SPLIT SECTION ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          
          {/* LEFT: Branding & Main Headline */}
          <motion.div
            className={styles.brandSide}
            style={{ zIndex: introPhase !== 'DONE' ? 100000 : 2 }}
            initial="hidden"
            animate={introPhase === 'DONE' ? "visible" : "hidden"}
            variants={stagger}
          >
            {/* Official Cleaned Vector Logo */}
            <div className={styles.logoWrapper}>
              <motion.div className={styles.sunLogo}>
                {introPhase !== 'CENTER' && (
                  <motion.img
                    layoutId="solDelRioLogoEmblem"
                    src="/images/logo_sol_del_rio_clean.svg"
                    alt="Grupo Empresarial Sol del Río"
                    className={styles.logoSvg}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </motion.div>

              <motion.div className={styles.logoTextGroup} variants={fadeInUp}>
                <span className={styles.grupoText}>GRUPO EMPRESARIAL</span>
                <h2 className={styles.solDelRioLogo}>
                  <span>SOL</span>
                  <span className={styles.delGold}>DEL</span>
                  <span>RIO</span>
                </h2>
                <div className={styles.taglineBar}>
                  <span>CONSTRUIMOS</span>
                  <span className={styles.dot}>|</span>
                  <span>DESARROLLAMOS</span>
                  <span className={styles.dot}>|</span>
                  <span>TRANSFORMAMOS</span>
                </div>
              </motion.div>
            </div>

            {/* Main Headline */}
            <motion.div className={styles.headlineGroup} variants={fadeInUp}>
              <h1 className={styles.mainTitle}>
                CONSTRUIMOS<br />
                MÁS QUE OBRAS,
              </h1>
              <p className={styles.scriptAccent}>Construimos tu futuro.</p>
            </motion.div>

            <motion.p className={styles.heroDescription} variants={fadeInUp}>
              Soluciones integrales en construcción e inmobiliaria para hacer realidad tus proyectos y sueños.
            </motion.p>

            <motion.div className={styles.heroCtaRow} variants={fadeInUp}>
              <button
                className={styles.primaryCtaBtn}
                onClick={() => setIsModalOpen(true)}
              >
                <span>Cotizar Proyecto</span>
                <ChevronRight size={18} />
              </button>

              <a
                href="https://wa.me/573006269056?text=Hola,%20quisiera%20informaci%C3%B3n%20sobre%20sus%20proyectos%20de%20construcci%C3%B3n"
                target="_blank"
                rel="noreferrer"
                className={styles.whatsappCtaBtn}
              >
                <FaWhatsapp size={18} />
                <span>WhatsApp Directo</span>
              </a>
            </motion.div>
          </motion.div>

          {/* RIGHT: Photography Showcase & Curved Gold Border */}
          <div className={styles.imageSide}>
            <div className={styles.curvedGoldDivider} />
            <div className={styles.imageContainer}>
              {/* Architecture Building Header Background */}
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop"
                alt="Proyecto Inmobiliario Moderno - Grupo Sol del Río"
                className={styles.buildingImage}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. NUESTROS SERVICIOS SECTION ── */}
      <section className={styles.servicesSection}>
        <div className={styles.container}>
          
          <div className={styles.sectionPillWrapper}>
            <span className={styles.sectionPill}>NUESTROS SERVICIOS</span>
          </div>

          <motion.div
            className={styles.goldBoxContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            <div className={styles.servicesGrid}>
              
              {/* Service 1 */}
              <motion.div className={styles.serviceCard} variants={fadeInUp}>
                <div className={styles.iconCircle}>
                  <Building2 size={28} className={styles.goldIcon} />
                </div>
                <h3 className={styles.serviceTitle}>CONSTRUCCIÓN</h3>
                <p className={styles.serviceText}>
                  Obras civiles, residenciales, comerciales e industriales con calidad y compromiso.
                </p>
              </motion.div>

              {/* Service 2 */}
              <motion.div className={styles.serviceCard} variants={fadeInUp}>
                <div className={styles.iconCircle}>
                  <HomeIcon size={28} className={styles.goldIcon} />
                </div>
                <h3 className={styles.serviceTitle}>INMOBILIARIA</h3>
                <p className={styles.serviceText}>
                  Encuentra la propiedad ideal para vivir o invertir con seguridad y respaldo.
                </p>
              </motion.div>

              {/* Service 3 */}
              <motion.div className={styles.serviceCard} variants={fadeInUp}>
                <div className={styles.iconCircle}>
                  <Compass size={28} className={styles.goldIcon} />
                </div>
                <h3 className={styles.serviceTitle}>DISEÑO Y ARQUITECTURA</h3>
                <p className={styles.serviceText}>
                  Diseñamos espacios funcionales, modernos y sostenibles.
                </p>
              </motion.div>

              {/* Service 4 */}
              <motion.div className={styles.serviceCard} variants={fadeInUp}>
                <div className={styles.iconCircle}>
                  <Handshake size={28} className={styles.goldIcon} />
                </div>
                <h3 className={styles.serviceTitle}>ASESORÍA PERSONALIZADA</h3>
                <p className={styles.serviceText}>
                  Te acompañamos en cada paso para que tomes la mejor decisión.
                </p>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 3. PILARES & VALORES DE MARCA ── */}
      <section className={styles.pillarsSection}>
        <div className={styles.container}>
          
          <motion.div
            className={styles.goldBoxContainerSlim}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            <div className={styles.pillarsGrid}>
              
              {/* Pillar 1 */}
              <motion.div className={styles.pillarCard} variants={fadeInUp}>
                <div className={styles.pillarIconWrapper}>
                  <ShieldCheck size={32} className={styles.pillarIcon} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>CONFIANZA</h4>
                  <p className={styles.pillarText}>Respaldo y experiencia en cada proyecto.</p>
                </div>
              </motion.div>

              {/* Pillar 2 */}
              <motion.div className={styles.pillarCard} variants={fadeInUp}>
                <div className={styles.pillarIconWrapper}>
                  <Award size={32} className={styles.pillarIcon} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>CALIDAD</h4>
                  <p className={styles.pillarText}>Materiales y procesos de alto estándar.</p>
                </div>
              </motion.div>

              {/* Pillar 3 */}
              <motion.div className={styles.pillarCard} variants={fadeInUp}>
                <div className={styles.pillarIconWrapper}>
                  <Users size={32} className={styles.pillarIcon} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>COMPROMISO</h4>
                  <p className={styles.pillarText}>Cumplimos tus sueños como si fueran nuestros.</p>
                </div>
              </motion.div>

              {/* Pillar 4 */}
              <motion.div className={styles.pillarCard} variants={fadeInUp}>
                <div className={styles.pillarIconWrapper}>
                  <Leaf size={32} className={styles.pillarIcon} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>SOSTENIBILIDAD</h4>
                  <p className={styles.pillarText}>Construimos pensando en un mejor futuro.</p>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 4. FOOTER & CONTACT BAR ── */}
      <footer className={styles.footerSection}>
        <div className={styles.container}>
          
          <TypewriterTitle />

          <div className={styles.contactInfoBar}>
            <a href="tel:573006269056" className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>300 626 9056</span>
            </a>

            <span className={styles.divider}>|</span>

            <a href="https://gruposoldelrio.com" target="_blank" rel="noreferrer" className={styles.contactItem}>
              <Globe size={18} className={styles.contactIcon} />
              <span>gruposoldelrio.com</span>
            </a>

            <span className={styles.divider}>|</span>

            <a href="https://instagram.com/gruposoldelrio" target="_blank" rel="noreferrer" className={styles.contactItem}>
              <FaInstagram size={18} className={styles.contactIcon} />
              <span>@gruposoldelrio</span>
            </a>

            <span className={styles.divider}>|</span>

            <a href="https://facebook.com/GrupoSolDelRio" target="_blank" rel="noreferrer" className={styles.contactItem}>
              <FaFacebook size={18} className={styles.contactIcon} />
              <span>/GrupoSolDelRio</span>
            </a>

            <span className={styles.divider}>|</span>

            <a href="https://tiktok.com/@gruposoldelrio" target="_blank" rel="noreferrer" className={styles.contactItem}>
              <FaTiktok size={18} className={styles.contactIcon} />
              <span>@gruposoldelrio</span>
            </a>
          </div>

        </div>
      </footer>

      {/* ── FLOATING WHATSAPP BUTTON ── */}
      <a
        href="https://wa.me/573006269056?text=Hola,%20quisiera%20cotizar%20un%20proyecto%20con%20Grupo%20Sol%20del%20R%C3%ADo"
        target="_blank"
        rel="noreferrer"
        className={styles.floatingWhatsapp}
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp size={26} />
        <span className={styles.whatsappTooltip}>¿Tienes un proyecto? Hablemos</span>
      </a>

      {/* ── QUOTE MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
            <motion.div
              className={styles.modalCard}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                <span className={styles.modalSub}>GRUPO SOL DEL RÍO</span>
                <h3 className={styles.modalTitle}>Cotiza tu Proyecto</h3>
                <p className={styles.modalDesc}>
                  Completa tus datos y un especialista en arquitectura e ingeniería se pondrá en contacto contigo.
                </p>
              </div>

              {formSent ? (
                <div className={styles.successWrapper}>
                  <CheckCircle2 size={54} className={styles.successCheck} />
                  <h4>¡Solicitud Enviada con Éxito!</h4>
                  <p>Un asesor comercial de Grupo Sol del Río te contactará a la brevedad.</p>
                </div>
              ) : (
                <form className={styles.modalForm} onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label>Nombre Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej. Carlos Mendoza"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej. 300 123 4567"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Correo Electrónico</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo de Proyecto</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                    >
                      <option value="Residencial">Construcción Residencial</option>
                      <option value="Comercial">Construcción Comercial e Industrial</option>
                      <option value="Inmobiliaria">Inversión Inmobiliaria</option>
                      <option value="Arquitectura">Diseño & Arquitectura</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Detalles o mensaje adicional</label>
                    <textarea
                      name="message"
                      rows="3"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Cuéntanos la ubicación, tamaño estimado o idea de tu proyecto..."
                    />
                  </div>

                  <button type="submit" className={styles.modalSubmitBtn}>
                    <span>Enviar Solicitud</span>
                    <Send size={16} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Contact
