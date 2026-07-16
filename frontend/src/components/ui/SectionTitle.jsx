import { motion } from 'framer-motion';
import styles from './SectionTitle.module.css';

/**
 * Título de sección con subtítulo, línea decorativa dorada y animación de entrada.
 */
const SectionTitle = ({
  subtitle,
  title,
  description,
  align = 'center',
  light = false,
}) => {
  const wrapperClasses = [
    styles.wrapper,
    styles[align],
    light ? styles.light : '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.15,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className={wrapperClasses}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {subtitle && (
        <motion.span className={styles.subtitle} variants={childVariants}>
          {subtitle}
        </motion.span>
      )}

      <motion.div className={styles.line} variants={childVariants} />

      <motion.h2 className={styles.title} variants={childVariants}>
        {title}
      </motion.h2>

      {description && (
        <motion.p className={styles.description} variants={childVariants}>
          {description}
        </motion.p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
