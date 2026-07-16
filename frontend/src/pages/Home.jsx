import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ShoppingCart, Gift } from 'lucide-react'
import SectionTitle from '../components/ui/SectionTitle'
import Button from '../components/ui/Button'
import { memberships } from '../data/memberships'
import styles from './Home.module.css'

/* ⚠️ NOTA: "Catheryne Ríos Estética" es placeholder. Cambiar por el nombre real del negocio. */

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.12 } 
  }
}

function Home() {
  const heroRef = useRef(null)
  const videoRef = useRef(null)
  const ctaButtonRef = useRef(null)
  
  const [activeScene, setActiveScene] = useState(0)
  const [storyWord, setStoryWord] = useState("")
  const [showCtas, setShowCtas] = useState(false)
  
  const [isReturningUser, setIsReturningUser] = useState(() => {
    // Check if running in browser before accessing localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hasSeenIntro') === 'true';
    }
    return false;
  })

  useEffect(() => {
    // GSAP Animation for E-commerce CTA
    if (ctaButtonRef.current) {
      gsap.to(ctaButtonRef.current, {
        scale: 1.03,
        boxShadow: "0px 0px 20px 5px rgba(212,175,55,0.4)",
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      })
    }
  }, [])
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end']
  })
  
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isReturningUser && latest > 0.8) {
      localStorage.setItem('hasSeenIntro', 'true');
    }

    if (isReturningUser) return;

    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = latest * videoRef.current.duration;
    }

    if (latest < 0.25) {
      setActiveScene(0)
      setStoryWord("")
      setShowCtas(false)
    } else if (latest < 0.50) {
      setActiveScene(1)
      setStoryWord("")
      setShowCtas(false)
    } else if (latest < 0.75) {
      setActiveScene(-1) // Empty screen
      setStoryWord("")
      setShowCtas(false)
    } else if (latest < 0.91) {
      setActiveScene(2)
      setStoryWord("")
      setShowCtas(false)
    } else {
      setActiveScene(3)
      setStoryWord("quiérete en:")
      setShowCtas(true)
    }
  })

  const heroOpacity = useTransform(scrollYProgress, [0.9, 1], [1, 0])
  
  const overlayOpacity = useTransform(scrollYProgress, [0.49, 0.50], [1, 0])

  return (
    <main className={styles.home}>
      {/* ===== HERO SECTION ===== */}
      <section className={styles.hero} ref={heroRef} id="hero" style={isReturningUser ? { height: '100vh', minHeight: '100vh' } : {}}>
        <div className={styles.heroSticky}>
          <div className={styles.heroImageWrapper}>
            <video
              ref={videoRef}
              src="/videos/hero.mp4"
              className={styles.heroImage}
              muted
              playsInline
              preload="auto"
              autoPlay={isReturningUser}
              loop={isReturningUser}
            />
          </div>
          <motion.div className={styles.heroOverlay} style={isReturningUser ? { opacity: 0.5 } : { opacity: overlayOpacity }} />

          {isReturningUser ? (
            <motion.div
              className={styles.heroContentStory}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ zIndex: 10, textAlign: 'center', width: '100%', left: 0, right: 0, margin: '0 auto', alignItems: 'center', transform: 'none' }}
            >
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button variant="primary" size="lg" href="/reservar">Agendar Cita</Button>
                <Button variant="outline" size="lg" href="/tienda">Ver Tienda</Button>
                <Button variant="outline" size="lg" href="/servicios">Ver Servicios</Button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
            {activeScene === 0 && (
              <motion.div
                key="scene0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={styles.heroContentStory}
              >
                <p className={styles.heroSubtitle}>Bienvenida a</p>
                <h1 className={styles.heroTitle}>
                  Catheryne Ríos <span className={styles.heroTitleAccent}>estética</span>
                </h1>
              </motion.div>
            )}
            {activeScene === 1 && (
              <motion.div
                key="scene1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={styles.heroContentStory}
              >
                <h2 className={styles.heroTitle}>
                  El lujo de decidir <span className={styles.heroTitleAccent}>cuidarte</span>.
                </h2>
              </motion.div>
            )}
            {activeScene === 2 && (
              <motion.div
                key="scene2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={styles.heroContentStory}
              >
                <h2 className={styles.heroTitle}>
                  Para engrandecer <span className={styles.heroTitleAccent}>tu belleza</span>.
                </h2>
              </motion.div>
            )}
            {activeScene === 3 && (
              <div className={styles.heroContentStory} style={{ top: '30%', transform: 'none' }}>
                {/* Single animating word */}
                <AnimatePresence mode="wait">
                  {storyWord && (
                    <motion.span
                      key={storyWord}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -80 }}
                      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                      className={`${styles.floatingWordStatic} ${storyWord === "quiérete en:" ? styles.finalPhrase : ""}`}
                    >
                      {storyWord === "quiérete en:" ? (
                        <>
                          quiérete
                          <br />
                          en:
                        </>
                      ) : (
                        storyWord
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Staggered vertical buttons (appears only after text disappears) */}
                <AnimatePresence>
                  {showCtas && (
                    <motion.div
                      key="hero-ctas-vertical"
                      className={styles.heroCtasVertical}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0, y: 80 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.6,
                            ease: [0.25, 1, 0.5, 1],
                            staggerChildren: 0.2
                          }
                        }
                      }}
                    >
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                      >
                        <Button className={styles.storyCtaButton} variant="primary" size="lg" href="/reservar">
                          Agendar Cita
                        </Button>
                      </motion.div>
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                      >
                        <Button className={`${styles.storyCtaButton} ${styles.storyOutlineButton}`} variant="outline" size="lg" href="/tienda">
                          Ver Tienda
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            </AnimatePresence>
          )}

        </div>
      </section>

      {/* ===== E-COMMERCE CTA BANNER ===== */}
      <section className={styles.luxuryBanner}>
        <div className={styles.luxuryBannerBg}>
          <img src="/images/service_hair.png" alt="Productos de cuidado" />
        </div>
        <div className={styles.luxuryBannerOverlay} />
        <div className="container">
          <motion.div
            className={styles.luxuryBannerContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.h2 className={styles.luxuryBannerTitle} variants={fadeInUp} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              Piel Preciosa con nuestros productos.
            </motion.h2>
            <motion.p className={styles.luxuryBannerText} variants={fadeInUp} style={{ maxWidth: '500px', fontSize: '1.2rem', marginBottom: '2rem' }}>
              Compra hoy y transforma tu rutina de cuidado y belleza
            </motion.p>
            <motion.div variants={fadeInUp} style={{ padding: '10px' }}>
              <div ref={ctaButtonRef} style={{ display: 'inline-block', borderRadius: 'var(--radius-full)' }}>
                <Button variant="primary" size="lg" href="/tienda" style={{ fontSize: '1.2rem', padding: '1.2rem 3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  COMPRA AHORA
                  <ShoppingCart size={22} style={{ marginLeft: '12px' }} />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className={styles.ctaSection}>
        <div className="container">
          <motion.div
            className={styles.ctaContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.h2 className={styles.ctaTitle} variants={fadeInUp}>
              Nuestra agenda se llena rápido. Tu belleza no puede esperar.
            </motion.h2>
            <motion.p className={styles.ctaText} variants={fadeInUp}>
              Asegura tu lugar esta semana antes de que nos quedemos sin disponibilidad. Toca aquí y reserva tu momento.
            </motion.p>
            <motion.div className={styles.ctaButtons} variants={fadeInUp}>
              <Button variant="primary" size="lg" href="/reservar" className={styles.smokyButton}>
                Reservar Ahora
              </Button>
              <Button variant="outline" size="lg" href="/gift-cards" className={styles.smokyButton}>
                Regalar Experiencia
                <Gift size={20} style={{ marginLeft: '10px' }} />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== MEMBERSHIPS ===== */}
      <section className={styles.membershipsSection} id="memberships">
        <div className="container">
          <SectionTitle
            subtitle="Membresías"
            title="Planes exclusivos para clientas VIP"
            description="Accede a beneficios únicos y precios preferenciales con nuestros planes de membresía"
            light
          />
          <motion.div
            className={styles.membershipsGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {memberships.map((plan, i) => (
              <motion.div
                key={plan.id}
                className={`${styles.membershipCard} ${plan.popular ? styles.membershipCardPopular : ''}`}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                {plan.popular && <div className={styles.popularBadge}>Más Popular</div>}
                <h3 className={styles.membershipName}>{plan.name}</h3>
                <div className={styles.membershipPrice}>
                  <span className={styles.membershipCurrency}>$</span>
                  <span className={styles.membershipAmount}>{plan.price.toLocaleString()}</span>
                  <span className={styles.membershipPeriod}>/mes</span>
                </div>
                <ul className={styles.membershipFeatures}>
                  {plan.features.map((feature, j) => (
                    <li key={j} className={styles.membershipFeature}>
                      <span className={styles.featureCheck}>✦</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  size="md"
                  href="/contacto"
                >
                  Elegir Plan
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default Home
