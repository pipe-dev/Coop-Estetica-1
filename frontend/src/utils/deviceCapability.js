/**
 * Device Capability Detector
 * Identifica dispositivos de gama ultra-baja (<=3GB RAM, <=4 núcleos, conexiones 2G/3G o ahorro de datos)
 * para adaptar canvas, efectos visuales y uso de memoria en tiempo real.
 */

export function getDeviceCapability() {
  if (typeof window === 'undefined') {
    return {
      isLowEnd: false,
      maxDpr: 1.5,
      maxCanvasFrames: 75,
      canvasStep: 1,
      blurLevel: 'high',
      isSaveData: false
    };
  }

  const nav = window.navigator || {};
  const memory = nav.deviceMemory || 4; // En GB (Chromium reporta 0.25, 0.5, 1, 2, 4, 8)
  const cores = nav.hardwareConcurrency || 4;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  const isSaveData = Boolean(conn?.saveData);
  const isSlowNetwork = Boolean(conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.effectiveType === '3g'));
  const isMobile = window.innerWidth <= 768;

  // Criterio de gama ultra baja:
  // 1. Memoria RAM reportada <= 3GB
  // 2. O procesador con 4 núcleos o menos en móvil
  // 3. O modo ahorro de datos activo o red 2G/3G
  const isLowEnd = (memory <= 3) || (cores <= 4 && isMobile) || isSaveData || isSlowNetwork;

  return {
    isLowEnd,
    memory,
    cores,
    isSaveData,
    isSlowNetwork,
    // Limitar DPR a 1.0 en gama baja para no saturar memoria GPU de texturas
    maxDpr: isLowEnd ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35),
    // 25 fotogramas en gama baja (1/3 de RAM y datos) vs 75 en gama alta
    maxCanvasFrames: isLowEnd ? 25 : 75,
    canvasStep: isLowEnd ? 3 : 1,
    blurLevel: isLowEnd ? 'low' : 'high'
  };
}

export const deviceCapability = getDeviceCapability();
export default deviceCapability;
