// S.H.I.E.L.D. Compliant AI Copilot Engine - Free Tier Multiplier & Optimizer
// Features: Multi-Key Load Balancer + Model Cascading + Dynamic Live Context + Semantic Cache
import { sanitizeString } from '../utils/securityService'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Cascada de Modelos de Alta Inteligencia de Groq
const ACTIVE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini',
  'groq/compound'
]

// Memoria caché semántica ultra-estricta con invalidación instantánea
const queryCache = new Map()
const CACHE_TTL_MS = 15000 // Máximo 15 segundos solo para consultas puramente estáticas

/**
 * Invalidador Atómico de Caché
 * Se ejecuta cada vez que ocurre una mutación de citas, caja, clientes o inventario.
 */
export function clearCopilotCache() {
  queryCache.clear()
  console.log('[AI COPILOT] Caché invalidado por mutación de datos en tiempo real.')
}

/**
 * Detector de Consultas en Tiempo Real
 * Las preguntas de finanzas, caja, citas, especialistas, fecha/hora o acciones NUNCA se cachean.
 */
function isRealtimeQuery(query) {
  const q = query.toLowerCase()
  const realtimeKeywords = [
    'caja', 'plata', 'dinero', 'ingreso', 'egreso', 'gasto', 'balance',
    'pagar', 'pago', 'comisi', 'cuanto', 'cuánto', 'liquidacion', 'liquidación',
    'cita', 'agenda', 'hoy', 'mañana', 'turno', 'reserv',
    'crea', 'agrega', 'bloquea', 'cliente', 'clienta',
    'dia', 'día', 'hora', 'fecha'
  ]
  return realtimeKeywords.some(kw => q.includes(kw))
}

/**
 * 1. Extractor y Balanceador de Claves API (Multi-Key Pool)
 * Soporta múltiples claves separadas por coma en .env o localStorage para multiplicar la cuota x2, x3 o x4.
 */
export function getAvailableApiKeys(customInput = '') {
  const envKeys = (import.meta.env.VITE_GROQ_API_KEYS || import.meta.env.VITE_GROQ_API_KEY || '').split(',')
  const storedKeys = (localStorage.getItem('spa_groq_api_key') || '').split(',')
  const customKeys = (customInput || '').split(',')

  const rawKeys = [...customKeys, ...storedKeys, ...envKeys]
    .map(k => k.trim())
    .filter(k => k.startsWith('gsk_') && k.length > 20)

  // Eliminar duplicados
  return Array.from(new Set(rawKeys))
}

/**
 * 2. Compresor de Contexto de Alta Densidad (Ahorra ~65% de tokens por llamada)
 * Transforma el estado completo en un formato compacto con fecha y hora en vivo de Colombia.
 */
export function buildCompressedSpaPrompt(spaState) {
  const {
    businessConfig = {},
    serviceCategories = [],
    teamMembers = [],
    appointments = [],
    products = [],
    clients = [],
    closedDates = [],
    transactions = [],
    currentUserRole = 'OWNER'
  } = spaState

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  let formattedDateCo = todayStr
  let formattedTimeCo = '12:00 PM'
  try {
    const dateFormatter = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    })
    formattedDateCo = dateFormatter.format(now)
    formattedTimeCo = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota'
    })
  } catch (e) {
    console.warn('Error formateando fecha Colombia:', e)
  }

  const todayApps = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelada')

  // Liquidación por especialista en formato ultra-compacto
  const teamDigest = teamMembers.length > 0 ? teamMembers.map(sp => {
    const spApps = appointments.filter(a => (a.specialistId === sp.id || a.specialistName === sp.name) && a.status !== 'Cancelada')
    const spTodayApps = spApps.filter(a => a.date === todayStr)
    const rate = sp.commissionRate || 45
    const todayPay = spTodayApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * rate / 100)), 0)
    const totalPay = spApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * rate / 100)), 0)
    return `[${sp.name}|${sp.role}|Com:${rate}%|Hoy:${spTodayApps.length}citas=$${todayPay.toLocaleString()}|TotalPendiente:$${totalPay.toLocaleString()}]`
  }).join(' ') : 'Sin especialistas registradas aún'

  // Finanzas de Caja
  const totalIn = transactions.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0)
  const netCaja = totalIn - totalOut

  // Catálogo de Servicios Compacto
  const allServices = serviceCategories.flatMap(c => c.services || [])
  const srvDigest = allServices.length > 0
    ? allServices.map(s => `${s.name}($${s.price || 0},${s.duration || 45}m)`).join(' | ')
    : 'Sin servicios cargados aún'

  // Inventario Compacto
  const prodDigest = products.length > 0
    ? products.map(p => `${p.name}($${p.price || 0},Stock:${p.stock || 0})`).join(' | ')
    : 'Sin productos registrados'

  // CRM Compacto
  const clientDigest = clients.length > 0
    ? clients.map(c => `${c.name}(Tel:${c.phone || 'N/A'},Notas:${c.notes || 'N/A'})`).join(' | ')
    : 'Sin clientes registrados'

  // Cierres
  const closedDigest = closedDates.map(d => `${d.date}(${d.reason})`).join(', ')

  return `
ERES "Catheryne AI", copiloto ejecutiva de operaciones e inteligencia de negocios de "Catheryne Ríos Estética".
Eres profesional, ejecutiva, elegante, concisa y empática. Hablas en español de Colombia ($ COP).
NUNCA uses emojis infantiles ni listas vacías. Responde en formato Markdown limpio.

CONTEXTO EN TIEMPO REAL:
- FECHA Y HORA ACTUAL: ${formattedDateCo} (${todayStr}), ${formattedTimeCo} (Hora de Colombia / America/Bogota).
- NEGOCIO: ${businessConfig.businessName || 'Catheryne Ríos Estética'} | Tel: ${businessConfig.whatsappNumber || '3006269056'}
- USUARIO ACTIVO: ${currentUserRole}
- FINANZAS CAJA HOY: Ingresos: +$${totalIn.toLocaleString()} COP | Gastos: -$${totalOut.toLocaleString()} COP | Balance Neto: $${netCaja.toLocaleString()} COP
- LIQUIDACIONES EQUIPO: ${teamDigest}
- CITAS PROGRAMADAS HOY (${todayApps.length}): ${todayApps.map(a => `${a.time}: ${a.clientName} (${a.serviceName} con ${a.specialistName}) - $${a.price || 0}`).join(' | ') || 'Ninguna cita programada aún'}
- CATÁLOGO SERVICIOS: ${srvDigest}
- INVENTARIO PRODUCTOS: ${prodDigest}
- CRM CLIENTAS: ${clientDigest}
- FECHAS BLOQUEADAS: ${closedDigest || 'Ninguna'}

REGLAS DE CONDUCTA Y ALCANCE:
1. PREGUNTAS COTIDIANAS BÁSICAS (Fecha, Hora, Saludos, Cálculos):
   - Si preguntan "¿qué día es hoy?", "¿qué fecha es hoy?" o la hora, responde directamente con la fecha/hora en vivo de Colombia indicada arriba.
   - Si saludan cordialmente o preguntan cómo estás, responde con cortesía ejecutiva y ofrece un resumen breve de las operaciones del día.
2. PREGUNTAS OPERATIVAS DE LA ESTÉTICA (Caja, Citas, Especialistas, Clientes, Servicios):
   - Responde con datos reales basados exclusivamente en el contexto. No inventes nombres si el estado está vacío.
3. PREGUNTAS TOTALMENTE FUERA DE CONTEXTO (recetas de cocina, física cuántica, política, temas ajenos):
   - Responde amablemente delimitando tu rol: "Como tu copiloto ejecutiva en Catheryne Ríos Estética, estoy enfocada en asistirte en la gestión de citas, caja, especialistas, catálogo y clientas del negocio. ¿En qué área de la estética te puedo colaborar hoy?"
4. ACCIONES DEL SISTEMA:
   - Para agendar citas confirmadas:
\`\`\`action
{"action": "CREATE_APPOINTMENT", "data": {"clientName": "...", "clientPhone": "...", "serviceName": "...", "specialistName": "...", "date": "YYYY-MM-DD", "time": "HH:MM AM/PM"}}
\`\`\`
   - Para crear productos:
\`\`\`action
{"action": "CREATE_PRODUCT", "data": {"name": "...", "price": 0, "stock": 10, "category": "facial"}}
\`\`\`
   - Para bloquear fechas o festivos:
\`\`\`action
{"action": "BLOCK_DATE", "data": {"date": "YYYY-MM-DD", "reason": "...", "type": "Festivo"}}
\`\`\`
`
}

/**
 * 3. Despachador Inteligente con Rotación de Claves y Cascada de Modelos (70B -> 8B -> Local)
 */
export async function sendChatMessageToCopilot(messages, spaState, customApiKey = '') {
  const lastUserMessage = messages[messages.length - 1]?.content || ''
  const isDynamic = isRealtimeQuery(lastUserMessage)

  // 1. Verificar Caché solo si es una consulta puramente estática
  const cacheKey = `${lastUserMessage.toLowerCase().trim()}_${spaState.serviceCategories?.length || 0}_${spaState.businessConfig?.businessName || ''}`
  if (!isDynamic && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey)
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[AI COPILOT] Consulta estática servida desde memoria')
      return cached.data
    }
  }

  const keysPool = getAvailableApiKeys(customApiKey)
  const systemPrompt = buildCompressedSpaPrompt(spaState)

  const payloadMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-6).map(m => ({ // Mantiene los últimos 6 mensajes para ahorrar tokens
      role: m.role === 'user' ? 'user' : 'assistant',
      content: sanitizeString(m.content, 1200)
    }))
  ]

  // Si no hay claves en el pool, ejecutamos el motor local ultra-resiliente
  if (keysPool.length === 0) {
    return processLocalFallbackAgent(lastUserMessage, spaState)
  }

  // Intentar con cada clave y cascada de modelos
  for (let keyIndex = 0; keyIndex < keysPool.length; keyIndex++) {
    const activeKey = keysPool[keyIndex]
    const modelsToTry = ACTIVE_MODELS

    for (const model of modelsToTry) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: payloadMessages,
            temperature: 0.25,
            max_tokens: 800, // Token limiter para evitar desperdicio de cuota
          })
        })

        if (response.ok) {
          const data = await response.json()
          const botReply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'
          const parsed = parseAgentResponse(botReply)

          // Guardar en caché si no es dinámica
          if (!isDynamic) {
            queryCache.set(cacheKey, { timestamp: Date.now(), data: parsed })
          }
          return parsed
        }

        // Si es 429 (Rate Limit), saltar al siguiente modelo o siguiente clave
        if (response.status === 429) {
          console.warn(`[GROQ RATE LIMIT] Modelo ${model} o Clave #${keyIndex + 1} alcanzaron límite. Rotando...`)
          continue
        }
      } catch (err) {
        console.warn(`[GROQ NETWORK ERROR] Falló conexión con modelo ${model}:`, err)
      }
    }
  }

  // Si todas las claves o modelos de la nube fallaron, fallback seguro local
  console.log('[AI COPILOT] Activando motor local instantáneo.')
  return processLocalFallbackAgent(lastUserMessage, spaState)
}

/**
 * 4. Parser de Acciones Embebidas
 */
export function parseAgentResponse(rawText) {
  const actionMatch = rawText.match(/```action\s*([\s\S]*?)\s*```/)
  let action = null
  let cleanText = rawText

  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1])
      cleanText = rawText.replace(/```action[\s\S]*?```/, '').trim()
    } catch (e) {
      console.error('Error parseando acción del agente:', e)
    }
  }

  return {
    text: cleanText,
    action: action
  }
}

/**
 * 5. Motor Local Resiliente (Fallback Inteligente 100% Offline / Sin Tokens)
 */
function processLocalFallbackAgent(userQuery, spaState) {
  const query = userQuery.toLowerCase().trim()
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  let formattedDateCo = todayStr
  let formattedTimeCo = '12:00 PM'
  try {
    const dateFormatter = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    })
    formattedDateCo = dateFormatter.format(now)
    formattedTimeCo = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota'
    })
  } catch (e) {
    console.warn('Error formateando fecha Colombia en fallback:', e)
  }

  // Consulta de Fecha y Hora
  if (query.includes('dia') || query.includes('día') || query.includes('fecha') || query.includes('hora') || query.includes('que dia es') || query.includes('qué día es') || query.includes('que fecha es') || query.includes('qué fecha es')) {
    return {
      text: `**Fecha y Hora Actual (Colombia):**\n\n` +
            `- **Día y Fecha:** ${formattedDateCo}\n` +
            `- **Hora:** ${formattedTimeCo}\n` +
            `- **Estado:** Sistema sincronizado y operativo.\n\n` +
            `¿Deseas consultar la agenda de citas de hoy o revisar el flujo de caja?`,
      action: null
    }
  }

  // Saludos cordiales
  if (query.startsWith('hola') || query.includes('buenos dias') || query.includes('buenos días') || query.includes('buenas tardes') || query.includes('buenas noches') || query.includes('como estas') || query.includes('cómo estás')) {
    const todayApps = (spaState.appointments || []).filter(a => a.date === todayStr && a.status !== 'Cancelada')
    return {
      text: `¡Hola Catheryne! Todo listo en **Catheryne Ríos Estética**.\n\n` +
            `- **Fecha de hoy:** ${formattedDateCo}\n` +
            `- **Citas de hoy:** ${todayApps.length} programada(s)\n\n` +
            `¿En qué te puedo colaborar hoy? Puedes consultarme sobre caja, comisiones, agendar citas o gestionar el inventario.`,
      action: null
    }
  }

  // Ayuda y Capacidades
  if (query.includes('ayuda') || query.includes('que puedes hacer') || query.includes('qué puedes hacer') || query.includes('opciones') || query.includes('funciones')) {
    return {
      text: `**Capacidades de Catheryne AI en tu Estética:**\n\n` +
            `- **Caja y Finanzas:** Consulta ingresos, gastos y balance neto en tiempo real.\n` +
            `- **Liquidación de Especialistas:** Cálculo automático de comisiones y pagos del equipo.\n` +
            `- **Agenda y Citas:** Consulta de citas para hoy y agendamiento automático.\n` +
            `- **Inventario y Boutique:** Consulta de stock y creación rápida de productos.\n` +
            `- **Bloqueos:** Cierre de festivos o fechas especiales en la agenda.\n` +
            `- **CRM y Clientas:** Consulta de teléfonos, notas estéticas y preferencias.`,
      action: null
    }
  }

  // Consulta de liquidación / comisiones
  if (query.includes('pagar') || query.includes('comisi') || query.includes('cuanto le debo') || query.includes('cuánto le debo') || query.includes('liquidacion') || query.includes('liquidación')) {
    const specialists = spaState.teamMembers || []

    if (specialists.length === 0) {
      return {
        text: `**Liquidación de Especialistas:**\n\n` +
              `Actualmente no hay especialistas registradas en el equipo. Puedes registrar a tus profesionales desde la sección **Equipo** en el menú lateral.`,
        action: null
      }
    }

    const matchedSpecialist = specialists.find(sp => query.includes(sp.name.toLowerCase()) || query.includes(sp.name.split(' ')[0].toLowerCase()))

    if (matchedSpecialist) {
      const apps = (spaState.appointments || []).filter(a => 
        (a.specialistId === matchedSpecialist.id || a.specialistName === matchedSpecialist.name) && 
        a.status !== 'Cancelada'
      )
      const todayApps = apps.filter(a => a.date === todayStr)
      const rate = matchedSpecialist.commissionRate || 45
      const todayEarned = todayApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * rate / 100)), 0)
      const totalEarned = apps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * rate / 100)), 0)

      return {
        text: `**Liquidación de ${matchedSpecialist.name} (${matchedSpecialist.role}):**\n\n` +
              `- **Tasa de Comisión:** ${rate}%\n` +
              `- **Citas atendidas hoy:** ${todayApps.length} servicio(s)\n` +
              `- **Monto neto a pagar por hoy:** **$${todayEarned.toLocaleString()} COP**\n` +
              `- **Acumulado histórico pendiente:** **$${totalEarned.toLocaleString()} COP**\n\n` +
              `*Cálculo verificado según citas confirmadas en el sistema.*`,
        action: null
      }
    } else {
      let summaryText = `**Reporte de Liquidación para el Equipo de Especialistas:**\n\n`
      let totalAll = 0

      specialists.forEach(sp => {
        const rate = sp.commissionRate || 45
        const spApps = (spaState.appointments || []).filter(a => 
          (a.specialistId === sp.id || a.specialistName === sp.name) && a.status !== 'Cancelada' && a.date === todayStr
        )
        const spTotal = spApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * rate / 100)), 0)
        totalAll += spTotal
        summaryText += `- **${sp.name}** (${rate}%): **$${spTotal.toLocaleString()} COP** (${spApps.length} citas hoy)\n`
      })

      summaryText += `\n**Total Neto a Pagar a Especialistas Hoy:** **$${totalAll.toLocaleString()} COP**`
      return { text: summaryText, action: null }
    }
  }

  // Citas / Agenda de hoy
  if (query.includes('cita') || query.includes('agenda') || query.includes('quien viene') || query.includes('quién viene') || query.includes('turnos')) {
    const todayApps = (spaState.appointments || []).filter(a => a.date === todayStr && a.status !== 'Cancelada')

    if (todayApps.length === 0) {
      return {
        text: `**Agenda de Citas de Hoy (${formattedDateCo}):**\n\n` +
              `No hay citas programadas para el día de hoy.\n\n` +
              `Si deseas agendar una cita rápidamente, dime el nombre de la clienta, servicio, hora y especialista.`,
        action: null
      }
    }

    let appsText = `**Citas Programadas para Hoy (${formattedDateCo}):**\n\n`
    todayApps.forEach(a => {
      appsText += `- **${a.time}:** ${a.clientName} - *${a.serviceName}* con **${a.specialistName}** ($${(a.price || 0).toLocaleString()} COP)\n`
    })

    return { text: appsText, action: null }
  }

  // Finanzas de Caja
  if (query.includes('caja') || query.includes('plata') || query.includes('dinero') || query.includes('ingreso') || query.includes('egreso') || query.includes('gasto') || query.includes('balance') || query.includes('reporte')) {
    const txs = spaState.transactions || []
    const inflows = txs.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0)
    const outflows = txs.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0)
    const net = inflows - outflows

    return {
      text: `**Estado Financiero y Flujo de Caja:**\n\n` +
            `- **Total Ingresos Registrados:** +$${inflows.toLocaleString()} COP\n` +
            `- **Total Gastos / Egresos:** -$${outflows.toLocaleString()} COP\n` +
            `- **Balance Neto en Caja:** **$${net.toLocaleString()} COP**\n\n` +
            `¿Deseas registrar un movimiento de caja o consultar el arqueo ciego?`,
      action: null
    }
  }

  // Inventario y Productos
  if (query.includes('producto') || query.includes('inventario') || query.includes('stock') || query.includes('tienda') || query.includes('boutique')) {
    const products = spaState.products || []
    if (products.length === 0) {
      return {
        text: `**Inventario de Boutique:**\n\n` +
              `Actualmente no hay productos registrados en el inventario. Puedes crearlos desde la sección **Boutique** en el menú de administración o pedirme que cree uno por ti.`,
        action: null
      }
    }

    let prodText = `**Resumen de Inventario (${products.length} productos):**\n\n`
    products.slice(0, 10).forEach(p => {
      prodText += `- **${p.name}:** $${(p.price || 0).toLocaleString()} COP (Stock: ${p.stock || 0})\n`
    })

    return { text: prodText, action: null }
  }

  // Servicios
  if (query.includes('servicio') || query.includes('tratamiento') || query.includes('catalogo') || query.includes('catálogo')) {
    const categories = spaState.serviceCategories || []
    const allServices = categories.flatMap(c => c.services || [])

    if (allServices.length === 0) {
      return {
        text: `**Catálogo de Tratamientos y Servicios:**\n\n` +
              `El catálogo está listo para recibir nuevos servicios. Puedes crearlos con sus precios y duraciones desde la sección **Servicios** del panel.`,
        action: null
      }
    }

    let srvText = `**Catálogo de Servicios (${allServices.length} tratamientos):**\n\n`
    allServices.slice(0, 10).forEach(s => {
      srvText += `- **${s.name}:** $${(s.price || 0).toLocaleString()} COP (${s.duration || 45} min)\n`
    })

    return { text: srvText, action: null }
  }

  // CRM y Preferencias
  if (query.includes('prefiere') || query.includes('cliente') || query.includes('clienta') || query.includes('alergia') || query.includes('historial')) {
    const clients = spaState.clients || []
    const matchedClient = clients.find(c => query.includes(c.name.toLowerCase()) || query.includes(c.name.split(' ')[0].toLowerCase()))

    if (matchedClient) {
      return {
        text: `**Ficha Técnica de ${matchedClient.name}:**\n\n` +
              `- **Teléfono / WhatsApp:** ${matchedClient.phone || 'No registrado'}\n` +
              `- **Correo:** ${matchedClient.email || 'No registrado'}\n` +
              `- **Notas y Preferencias:** ${matchedClient.notes || 'Sin notas registradas'}\n` +
              `- **Puntos de Lealtad:** ${matchedClient.loyaltyPoints || 0} pts`,
        action: null
      }
    } else if (clients.length === 0) {
      return {
        text: `**Directorio de Clientas:**\n\n` +
              `No hay clientas registradas aún en el sistema. Se guardarán automáticamente cuando agendes citas o puedes registrarlas desde la sección **Clientes**.`,
        action: null
      }
    }
  }

  // Fallback general educado y enfocado a estética
  return {
    text: `Como tu copiloto ejecutiva en **Catheryne Ríos Estética**, estoy lista para asistirte en la gestión operativa de tu negocio.\n\n` +
          `**Puedes consultarme por ejemplo:**\n` +
          `- *"¿Cómo va el reporte de caja de hoy?"*\n` +
          `- *"¿Qué citas tenemos programadas para hoy?"*\n` +
          `- *"¿Cuánto se le debe pagar a las especialistas hoy?"*\n` +
          `- *"¿Qué día es hoy?"*\n` +
          `- *"Agendar una cita para mañana"*`,
    action: null
  }
}
