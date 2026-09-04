// S.H.I.E.L.D. Security Framework - Frontend Defense Layer (Pillars 4, 5 & 15)

/**
 * 1. Sanitización de Strings contra Inyección XSS & HTML Bombing (Pillar 4)
 */
export const sanitizeString = (input, maxLength = 500) => {
  if (typeof input !== 'string') return ''
  const clean = input
    .replace(/<[^>]*>/g, '') // Elimina todas las etiquetas HTML
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case "'": return '&#39;'
        case '"': return '&quot;'
        case '&': return '&amp;'
        default: return char
      }
    })
    .trim()
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean
}

/**
 * Sanitización segura para Prompts y Mensajes de Chat / IA
 * Elimina scripts y etiquetas maliciosas sin corromper comillas, apóstrofes o caracteres de formato
 */
export const sanitizeChatText = (input, maxLength = 2000) => {
  if (typeof input !== 'string') return ''
  const clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean
}


/**
 * 2. Rate Limiter en Cliente con Ventana Deslizante (Pillar 5)
 * Bloquea ráfagas de spam antes de que toquen la red.
 */
const writeTimestamps = []
export const isWriteRateLimited = (maxPerMinute = 60) => {
  const now = Date.now()
  // Mantener solo marcas de tiempo del último minuto (60000 ms)
  const recent = writeTimestamps.filter(t => now - t < 60000)
  writeTimestamps.length = 0
  writeTimestamps.push(...recent)

  if (writeTimestamps.length >= maxPerMinute) {
    console.warn('[S.H.I.E.L.D. RATE LIMIT] Operación throttled: Demasiadas solicitudes por minuto.')
    return true
  }
  writeTimestamps.push(now)
  return false
}

/**
 * 3. Cola Asíncrona Secuencial FIFO (Pillar 15 & 13)
 * Serializa mutaciones rápidas evitando colisiones de red, race conditions y ataques de ráfaga.
 */
class MutationQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.minIntervalMs = 60 // 60ms de intervalo de seguridad entre mutaciones
  }

  enqueue(task) {
    this.queue.push(task)
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }
    this.isProcessing = true
    const currentTask = this.queue.shift()
    if (currentTask) {
      try {
        await currentTask()
      } catch (err) {
        console.error('[S.H.I.E.L.D. MUTATION QUEUE ERROR]', err)
      }
    }
    setTimeout(() => this.processQueue(), this.minIntervalMs)
  }
}

export const mutationQueue = new MutationQueue()
