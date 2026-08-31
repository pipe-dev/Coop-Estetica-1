import { optimizeImage } from '../utils/imageOptimizer'

// Servicio de subida de imágenes a CDN ImgBB a costo $0 USD con optimización previa en el navegador
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '0cf90d5a67dd8428425edb09c33b970f'

/**
 * Optimiza la imagen en el cliente (redimensiona y convierte a WebP de alta fidelidad)
 * y la sube al CDN ImgBB.
 * 
 * @param {File|Blob} file - Archivo de imagen original seleccionado desde cámara o dispositivo
 * @param {Object} options - Opciones opcionales de optimización
 * @returns {Promise<{ url: string, originalSize: number, optimizedSize: number, savingsPercent: string }>}
 */
export async function uploadToImgBB(file, options = {}) {
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo de imagen.')
  }

  // 1. Optimización y compresión previa en el navegador
  let payloadFile = file
  let optimizationStats = {
    originalSize: file.size,
    optimizedSize: file.size,
    savingsPercent: '0%'
  }

  try {
    const optimized = await optimizeImage(file, {
      maxWidth: options.maxWidth || 1600,
      maxHeight: options.maxHeight || 1600,
      quality: options.quality || 0.82,
      mimeType: options.mimeType || 'image/webp'
    })
    payloadFile = optimized.file
    optimizationStats = {
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      savingsPercent: optimized.savingsPercent
    }
  } catch (optError) {
    console.warn('Advertencia: No se pudo pre-optimizar la imagen en el navegador, enviando original:', optError)
    payloadFile = file
  }

  // 2. Validación de tamaño (máximo 32 MB en ImgBB)
  const maxSize = 32 * 1024 * 1024
  if (payloadFile.size > maxSize) {
    throw new Error('La imagen excede el tamaño máximo permitido de 32 MB.')
  }

  const formData = new FormData()
  formData.append('image', payloadFile)

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || 'Error al subir la imagen a ImgBB.')
    }

    const result = await response.json()
    const cdnUrl = result.data.url || result.data.display_url

    return {
      url: cdnUrl,
      ...optimizationStats
    }
  } catch (error) {
    console.error('Error en uploadToImgBB:', error)
    throw new Error(error.message || 'No fue posible subir la imagen. Por favor verifica tu conexión a internet.')
  }
}
