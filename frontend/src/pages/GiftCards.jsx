import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import SectionTitle from '../components/ui/SectionTitle'
import { memberships } from '../data/memberships'
import styles from './GiftCards.module.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1 }
  })
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

const giftCards = [
  { id: 1, name: 'Experiencia Dorada', value: 150000, color: '#D4AF37', description: 'Ideal para un tratamiento especial' },
  { id: 2, name: 'Experiencia Platino', value: 300000, color: '#C0C0C0', description: 'Para un día completo de spa' },
  { id: 3, name: 'Experiencia Suprema', value: 600000, color: '#B8860B', description: 'La experiencia definitiva de lujo' },
]

function GiftCards() {
  return (
    <main className={styles.giftCards}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Regala <span className={styles.accent}>Belleza</span>
          </motion.h1>
          <motion.p className={styles.heroDesc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            El regalo perfecto para las personas más especiales en tu vida
          </motion.p>
        </div>
      </section>

      {/* Gift Cards */}
      <section className={styles.cardsSection}>
        <div className="container">
          <SectionTitle
            subtitle="Tarjetas de Regalo"
            title="Elige el valor de tu experiencia"
            description="Nuestras tarjetas de regalo no expiran y son válidas para cualquier servicio"
          />
          <motion.div
            className={styles.cardsGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {giftCards.map((card, i) => (
              <motion.div
                key={card.id}
                className={styles.giftCard}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -8, rotateY: 5 }}
                style={{ '--card-color': card.color }}
              >
                <div className={styles.giftCardInner}>
                  <div className={styles.giftCardShimmer} />
                  <p className={styles.giftCardBrand}>CATHERYNE RÍOS ESTÉTICA</p>
                  <h3 className={styles.giftCardName}>{card.name}</h3>
                  <p className={styles.giftCardValue}>${card.value.toLocaleString()}</p>
                  <p className={styles.giftCardDesc}>{card.description}</p>
                  <Button variant="outline" size="sm" href="/contacto">
                    Adquirir
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Memberships */}
      <section className={styles.membershipsSection}>
        <div className="container">
          <SectionTitle
            subtitle="Membresías"
            title="Planes exclusivos VIP"
            description="Beneficios permanentes para nuestras clientas más fieles"
            light
          />
          <motion.div
            className={styles.membershipsGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {memberships.map((plan, i) => (
              <motion.div
                key={plan.id}
                className={`${styles.membershipCard} ${plan.popular ? styles.popular : ''}`}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -6 }}
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
                <Button variant={plan.popular ? 'primary' : 'outline'} size="md" href="/contacto">
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

export default GiftCards
