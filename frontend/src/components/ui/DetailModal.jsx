import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Clock, Check, ShoppingBag, Calendar } from 'lucide-react'
import LiquidGlassIos26 from './LiquidGlassIos26'
import ProgressiveImage from './ProgressiveImage'
import styles from './DetailModal.module.css'

export const DetailModal = ({ item, type = 'product', onClose, onAction }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!item) return null

  const isService = type === 'service'
  const whatsappText = encodeURIComponent(
    `Hola, me interesa obtener más información sobre ${isService ? 'el servicio' : 'el producto'} "${item.name}".`
  )
  const whatsappUrl = `https://wa.me/573000000000?text=${whatsappText}`

  return (
    <AnimatePresence>
      <div className={styles.backdrop} onClick={onClose}>
        <motion.div 
          className={styles.modalContainer}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <LiquidGlassIos26
            className={styles.modalGlass}
            tint="dark"
            disableContentFilter={true}
            contentPadding={0}
            borderRadius={28}
            centerBlur={32}
            bevelBlur={40}
            glassBg="rgba(10, 10, 10, 0.92)"
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar ventana">
              <X size={20} />
            </button>

            <div className={styles.modalGrid}>
              {/* Media Section */}
              <div className={styles.mediaSection}>
                {item.image ? (
                  <ProgressiveImage
                    src={item.image}
                    placeholderSrc={item.image}
                    alt={item.name}
                    className={styles.modalImage}
                  />
                ) : (
                  <div className={styles.placeholderMedia}>
                    <span>{item.categoryName || item.brand}</span>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className={styles.infoSection}>
                <div className={styles.headerBadge}>
                  {item.isBestseller && <span className={styles.bestsellerTag}>Más Vendido</span>}
                  {item.isNew && <span className={styles.newTag}>Nuevo</span>}
                </div>

                <h2 className={styles.title}>{item.name}</h2>

                {/* Rating or Duration */}
                <div className={styles.metaRow}>
                  {isService ? (
                    <div className={styles.durationBadge}>
                      <Clock size={15} />
                      <span>{item.duration || '60 min'}</span>
                    </div>
                  ) : (
                    <div className={styles.ratingBadge}>
                      <Star size={15} fill="#ffffff" color="#ffffff" />
                      <span className={styles.ratingValue}>{item.rating || '4.9'}</span>
                      <span className={styles.reviewsCount}>({item.reviews || 80} opiniones)</span>
                    </div>
                  )}
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.price}>{item.price?.toLocaleString()}</span>
                  <span className={styles.currencyCode}>COP</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.descriptionBox}>
                  <h4 className={styles.sectionLabel}>Descripción & Experiencia</h4>
                  <p className={styles.descriptionText}>
                    {item.description || 'Disfruta de una experiencia revitalizante diseñada bajo los más altos estándares de belleza y bienestar.'}
                  </p>
                </div>

                {/* Key Benefits */}
                <div className={styles.benefitsBox}>
                  <h4 className={styles.sectionLabel}>Beneficios Clave</h4>
                  <ul className={styles.benefitsList}>
                    <li>
                      <div className={styles.checkBadge}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{isService ? 'Atención personalizada por especialistas' : 'Ingredientes de grado médico e hipoalergénicos'}</span>
                    </li>
                    <li>
                      <div className={styles.checkBadge}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{isService ? 'Resultados visibles desde la primera sesión' : 'Resultados comprobados y dermatológicamente probados'}</span>
                    </li>
                    <li>
                      <div className={styles.checkBadge}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{isService ? 'Ambiente relajante y privado' : 'Fórmula de rápida absorción sin sensación grasa'}</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Action Bar */}
                <div className={styles.actionRow}>
                  <button 
                    className={styles.mainCtaBtn}
                    onClick={() => {
                      if (onAction) onAction(item)
                      onClose()
                    }}
                  >
                    {isService ? <Calendar size={18} /> : <ShoppingBag size={18} />}
                    <span>{isService ? 'Reservar Cita Ahora' : 'Añadir al Carrito'}</span>
                  </button>
                </div>
              </div>
            </div>
          </LiquidGlassIos26>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default DetailModal
