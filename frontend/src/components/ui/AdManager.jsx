import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ShoppingCart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LiquidGlassIos26 from './LiquidGlassIos26';
import Button from './Button';
import styles from './AdManager.module.css';

const AD_TIMEOUT_MS = 10000; // 10 seconds
const INACTIVITY_MS = 45000; // 45 seconds
const SCROLL_THRESHOLD = 0.5; // 50% depth
const MOBILE_FLICK_THRESHOLD = -50; // pixels per scroll event (negative = scrolling up)

const ADS_DATA = [
  {
    id: 'luxury-banner',
    bgImage: '/images/service_hair.png',
    title: <>Piel Preciosa<br/>con nuestros<br/>productos.</>,
    text: 'Compra hoy y transforma tu rutina de cuidado y belleza',
    buttons: [
      {
        label: 'COMPRA AHORA',
        icon: <ShoppingCart size={22} style={{ marginLeft: '12px' }} />,
        href: '/tienda',
        variant: 'primary'
      }
    ]
  },
  {
    id: 'cta-final',
    bgImage: null, // No image, just pure obsidian glass
    title: <>Nuestra agenda<br/>se llena rápido.<br/>Tu belleza<br/>no puede esperar.</>,
    text: 'Asegura tu lugar esta semana antes de que nos quedemos sin disponibilidad. Toca aquí y reserva tu momento.',
    buttons: [
      {
        label: 'Reservar Ahora',
        icon: null,
        href: '/reservar',
        variant: 'primary'
      },
      {
        label: 'Regalar Experiencia',
        icon: <Gift size={20} style={{ marginLeft: '10px' }} />,
        href: '/gift-cards',
        variant: 'outline'
      }
    ]
  }
];

const AdManager = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenAd, setHasSeenAd] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const location = useLocation();
  const initialPath = useRef(location.pathname);
  
  // Timers and refs
  const inactivityTimer = useRef(null);
  const tenSecTimer = useRef(null);
  const lastScrollY = useRef(0);
  const isTriggered = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('spa_ad_seen');
    if (stored) {
      const timestamp = parseInt(stored, 10);
      const now = new Date().getTime();
      // 24 hours = 86400000 ms
      if (now - timestamp < 86400000) {
        setHasSeenAd(true);
      } else {
        localStorage.removeItem('spa_ad_seen');
      }
    }
  }, []);

  const triggerAd = (reason) => {
    if (hasSeenAd || isTriggered.current) return;
    console.log('Ad triggered by:', reason);
    isTriggered.current = true;
    
    // Pick random ad
    const randomAd = Math.floor(Math.random() * ADS_DATA.length);
    setCurrentAdIndex(randomAd);
    
    setIsVisible(true);
    
    // Set local storage
    localStorage.setItem('spa_ad_seen', new Date().getTime().toString());
    setHasSeenAd(true);
  };

  const resetInactivity = () => {
    if (hasSeenAd || isTriggered.current) return;
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      triggerAd('inactivity');
    }, INACTIVITY_MS);
  };

  useEffect(() => {
    if (hasSeenAd || isTriggered.current) return;

    // 1. 10s Timer
    tenSecTimer.current = setTimeout(() => {
      triggerAd('10s_timer');
    }, AD_TIMEOUT_MS);

    // 2. Inactivity Timer Setup
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivity));
    resetInactivity();

    // 3. Scroll & Mobile Exit Intent
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Scroll Depth > 50%
      if (documentHeight > 0 && currentScrollY / documentHeight > SCROLL_THRESHOLD) {
        triggerAd('scroll_depth');
      }

      // Mobile Exit Intent (Fast scroll up)
      const scrollDiff = currentScrollY - lastScrollY.current;
      if (scrollDiff < MOBILE_FLICK_THRESHOLD && currentScrollY > 100) {
        // Fast upward scroll detected. Only consider if we are reasonably far down.
        triggerAd('mobile_exit_intent');
      }
      
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 4. Desktop Exit Intent (Mouse leaves top of window)
    const handleMouseOut = (e) => {
      if (e.clientY <= 0) {
        triggerAd('desktop_exit_intent');
      }
    };
    document.addEventListener('mouseleave', handleMouseOut);

    return () => {
      clearTimeout(tenSecTimer.current);
      clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetInactivity));
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseOut);
    };
  }, [hasSeenAd]);

  // 5. Second Page View Trigger
  useEffect(() => {
    if (hasSeenAd || isTriggered.current) return;
    
    // If the location path has changed from the initial path, it's a second page view
    if (location.pathname !== initialPath.current) {
      // Small delay so they actually see the new page load first
      const timeout = setTimeout(() => {
        triggerAd('second_page_view');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, hasSeenAd]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleManualOpen = () => {
    const randomAd = Math.floor(Math.random() * ADS_DATA.length);
    setCurrentAdIndex(randomAd);
    setIsVisible(true);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isVisible]);

  const ad = ADS_DATA[currentAdIndex];

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                transition: { type: 'spring', damping: 20, stiffness: 300 }
              }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
            >
              <LiquidGlassIos26 
                glassBg="rgba(0,0,0,0.7)" 
                opacity={0.8}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              />
              
              {ad.bgImage && (
                <div className={styles.adBg}>
                  <img src={ad.bgImage} alt="Background" />
                </div>
              )}
              <div className={styles.adOverlay} />

              <button className={styles.closeBtn} onClick={handleClose}>
                <X size={24} />
              </button>

              <div className={styles.content}>
                <h2 className={styles.title} style={!ad.bgImage ? { fontSize: '2rem' } : {}}>
                  {ad.title}
                </h2>
                <p className={styles.text}>
                  {ad.text}
                </p>
                <div 
                  onClick={handleClose} 
                  style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  {ad.buttons.map((btn, i) => (
                    <Button 
                      key={i} 
                      variant={btn.variant} 
                      size="lg" 
                      href={btn.href} 
                      style={{ fontSize: '1.1rem', padding: '1rem 2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                    >
                      {btn.label}
                      {btn.icon}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isVisible && (
          <motion.div
            className={styles.floatingGiftBtn}
            onClick={handleManualOpen}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gift size={28} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdManager;
