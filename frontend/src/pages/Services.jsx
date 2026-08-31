import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Star, Check } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'
import { memberships } from '../data/memberships'
import styles from './Services.module.css'
import LiquidGlassIos26 from '../components/ui/LiquidGlassIos26'
import InteractiveBackground from '../components/ui/InteractiveBackground'
import ProgressiveImage from '../components/ui/ProgressiveImage'
import DetailModal from '../components/ui/DetailModal'

const getPlaceholderUrl = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  return url.replace('w=600', 'w=20').replace('q=80', 'q=10');
}

function Services() {
  const { serviceCategories, memberships: adminMemberships } = useAdmin()
  const currentMemberships = adminMemberships || memberships
  const [activeCategory, setActiveCategory] = useState('all')
  const [hideUi, setHideUi] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  // Flatten active services dynamically from AdminContext
  const allServices = useMemo(() => {
    return (serviceCategories || []).flatMap(cat =>
      (cat.services || [])
        .filter(s => s.active !== false)
        .map(s => ({ ...s, category: cat.id, categoryName: cat.name }))
    )
  }, [serviceCategories])

  // Build filter categories dynamically
  const filterCategories = useMemo(() => {
    return (serviceCategories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
    }))
  }, [serviceCategories])

  // Make the entire browser body black for this page
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000000'
    return () => {
      document.body.style.backgroundColor = originalBackground
    }
  }, [])

  // Auto-hide Filter Bar & Navbar on scroll down, re-reveal on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideUi(true)
        window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: true } }))
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setHideUi(false)
        window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
    }
  }, [])

  const filteredServices = activeCategory === 'all'
    ? allServices
    : allServices.filter(s => s.category === activeCategory)

  return (
    <motion.div 
      className={styles.shopContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <InteractiveBackground variant="blue" />
      <div className={styles.servicesOverlay} />
      
      {/* HORIZONTAL PILL FILTERS - SMART AUTO HIDE */}
      <motion.nav 
        className={styles.filterContainer}
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: hideUi ? 0 : 1, 
          y: hideUi ? -90 : 0 
        }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ pointerEvents: hideUi ? 'none' : 'auto' }}
      >
        <div className={styles.filterWrapper}>
          {/* Top Row: 5 Filters */}
          <ul className={styles.filterRow}>
            <li onClick={() => setActiveCategory('all')}>
              <LiquidGlassIos26 
                scale={0.03}
                baseFrequency={0.1}
                numOctaves={3}
                centerBlur={16}
                bevelBlur={32}
                bevelWidth={16}
                saturate={150}
                brightness={1.5}
                glassTintOpacity={0.3}
                tint="light"
                borderRadius={9999}
                disableContentFilter={true}
                className={`${styles.filterPill} ${activeCategory === 'all' ? styles.active : ''}`}
              >
                {activeCategory === 'all' && <span className={styles.activeDot}>•</span>}
                <span>Todos</span>
              </LiquidGlassIos26>
            </li>
            {filterCategories.slice(0, 4).map(cat => (
              <li key={cat.id} onClick={() => setActiveCategory(cat.id)}>
                <LiquidGlassIos26 
                  scale={0.03}
                  baseFrequency={0.1}
                  numOctaves={3}
                  centerBlur={16}
                  bevelBlur={32}
                  bevelWidth={16}
                  saturate={150}
                  brightness={1.5}
                  glassTintOpacity={0.3}
                  tint="light"
                  borderRadius={9999}
                  disableContentFilter={true}
                  className={`${styles.filterPill} ${activeCategory === cat.id ? styles.active : ''}`}
                >
                  {activeCategory === cat.id && <span className={styles.activeDot}>•</span>}
                  <span>{cat.name}</span>
                </LiquidGlassIos26>
              </li>
            ))}
          </ul>

          {/* Bottom Row: 2 Filters Centered */}
          <ul className={styles.filterRow}>
            {filterCategories.slice(4).map(cat => (
              <li key={cat.id} onClick={() => setActiveCategory(cat.id)}>
                <LiquidGlassIos26 
                  scale={0.03}
                  baseFrequency={0.1}
                  numOctaves={3}
                  centerBlur={16}
                  bevelBlur={32}
                  bevelWidth={16}
                  saturate={150}
                  brightness={1.5}
                  glassTintOpacity={0.3}
                  tint="light"
                  borderRadius={9999}
                  disableContentFilter={true}
                  className={`${styles.filterPill} ${activeCategory === cat.id ? styles.active : ''}`}
                >
                  {activeCategory === cat.id && <span className={styles.activeDot}>•</span>}
                  <span>{cat.name}</span>
                </LiquidGlassIos26>
              </li>
            ))}
          </ul>
        </div>
      </motion.nav>

      {/* EDITORIAL SERVICE GRID (same structure as Shop product grid) */}
      <main className={styles.mainContent}>

        <motion.div layout className={styles.productGrid}>
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, i) => (
              <motion.article
                key={service.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.1, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
                className={styles.productCardWrapper}
                onClick={() => setSelectedService(service)}
                style={{ cursor: 'pointer' }}
              >
                <LiquidGlassIos26 
                  className={styles.productCardGlass} 
                  tint="dark" 
                  disableContentFilter={true}
                  contentPadding={0}
                  centerBlur={24}
                  bevelBlur={32}
                  bevelWidth={16}
                  saturate={120}
                  brightness={0.8}
                  glassBg="rgba(0, 0, 0, 0.7)"
                >
                  {service.image && (
                    <div className={styles.imageContainer}>
                      <ProgressiveImage 
                        src={service.image}
                        placeholderSrc={getPlaceholderUrl(service.image)}
                        alt={service.name} 
                        className={styles.productImage}
                      />
                    </div>
                  )}

                  <div className={styles.productInfo}>
                    <span className={styles.productBrand}>{service.categoryName}</span>
                    <h4 className={styles.productName}>{service.name}</h4>
                    <p className={styles.serviceDescription}>{service.description}</p>
                    <span className={styles.serviceDuration}>{service.duration}</span>
                    <span className={styles.productPrice}>{service.price.toLocaleString()}</span>
                    
                    <button 
                      className={styles.addToCartBtn} 
                      aria-label="Reservar servicio"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedService(service)
                      }}
                    >
                      <span className={styles.btnLabel}>Reservar</span>
                      <div className={styles.btnIconWrapper}>
                         <ArrowRight size={16} strokeWidth={1} />
                      </div>
                    </button>
                  </div>
                </LiquidGlassIos26>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* DETAILED QUICK VIEW MODAL */}
      {selectedService && (
        <DetailModal
          item={selectedService}
          type="service"
          onClose={() => setSelectedService(null)}
          onAction={(serv) => {
            alert(`¡Reserva iniciada para ${serv.name}! Redirigiendo...`)
          }}
        />
      )}

      {/* VIP MEMBERSHIPS SECTION */}
      <section className={styles.membershipsSection}>
        <div className={styles.membershipsContainer}>
          <div className={styles.membershipsHeader}>
            <span className={styles.membershipsSub}>Experiencia Exclusiva</span>
            <h2 className={styles.membershipsTitle}>Planes & Membresías VIP</h2>
          </div>

          <div className={styles.membershipsGrid}>
            {currentMemberships.map((plan) => (
              <motion.div
                key={plan.id}
                className={`${styles.vipCard} ${plan.popular ? styles.vipCardPopular : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>
                    <Star size={12} className={styles.popularIcon} /> Recomendado
                  </div>
                )}

                <div className={styles.vipHeader}>
                  <h3 className={styles.vipName}>{plan.name}</h3>
                  <div className={styles.vipPriceWrapper}>
                    <span className={styles.vipCurrency}>$</span>
                    <span className={styles.vipAmount}>{plan.price.toLocaleString()}</span>
                    <span className={styles.vipPeriod}>/mes</span>
                  </div>
                </div>

                <ul className={styles.vipFeatures}>
                  {plan.features.map((feature, j) => (
                    <li key={j} className={styles.vipFeature}>
                      <Check size={16} className={styles.vipCheckIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a href="/contacto" className={styles.vipAction}>
                  <span>Solicitar Plan</span>
                  <ArrowRight size={16} />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default Services
