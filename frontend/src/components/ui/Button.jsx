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
  shape = 'pill',
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
    styles[shape],
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
  
  // Smoky black glass removed. Square buttons now use transparent glass identical to the navbar.
  const isSquare = shape === 'square';
  const glassTintOpacity = isSquare ? 0.002 : (isPrimary ? 0.08 : 0.002);
  const glassBg = isSquare
    ? null
    : (isPrimary ? 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.02) 80%)' : null);

  // Text color override for visibility (Gold for primary/outline, Silver for secondary)
  const textColor = isPrimary || isOutline ? 'var(--color-gold)' : 'var(--color-silver-light)';

  const innerStyle = {
    color: textColor,
    display: shape === 'square' ? 'flex' : 'block',
    flexDirection: shape === 'square' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  };

  const currentBorderRadius = shape === 'square' ? 16 : 9999;

  const glassContent = (
    <LiquidGlassIos26 
      borderRadius={currentBorderRadius}
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
