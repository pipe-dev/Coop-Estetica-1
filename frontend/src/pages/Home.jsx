import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ShoppingCart, Gift, Calendar, ShoppingBag, Sparkles, Gem } from 'lucide-react'
import SectionTitle from '../components/ui/SectionTitle'
import Button from '../components/ui/Button'
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
    
    // Constant slow beat for the "Agendar Cita" button (Returning User Hero)
    gsap.to('#beat-btn', {
      scale: 1.15,
      "--glass-bg-color": "rgba(255, 255, 255, 0.05)",
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
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
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className={styles.sideDockContainer}
            >
              <div id="beat-btn">
                <Button variant="primary" shape="square" href="/reservar">
                  <Calendar size={40} strokeWidth={1.5} className={styles.heroSquareIcon} />
                  <span className={styles.heroSquareText}>Agendar Cita</span>
                </Button>
              </div>
              <Button variant="outline" shape="square" href="/tienda">
                <ShoppingBag size={40} strokeWidth={1.5} className={styles.heroSquareIcon} />
                <span className={styles.heroSquareText}>Ver Tienda</span>
              </Button>
              <Button variant="outline" shape="square" href="/servicios">
                <Gem size={40} strokeWidth={1.5} className={styles.heroSquareIcon} />
                <span className={styles.heroSquareText}>Ver Servicios</span>
              </Button>
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
                        <Button variant="primary" shape="square" href="/reservar">
                          <Calendar size={40} strokeWidth={1.5} className={styles.heroSquareIcon} />
                          <span className={styles.heroSquareText}>Agendar Cita</span>
                        </Button>
                      </motion.div>
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                      >
                        <Button variant="outline" shape="square" href="/tienda">
                          <ShoppingBag size={40} strokeWidth={1.5} className={styles.heroSquareIcon} />
                          <span className={styles.heroSquareText}>Ver Tienda</span>
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


    </main>
  )
}

export default Home
