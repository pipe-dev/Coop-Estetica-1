import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Star, Check } from 'lucide-react'
import { serviceCategories } from '../data/services'
import { memberships } from '../data/memberships'
import styles from './Services.module.css'
import LiquidGlassIos26 from '../components/ui/LiquidGlassIos26'
import InteractiveBackground from '../components/ui/InteractiveBackground'

// Flatten all services into a single array with category info
const allServices = serviceCategories.flatMap(cat =>
  cat.services.map(s => ({ ...s, category: cat.id, categoryName: cat.name }))
)

// Build filter categories from serviceCategories
const filterCategories = serviceCategories.map(cat => ({
  id: cat.id,
  name: cat.name,
}))

function Services() {
  const [activeCategory, setActiveCategory] = useState('all')

  // Make the entire browser body black for this page
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000000'
    return () => {
      document.body.style.backgroundColor = originalBackground
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
      
      {/* HORIZONTAL PILL FILTERS - GLASS DESIGN (identical to Shop) */}
      <nav className={styles.filterContainer}>
        <ul className={styles.filterList}>
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
              Todos
            </LiquidGlassIos26>
          </li>
          {filterCategories.map(cat => (
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
                {cat.name}
              </LiquidGlassIos26>
            </li>
          ))}
        </ul>
      </nav>

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
                  <div className={styles.productCard}>
                    {/* No image — info-only card for services */}
                    <div className={styles.productInfo}>
                      <span className={styles.productBrand}>{service.categoryName}</span>
                      <h4 className={styles.productName}>{service.name}</h4>
                      <p className={styles.serviceDescription}>{service.description}</p>
                      <span className={styles.serviceDuration}>{service.duration}</span>
                      <span className={styles.productPrice}>${service.price.toLocaleString()}</span>
                      
                      <a href="/reservar" className={styles.addToCartBtn} aria-label="Reservar servicio">
                        <span className={styles.btnLabel}>Reservar</span>
                        <div className={styles.btnIconWrapper}>
                           <ArrowRight size={16} strokeWidth={1} />
                        </div>
                      </a>
                    </div>
                  </div>
                </LiquidGlassIos26>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* VIP MEMBERSHIPS SECTION */}
      <section className={styles.membershipsSection}>
        <div className={styles.membershipsContainer}>
          <div className={styles.membershipsHeader}>
            <span className={styles.membershipsSub}>Experiencia Exclusiva</span>
            <h2 className={styles.membershipsTitle}>Planes & Membresías VIP</h2>
          </div>

          <div className={styles.membershipsGrid}>
            {memberships.map((plan) => (
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
