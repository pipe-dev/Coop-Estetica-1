import React from 'react'
import { motion } from 'framer-motion'
import SectionTitle from '../components/ui/SectionTitle'
import Button from '../components/ui/Button'
import GiftCardCustomizer from '../components/ui/GiftCardCustomizer'
import { memberships } from '../data/memberships'
import styles from './GiftCards.module.css'

function GiftCards() {
  return (
    <main className={styles.giftCards}>
      {/* HERO BANNER */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Personaliza tu <span className={styles.accent}>Bono de Regalo</span>
          </motion.h1>
          <motion.p className={styles.heroDesc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Diseña una tarjeta digital dorada para regalar una experiencia inolvidable de belleza y estética integral
          </motion.p>
        </div>
      </section>

      {/* LIVE 3D CUSTOMIZER SECTION */}
      <section className={styles.customizerSection}>
        <div className="container">
          <GiftCardCustomizer showTitle={true} />
        </div>
      </section>

      {/* MEMBERSHIPS SECTION */}
      <section className={styles.membershipsSection}>
        <div className="container">
          <SectionTitle
            subtitle="Membresías"
            title="Planes exclusivos VIP"
            description="Beneficios permanentes para nuestras clientas más fieles"
            light
          />
          <div className={styles.membershipsGrid}>
            {memberships.map((plan, i) => (
              <div
                key={plan.id}
                className={`${styles.membershipCard} ${plan.popular ? styles.popular : ''}`}
              >
                {plan.popular && <div className={styles.popularBadge}>Más Popular</div>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>{plan.price.toLocaleString()}</span>
                  <span className={styles.period}>/mes</span>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f, j) => (
                    <li key={j}><span className={styles.check}>✦</span> {f}</li>
                  ))}
                </ul>
                <Button variant={plan.popular ? 'primary' : 'outline'} size="md" href="https://wa.me/573006269056?text=Hola,%20quisiera%20informaci%C3%B3n%20sobre%20las%20Membres%C3%ADas%20VIP">
                  Elegir Plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default GiftCards
