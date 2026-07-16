import { motion } from 'framer-motion';
import styles from './Card.module.css';

/**
 * Tarjeta de servicio/tratamiento con efecto glassmorphism al hacer hover.
 */
const Card = ({
  image,
  title,
  description,
  price,
  duration,
  onClick,
  className = '',
}) => {
  return (
    <motion.article
      className={`${styles.card} ${className}`}
      onClick={onClick}
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Imagen con zoom */}
      <div className={styles.imageWrapper}>
        {image && (
          <img
            src={image}
            alt={title}
            className={styles.image}
            loading="lazy"
          />
        )}
        <div className={styles.overlay} />
      </div>

      {/* Contenido */}
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>

        {description && (
          <p className={styles.description}>{description}</p>
        )}

        {/* Meta: precio y duración */}
        {(price || duration) && (
          <div className={styles.meta}>
            {price && <span className={styles.price}>{price}</span>}
            {duration && (
              <span className={styles.duration}>⏱ {duration}</span>
            )}
          </div>
        )}
      </div>

      {/* Borde dorado glassmorphism al hover */}
      <div className={styles.glassOverlay} />
    </motion.article>
  );
};

export default Card;
