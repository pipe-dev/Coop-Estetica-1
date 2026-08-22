import React, { useId } from 'react'

// The ultra-optimized WebP normal map for realistic glass edge refraction/magnification
const WEBP_DISPLACEMENT_MAP = "data:image/webp;base64,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 BRPUgOo6nklsaa3T8bJR8sC1Bh4OJ9is/aAD";

export const LiquidGlassIos26 = ({ 
  children, 
  borderRadius = 48, 
  className = '',
  scale = 0.05,            // Strength of distortion/magnification/inversion
  baseFrequency = 0.08,    // High value (0.08+) for crystal shards, low value (0.015) for smooth ripples
  numOctaves = 3,          // Noise complexity (1-5)
  centerBlur = 2,          // Transparency blur in the middle (px)
  bevelBlur = 16,          // Edge glass thickness blur (px)
  bevelWidth = 22,         // Width of the edge transition zone (px)
  saturate = 200,          // Edge color saturation (%)
  brightness = 1.15,       // Edge brightness boost
  glassTintOpacity = 0.002, // Base color tint (white opacity)
  glassBg = null,          // Custom background (e.g. radial-gradient)
  disableContentFilter = false, // Optimization for grids: disable text refraction
  contentPadding = 6       // Padding inside the glass content layer
}) => {
  const filterId = useId().replace(/:/g, "");
  
  // Resolve current route pathname to prevent relative URL breaks in filters (React Router bug fix)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
  const filterUrl = `${currentPath}#liquid-glass-${filterId}`;

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        transform: 'translateZ(0)', // Force GPU layering
        willChange: 'transform',
      }}
    >
      {/* 
        GUARANTEED SVG FILTER FOR PHYSICAL REFRACTION & RIPPLE
        To prevent Chrome/Firefox from optimizing out this filter, the <svg> element
        is rendered with 1px dimensions and 0.01 opacity, keeping it fully active in the DOM.
      */}
      <svg 
        style={{ 
          position: 'absolute', 
          width: '1px', 
          height: '1px', 
          opacity: 0.01, 
          pointerEvents: 'none', 
          overflow: 'hidden',
          zIndex: -100 
        }} 
        aria-hidden="true"
      >
        <filter id={`liquid-glass-${filterId}`} primitiveUnits="objectBoundingBox" x="-20%" y="-20%" width="140%" height="140%">
          {/* 1. Normal Map (WebP) for the magnifying edge glass refraction */}
          <feImage 
            result="edgeMap" 
            width="100%" 
            height="100%" 
            x="0" 
            y="0" 
            href={WEBP_DISPLACEMENT_MAP} 
            preserveAspectRatio="none" 
          />
          {/* 2. Turbulence noise to simulate the wavy/crystal ripple effect */}
          <feTurbulence type="fractalNoise" baseFrequency={baseFrequency} numOctaves={numOctaves} result="rippleNoise" />
          {/* Normalize and isolate noise color channels */}
          <feColorMatrix type="matrix" values="1 0 0 0 0.5  0 1 0 0 0.5  0 0 1 0 0  0 0 0 0.3 0" in="rippleNoise" result="softRipple" />
          {/* 3. Blend edge displacement with ripple noise */}
          <feBlend mode="overlay" in="edgeMap" in2="softRipple" result="combinedMap" />
          
          {/* 4. Displace backdrop pixels dynamically */}
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="combinedMap" 
            scale={scale} 
            xChannelSelector="R" 
            yChannelSelector="G" 
          />
        </filter>
      </svg>

      {/* DEFENSIVE CSS INJECTION TO PROVIDE CROSS-BROWSER FALLBACKS */}
      <style>{`
        .glass-base-${filterId} {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          pointer-events: none;
          background: ${glassBg || `rgba(255, 255, 255, ${glassTintOpacity})`};
          
          /* Safe fallback */
          backdrop-filter: blur(${centerBlur}px) saturate(100%);
          -webkit-backdrop-filter: blur(${centerBlur}px) saturate(100%);
          
          /* Apply the prism ripple to the whole navbar background */
          backdrop-filter: blur(${centerBlur}px) url(${filterUrl}) saturate(100%);
          -webkit-backdrop-filter: blur(${centerBlur}px) url(${filterUrl}) saturate(100%);
        }

        .glass-bevel-${filterId} {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 15;
          pointer-events: none;
          
          /* Two fading gradients composited to create a smooth transition from edge to center */
          -webkit-mask-image: 
            linear-gradient(to bottom, #000 0%, rgba(0,0,0,0) ${bevelWidth}px, rgba(0,0,0,0) calc(100% - ${bevelWidth}px), #000 100%),
            linear-gradient(to right, #000 0%, rgba(0,0,0,0) ${bevelWidth}px, rgba(0,0,0,0) calc(100% - ${bevelWidth}px), #000 100%);
          -webkit-mask-composite: source-over;
          mask-composite: add;
          
          /* Softer edge shadow that blends naturally */
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3);
          
          /* Standard CSS Bevel fallback */
          backdrop-filter: blur(${bevelBlur}px) saturate(${saturate}%) brightness(${brightness});
          -webkit-backdrop-filter: blur(${bevelBlur}px) saturate(${saturate}%) brightness(${brightness});
          
          /* SVG Refraction application (Falls back if unsupported) */
          backdrop-filter: blur(${bevelBlur}px) url(${filterUrl}) saturate(${saturate}%) brightness(${brightness});
          -webkit-backdrop-filter: blur(${bevelBlur}px) url(${filterUrl}) saturate(${saturate}%) brightness(${brightness});
        }

        .glass-lighting-${filterId} {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 20;
          pointer-events: none;
          
          /* Softer 3D specularity borders */
          box-shadow: 
            inset 0 0 0 1px rgba(255, 255, 255, 0.15),
            inset 0 2px 3px -1px rgba(255, 255, 255, 0.5), 
            inset 2px 0px 3px -1px rgba(255, 255, 255, 0.4), 
            inset 0 -2px 3px -1px rgba(0, 0, 0, 0.4), 
            inset -2px 0px 3px -1px rgba(0, 0, 0, 0.2);
          background-image: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.04) 100%);
        }

        .glass-content-${filterId} {
          position: relative;
          z-index: 5;
          width: 100%;
          height: 100%;
          padding: ${contentPadding}px;
          
          /* SVG mirror distortion applied to text */
          ${disableContentFilter ? '' : `
          filter: url(${filterUrl});
          -webkit-filter: url(${filterUrl});
          `}
        }
      `}</style>

      {/* LAYER 1: BASE SURFACE */}
      <div 
        className={`glass-base-${filterId}`}
        style={{ borderRadius: 'inherit' }}
      />

      {/* LAYER 2: SINGLE UNIFIED BEVEL EDGE */}
      <div 
        className={`glass-bevel-${filterId}`}
        style={{ borderRadius: 'inherit' }}
      />

      {/* LAYER 3: 3D LIGHTING & SPECULAR SHARP HIGHLIGHTS */}
      <div 
        className={`glass-lighting-${filterId}`}
        style={{ borderRadius: 'inherit' }}
      />
      
      {/* Content Layer (Flipped/refracted text) */}
      <div className={`glass-content-${filterId}`}>
        {children}
      </div>
    </div>
  )
}

export default LiquidGlassIos26
