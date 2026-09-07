import React from 'react'
import { deviceCapability } from '../../utils/deviceCapability'

const { isLowEnd } = deviceCapability

/**
 * LiquidGlassIos26 — Componente de Cristal Líquido estilo iOS Ultra-Optimizado.
 * Adaptativo para 60/120 FPS en dispositivos de gama ultra-baja sin pérdida de legibilidad ni estética.
 */
export const LiquidGlassIos26 = ({ 
  children, 
  borderRadius = 48, 
  className = '',
  centerBlur = 16,
  bevelBlur = 18,
  saturate = 180,
  brightness = 1.12,
  glassTintOpacity = 0.08,
  glassBg = null,
  contentPadding = 4,
  style = {}
}) => {
  // En gama ultra-baja: usamos fondo semiopaco de alta gama y blur mínimo (4px) para ahorrar fillrate en GPU Mali/Adreno
  const effectiveBlur = isLowEnd ? 4 : (bevelBlur || 16)
  const effectiveBg = glassBg || (isLowEnd ? 'rgba(18, 18, 18, 0.86)' : `rgba(255, 255, 255, ${glassTintOpacity})`)

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        ...style
      }}
    >
      {/* CAPA 1: SUPERFICIE DE CRISTAL LÍQUIDO ULTRA-FLUIDA (GPU NATIVA ADAPTATIVA) */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          background: effectiveBg,
          backdropFilter: `blur(${effectiveBlur}px) saturate(${isLowEnd ? 120 : saturate}%) brightness(${brightness})`,
          WebkitBackdropFilter: `blur(${effectiveBlur}px) saturate(${isLowEnd ? 120 : saturate}%) brightness(${brightness})`,
        }}
      />

      {/* CAPA 2: BISEL Y LUZ ESPECULAR LIGERA */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: isLowEnd 
            ? '0 4px 16px 0 rgba(0, 0, 0, 0.3)' 
            : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(0, 0, 0, 0.08) 100%)'
        }}
      />

      {/* CAPA 3: CONTENIDO NÍTIDO 100% SIN DISTORSIÓN DE ICONOS O TIPOGRAFÍA */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          padding: `${contentPadding}px`,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default LiquidGlassIos26
