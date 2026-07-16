import { motion } from 'framer-motion'
import SectionTitle from '../components/ui/SectionTitle'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { serviceCategories } from '../data/services'
import styles from './Services.module.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

function Services() {
  return (
    <main className={styles.services}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <img src="/images/service_nails.png" alt="" className={styles.heroBg} />
        <div className={styles.heroContent}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p className={styles.heroSub} variants={fadeInUp}>Nuestros Servicios</motion.p>
            <motion.h1 className={styles.heroTitle} variants={fadeInUp}>
              Tratamientos <span className={styles.accent}>Premium</span>
            </motion.h1>
            <motion.p className={styles.heroDesc} variants={fadeInUp}>
              Cada servicio es una experiencia diseñada con los más altos estándares de calidad y exclusividad
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {serviceCategories.map((category, idx) => (
        <section
          key={category.id}
          className={`${styles.categorySection} ${idx % 2 === 1 ? styles.categoryAlt : ''}`}
          id={category.id}
        >
          <div className="container">
            <motion.div
              className={styles.categoryHeader}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div className={styles.categoryImageWrapper} variants={fadeInUp}>
                <img src={category.image} alt={category.name} className={styles.categoryImage} />
              </motion.div>
              <motion.div className={styles.categoryInfo} variants={fadeInUp} custom={1}>
                <SectionTitle
                  subtitle={`Categoría ${String(idx + 1).padStart(2, '0')}`}
                  title={category.name}
                  description={category.description}
                  align="left"
                />
              </motion.div>
            </motion.div>

            <motion.div
              className={styles.servicesList}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
            >
              {category.services.map((service, i) => (
                <motion.div key={service.id} className={styles.serviceItem} variants={fadeInUp} custom={i}>
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceDesc}>{service.description}</p>
                  </div>
                  <div className={styles.serviceMeta}>
                    <span className={styles.serviceDuration}>⏱ {service.duration}</span>
                    <span className={styles.servicePrice}>${service.price.toLocaleString()}</span>
                  </div>
                  <Button variant="outline" size="sm" href="/reservar">Reservar</Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <motion.div
            className={styles.ctaContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className={styles.ctaTitle} variants={fadeInUp}>
              ¿No encuentras lo que buscas?
            </motion.h2>
            <motion.p className={styles.ctaText} variants={fadeInUp}>
              Contáctanos y diseñaremos un tratamiento personalizado especialmente para ti.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button variant="primary" size="lg" href="/contacto">Contáctanos</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default Services
