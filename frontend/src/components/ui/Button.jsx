import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LiquidGlassIos26 from './LiquidGlassIos26';
import styles from './Button.module.css';

/**
 * Botón reutilizable con variantes de estilo premium de cristal de 3D.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  className = '',
  ...rest
}) => {
  // Outer element classes (acts as transparent container)
  const outerClasses = [
    styles.buttonWrapper,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Inner glass classes (holds the actual button layout and size padding)
  const glassClasses = [
    styles.button,
    styles[size],
  ]
    .filter(Boolean)
    .join(' ');

  const motionProps = {
    whileHover: { scale: 1.04 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  // Configure glass parameters based on button variants
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  
  // Faint gold tint for primary, silver/transparent for others
  const glassTintOpacity = isPrimary ? 0.08 : 0.002;
  const glassBg = isPrimary 
    ? 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.02) 80%)'
    : null;

  // Text color override for visibility (Gold for primary/outline, Silver for secondary)
  const textColor = isPrimary || isOutline ? 'var(--color-gold)' : 'var(--color-silver-light)';

  const innerStyle = {
    color: textColor,
  };

  const glassContent = (
    <LiquidGlassIos26 
      borderRadius={9999}
      scale={0.05}
      baseFrequency={0.08}
      numOctaves={3}
      centerBlur={2}
      bevelBlur={16}
      bevelWidth={22}
      saturate={200}
      brightness={1.15}
      glassTintOpacity={glassTintOpacity}
      glassBg={glassBg}
      className={glassClasses}
    >
      <span className={styles.content} style={innerStyle}>
        {children}
      </span>
    </LiquidGlassIos26>
  );

  if (href) {
    return (
      <motion.div {...motionProps} className={styles.motionWrapper}>
        <Link to={href} className={outerClasses} {...rest}>
          {glassContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps} className={styles.motionWrapper}>
      <button
        onClick={onClick}
        className={outerClasses}
        {...rest}
      >
        {glassContent}
      </button>
    </motion.div>
  );
};

export default Button;
