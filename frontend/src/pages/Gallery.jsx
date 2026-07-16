import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionTitle from '../components/ui/SectionTitle'
import styles from './Gallery.module.css'

const images = [
  { id: 1, src: '/images/service_nails.png', category: 'unas', alt: 'Diseño de uñas premium' },
  { id: 2, src: '/images/service_hair.png', category: 'cabello', alt: 'Estilismo capilar' },
  { id: 3, src: '/images/service_facial.png', category: 'rostro', alt: 'Tratamiento facial' },
  { id: 4, src: '/images/service_makeup.png', category: 'maquillaje', alt: 'Maquillaje profesional' },
  { id: 5, src: '/images/service_body.png', category: 'cuerpo', alt: 'Tratamiento corporal' },
  { id: 6, src: '/images/hero_spa_interior.png', category: 'spa', alt: 'Interior del spa' },
]

const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'unas', label: 'Uñas' },
  { id: 'cabello', label: 'Cabello' },
  { id: 'rostro', label: 'Rostro' },
  { id: 'maquillaje', label: 'Maquillaje' },
  { id: 'cuerpo', label: 'Cuerpo' },
  { id: 'spa', label: 'Spa' },
]

function Gallery() {
  const [filter, setFilter] = useState('todos')
  const [lightbox, setLightbox] = useState(null)

  const filtered = filter === 'todos' ? images : images.filter(img => img.category === filter)

  return (
    <main className={styles.gallery}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Nuestra <span className={styles.accent}>Galería</span>
          </motion.h1>
          <motion.p
            className={styles.heroDesc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Inspírate con nuestros trabajos más recientes
          </motion.p>
        </div>
      </section>

      <section className={styles.gallerySection}>
        <div className="container">
          <div className={styles.filters}>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.filterBtn} ${filter === cat.id ? styles.filterActive : ''}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <motion.div className={styles.grid} layout>
            <AnimatePresence mode="popLayout">
              {filtered.map(img => (
                <motion.div
                  key={img.id}
                  className={styles.gridItem}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => setLightbox(img)}
                >
                  <img src={img.src} alt={img.alt} />
                  <div className={styles.gridOverlay}>
                    <span className={styles.gridLabel}>{img.alt}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox.src}
              alt={lightbox.alt}
              className={styles.lightboxImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Gallery
