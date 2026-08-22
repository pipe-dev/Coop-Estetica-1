import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LiquidGlassIos26 from './LiquidGlassIos26';
import styles from './Button.module.css';

/**
 * Botón reutilizable con variantes de estilo premium de cristal de 3D,
 * destellos dorados y animación de pulso guía.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  pulse = false,
  disabled = false,
  onClick,
  href,
  className = '',
  ...rest
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDark = variant === 'dark' || variant === 'black';
  const isSecondary = variant === 'secondary';
  
  const isDisabled = disabled || className.includes(styles.disabled) || className.includes('disabled');
  const shouldPulse = (pulse || isDark) && !isDisabled;

  // Outer element classes (acts as transparent container)
  const outerClasses = [
    styles.buttonWrapper,
    shouldPulse ? styles.pulseWrapper : '',
    isDisabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Inner glass classes (holds the actual button layout and size padding)
  const glassClasses = [
    styles.button,
    styles[size],
    styles[shape],
    styles[variant],
    isDisabled ? styles.disabledGlass : '',
  ]
    .filter(Boolean)
    .join(' ');

  const motionProps = isDisabled ? {} : {
    whileHover: { scale: 1.04 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  // Glass parameters for LiquidGlassIos26
  const isSquare = shape === 'square';
  const glassTintOpacity = isSquare ? 0.002 : (isDisabled ? 0.98 : (isDark ? 0.96 : (isPrimary ? 0.2 : 0.002)));
  const glassBg = isSquare
    ? null
    : (isDisabled 
        ? 'linear-gradient(135deg, #4A4A4A 0%, #363636 100%)'
        : (isDark 
            ? 'linear-gradient(135deg, #0D0D0D 0%, #171717 50%, #0A0A0A 100%)' 
            : (isPrimary ? 'radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.08) 80%)' : null)));

  // Text color override for visibility
  const textColor = isDisabled
    ? '#D4D4D4'
    : (isDark 
        ? '#FEFEFE' 
        : (isPrimary || isOutline ? 'var(--color-gold)' : 'var(--color-silver-light)'));

  const innerStyle = {
    color: textColor,
    fontWeight: '700',
    letterSpacing: isDark || isDisabled ? '0.08em' : '0.06em',
    display: 'flex',
    flexDirection: shape === 'square' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 10
  };

  const currentBorderRadius = shape === 'square' ? 16 : 9999;

  const glassContent = (
    <div className={styles.liquidButtonContainer}>
      {/* Guiding Golden Pulse Aura (only when active/enabled) */}
      {shouldPulse && <div className={styles.goldPulseAura} />}

      <LiquidGlassIos26 
        borderRadius={currentBorderRadius}
        scale={isDisabled ? 0.01 : 0.05}
        baseFrequency={0.08}
        numOctaves={3}
        centerBlur={2}
        bevelBlur={16}
        bevelWidth={22}
        saturate={200}
        brightness={isDisabled ? 1.0 : 1.2}
        glassTintOpacity={glassTintOpacity}
        glassBg={glassBg}
        disableContentFilter={true}
        className={glassClasses}
      >
        {/* Animated Golden Light Shimmer Sweep across the liquid glass */}
        {isDark && !isDisabled && <div className={styles.goldShimmerSweep} />}

        {/* Ambient Gold Edge Glint */}
        {isDark && !isDisabled && <div className={styles.goldEdgeGlint} />}

        <span className={styles.content} style={innerStyle}>
          {children}
        </span>
      </LiquidGlassIos26>
    </div>
  );

  if (href && !isDisabled) {
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
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        className={outerClasses}
        {...rest}
      >
        {glassContent}
      </button>
    </motion.div>
  );
};

export default Button;
