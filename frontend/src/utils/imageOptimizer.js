/**
 * Utilidad de compresión y optimización de imágenes en el cliente (Browser Canvas API)
 * Convierte fotos pesadas (ej. 12 MB de cámara) a formatos web de alta fidelidad (WebP/JPEG ~150-250 KB)
 * antes de enviarlas al CDN ImgBB.
 */

/**
 * Optimiza y comprime un archivo de imagen en el navegador
 * @param {File|Blob} file - Archivo original
 * @param {Object} options - Opciones de compresión
 * @param {number} options.maxWidth - Ancho máximo permitido (default: 1600px)
 * @param {number} options.maxHeight - Alto máximo permitido (default: 1600px)
 * @param {number} options.quality - Calidad de compresión 0 a 1 (default: 0.82)
 * @param {string} options.mimeType - Formato objetivo (default: 'image/webp')
 * @returns {Promise<{ file: Blob, originalSize: number, optimizedSize: number, savingsPercent: string, width: number, height: number }>}
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/webp'
  } = options

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('El archivo proporcionado no es una imagen válida.')
  }

  // Si es GIF o SVG, no se recomprime para conservar animación / vector
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      savingsPercent: '0%',
      width: 0,
      height: 0
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Error al decodificar la imagen en el navegador.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Redimensionamiento proporcional
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        // Creación del lienzo Canvas con aceleración 2D
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { alpha: true })

        if (!ctx) {
          return reject(new Error('No fue posible inicializar el contexto de renderizado.'))
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Verificación de soporte de WebP
        const targetType = canvas.toDataURL(mimeType).indexOf(`data:${mimeType}`) === 0 
          ? mimeType 
          : 'image/jpeg'

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Error al generar la imagen comprimida.'))
            }

            // Si por alguna razón la compresión resulta más pesada (raro), se conserva el original
            const finalBlob = blob.size < file.size ? blob : file
            const originalBytes = file.size
            const optimizedBytes = finalBlob.size
            const savings = Math.max(0, Math.round(((originalBytes - optimizedBytes) / originalBytes) * 100))

            // Generamos un File con nombre apropiado
            const originalName = file.name || 'image'
            const extension = targetType === 'image/webp' ? '.webp' : '.jpg'
            const newName = originalName.replace(/\.[^/.]+$/, '') + extension
            const optimizedFile = new File([finalBlob], newName, { type: targetType })

            resolve({
              file: optimizedFile,
              originalSize: originalBytes,
              optimizedSize: optimizedBytes,
              savingsPercent: `${savings}%`,
              width,
              height
            })
          },
          targetType,
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Formatea bytes a texto legible (ej. "2.4 MB", "180 KB")
 * @param {number} bytes 
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
