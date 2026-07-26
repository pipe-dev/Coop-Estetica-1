import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import SlideTabs from '../ui/SlideTabs'
import LiquidGlassIos26 from '../ui/LiquidGlassIos26'
import styles from './Navbar.module.css'
/* ⚠️ NOTA: "ÁUREA SPA" es placeholder. Cambiar cuando se defina el nombre real. */

const navLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Tienda', path: '/tienda' },
  { name: 'Servicios', path: '/servicios' },
  { name: 'Nosotros', path: '/nosotros' },
  { name: 'Patrocinador', path: '/patrocinador' },
]

function Navbar() {
  const [isHero, setIsHero] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showFullNavInHero, setShowFullNavInHero] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  const [isReturningUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hasSeenIntro') === 'true';
    }
    return false;
  })

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/' && !isReturningUser) {
        const heroHeight = window.innerHeight * 4.5;
        setIsHero(window.scrollY < heroHeight * 0.96);
      } else {
        setIsHero(false);
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Init
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname, isReturningUser])

  // Timer logic for hiding nav after hover
  useEffect(() => {
    let timeoutId;
    if (!isHovered && isHero) {
      timeoutId = setTimeout(() => {
        setShowFullNavInHero(false)
      }, 4000) // Cambiado a 4 segundos
    }
    return () => clearTimeout(timeoutId)
  }, [isHovered, isHero])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    document.body.style.overflow = 'auto'
  }, [location.pathname])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }

  const isCollapsed = isHero && !showFullNavInHero;

  return (
    <header className={styles.navbar}>
      <div 
        className={styles.navContainer}
        onPointerEnter={() => {
          setIsHovered(true)
          setShowFullNavInHero(true)
        }}
        onPointerLeave={() => {
          setIsHovered(false)
        }}
        onClick={() => {
          // Extra seguridad para móviles
          setIsHovered(true)
          setShowFullNavInHero(true)
        }}
      >
        {/* Hit area padding to make it easier to hover/tap the collapsed pill */}
        <div style={{ padding: '30px 20px', marginTop: '-10px' }}>
          <motion.div
            className={styles.desktopNav}
            initial={false}
            animate={
              isCollapsed
                ? {
                    width: 140,
                    height: 6,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    y: 15,
                    overflow: 'hidden'
                  }
                : {
                    width: 'auto',
                    height: 'auto',
                    borderRadius: 24,
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    y: 0,
                    overflow: 'visible'
                  }
            }
            transition={
              isCollapsed 
                ? { duration: 1, ease: [0.25, 1, 0.5, 1] } // Lento (1 segundo) para aplastarse
                : { duration: 0.4, ease: "easeOut" }       // Rápido (400ms) para mostrarse
            }
          >
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1, scale: isCollapsed ? 0.8 : 1 }}
              transition={
                isCollapsed 
                  ? { duration: 1, ease: [0.25, 1, 0.5, 1] }
                  : { duration: 0.4, ease: "easeOut" }
              }
              style={{ pointerEvents: isCollapsed ? 'none' : 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <LiquidGlassIos26 
                scale={0.05}
                baseFrequency={0.08}
                numOctaves={3}
                centerBlur={2}
                bevelBlur={16}
                bevelWidth={22}
                saturate={200}
                brightness={1.15}
                glassTintOpacity={0.002}
                className={styles.navGlass}
              >
                <SlideTabs tabs={navLinks} />
              </LiquidGlassIos26>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
