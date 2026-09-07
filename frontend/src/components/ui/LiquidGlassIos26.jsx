import React from 'react'

/**
 * LiquidGlassIos26 — Componente de Cristal Líquido estilo iOS Ultra-Optimizado.
 * Optimizado para 60/120 FPS en dispositivos de gama baja sin pérdida de calidad visual.
 * Elimina distorsiones SVG sobre iconos y texto manteniendo una refracción y brillo limpios por GPU.
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
  const effectiveBg = glassBg || `rgba(255, 255, 255, ${glassTintOpacity})`

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
        ...style
      }}
    >
      {/* CAPA 1: SUPERFICIE DE CRISTAL LÍQUIDO ULTRA-FLUIDA (GPU NATIVA) */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          background: effectiveBg,
          backdropFilter: `blur(${bevelBlur || 16}px) saturate(${saturate || 180}%) brightness(${brightness || 1.1})`,
          WebkitBackdropFilter: `blur(${bevelBlur || 16}px) saturate(${saturate || 180}%) brightness(${brightness || 1.1})`,
        }}
      />

      {/* CAPA 2: BISEL Y LUZ ESPECULAR DE ALTA DEFINICIÓN */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.3)',
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
