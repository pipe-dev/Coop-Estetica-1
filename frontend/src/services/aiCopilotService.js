// S.H.I.E.L.D. Compliant AI Copilot Engine powered by Meta Llama 3 (Groq API / Free Cloud Inference)
import { api } from './api'
import { sanitizeString } from '../utils/securityService'

// Clave de Groq configurada en variables de entorno o guardada en localStorage
const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_NAME = 'llama-3.3-70b-versatile'

/**
 * 1. Generador de Contexto en Tiempo Real del Spa
 * Extrae y sintetiza todo el estado del negocio para que Llama 3 conozca la realidad exacta.
 */
export function buildSpaSystemPrompt(spaState) {
  const {
    businessConfig = {},
    serviceCategories = [],
    teamMembers = [],
    appointments = [],
    products = [],
    clients = [],
    closedDates = [],
    cashSessions = [],
    transactions = [],
    currentUserRole = 'OWNER'
  } = spaState

  const todayStr = new Date().toISOString().split('T')[0]

  // Citas de hoy y cálculo de comisiones
  const todayApps = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelada')
  
  // Cálculo de liquidación por especialista
  const specialistSummary = teamMembers.map(sp => {
    const spApps = appointments.filter(a => 
      (a.specialistId === sp.id || a.specialistName === sp.name) && 
      a.status !== 'Cancelada'
    )
    const spTodayApps = spApps.filter(a => a.date === todayStr)
    const totalEarned = spApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * (sp.commissionRate || 45) / 100)), 0)
    const todayEarned = spTodayApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * (sp.commissionRate || 45) / 100)), 0)

    return {
      id: sp.id,
      name: sp.name,
      role: sp.role,
      commissionRate: `${sp.commissionRate || 45}%`,
      todayServicesCount: spTodayApps.length,
      todayEarnedCOP: todayEarned,
      totalEarnedCOP: totalEarned
    }
  })

  // Resumen Financiero y Caja
  const totalInflows = transactions.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0)
  const totalOutflows = transactions.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0)
  const netBalance = totalInflows - totalOutflows

  const servicesList = serviceCategories.flatMap(c => 
    (c.services || []).map(s => `${s.name} ($${(s.price || 0).toLocaleString()} COP, ${s.duration || 45} min, Cat: ${c.name})`)
  )

  const productsList = products.map(p => 
    `${p.name} ($${(p.price || 0).toLocaleString()} COP, Stock: ${p.stock || 0} unid, Estado: ${p.status || 'Disponible'})`
  )

  const clientsList = clients.map(c => 
    `${c.name} | Tel: ${c.phone || 'Sin tel'} | Notas: ${c.notes || 'Sin notas especiales'}`
  )

  const closedDatesList = closedDates.map(d => `${d.date} (${d.reason} - ${d.type})`)

  return `
Eres "Catheryne AI", la Asistente Ejecutiva Inteligente y Copiloto de Operaciones de "Catheryne Ríos Estética".
Tu misión es asistir a la dueña (Catheryne) y al equipo administrativo a controlar, consultar y ejecutar tareas del spa mediante lenguaje natural.
Eres sumamente profesional, cálida, eficiente, precisa y respetuosa. Hablas en español formal y elegante. NUNCA uses emojis infantiles ni listas genéricas vacías. Usa formato markdown limpio con negritas y tablas cuando sea útil.

FECHA ACTUAL: ${todayStr}
ROL DEL USUARIO ACTUAL: ${currentUserRole === 'OWNER' ? 'Dueña (Acceso Total)' : currentUserRole === 'ADMIN' ? 'Administradora' : 'Especialista'}

DATOS EN VIVO DEL NEGOCIO:
- Nombre: ${businessConfig.businessName || 'Catheryne Ríos Estética'}
- WhatsApp Sede: ${businessConfig.whatsappNumber || '3006269056'}
- Dirección: ${businessConfig.address || 'Calle 123 #45-67, Barrio El Prado'}

EQUIPO Y LIQUIDACIONES EN TIEMPO REAL:
${JSON.stringify(specialistSummary, null, 2)}

RESUMEN FINANCIERO DE CAJA:
- Total Ingresos: $${totalInflows.toLocaleString()} COP
- Total Egresos: $${totalOutflows.toLocaleString()} COP
- Balance Neto en Caja: $${netBalance.toLocaleString()} COP

CITAS DE HOY (${todayApps.length} citas activas):
${todayApps.map(a => `- ${a.time}: ${a.clientName} (${a.serviceName}) con ${a.specialistName} - Estado: ${a.status} - Valor: $${(a.price || 0).toLocaleString()} COP`).join('\n')}

CATÁLOGO DE SERVICIOS:
${servicesList.join('\n')}

INVENTARIO DE PRODUCTOS:
${productsList.join('\n')}

CLIENTES CRM Y PREFERENCIAS:
${clientsList.join('\n')}

DÍAS DE CIERRE Y FESTIVOS:
${closedDatesList.join('\n')}

REGLAS DE CONDUCTA Y ACCIÓN:
1. **Liquidación a Especialistas**: Si la dueña pregunta por una especialista en específico (ej. "¿Cuánto le debo pagar a Valentina?"), respóndele con el desglose exacto de lo que ha ganado Valentina en sus citas. Si pregunta en general por todas, muéstrale una tabla comparativa con el total de cada una.
2. **Agendamiento Inteligente con Guía Paso a Paso**:
   - Si la dueña te pide agendar una cita pero falta algún dato crucial (como la hora, fecha, tratamiento o especialista), NO falles; responde amablemente guiándola y pidiéndole el dato faltante (ej. "¿A qué hora deseas programar a Mariana?").
   - Si falta el número de teléfono, dile que puedes registrarla sin número o si prefiere dártelo.
   - Cuando tengas todos los datos esenciales para crear una cita, incluye al final de tu respuesta el comando de acción JSON:
     \`\`\`action
     {"action": "CREATE_APPOINTMENT", "data": {"clientName": "...", "clientPhone": "...", "serviceName": "...", "specialistName": "...", "date": "YYYY-MM-DD", "time": "HH:MM AM/PM"}}
     \`\`\`
3. **Creación de Productos / Tratamientos**: Si la dueña pide crear un producto o servicio pero faltan datos (ej. precio o stock), pídeselos amablemente. Si los tienes completos, genera:
     \`\`\`action
     {"action": "CREATE_PRODUCT", "data": {"name": "...", "price": 0, "stock": 10, "category": "facial"}}
     \`\`\`
4. **Bloqueo de Fechas**: Si pide cerrar o bloquear un día:
     \`\`\`action
     {"action": "BLOCK_DATE", "data": {"date": "YYYY-MM-DD", "reason": "...", "type": "Festivo"}}
     \`\`\`
5. **Consultas CRM**: Si pregunta por las preferencias o historial de una clienta (ej. "¿Cómo prefiere los servicios Arleyda?"), dale todos sus datos de inmediato (teléfono, notas, alergias y esmaltado favorito).
`
}

/**
 * 2. Procesador de Mensajes con Llama 3
 */
export async function sendChatMessageToCopilot(messages, spaState, customApiKey = '') {
  const apiKey = customApiKey || localStorage.getItem('spa_groq_api_key') || DEFAULT_GROQ_KEY
  const systemPrompt = buildSpaSystemPrompt(spaState)

  const payloadMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: sanitizeString(m.content, 2000)
    }))
  ]

  // Si no hay API Key externa configurada, usamos el motor de fallback nativo con comprensión semántica
  if (!apiKey || apiKey.includes('tu_clave')) {
    return processLocalFallbackAgent(messages[messages.length - 1].content, spaState)
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: payloadMessages,
        temperature: 0.3,
        max_tokens: 1024,
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.warn('[GROQ API WARNING] Fallback a motor local:', err)
      return processLocalFallbackAgent(messages[messages.length - 1].content, spaState)
    }

    const data = await response.json()
    const botReply = data.choices?.[0]?.message?.content || 'No pude procesar la solicitud en este momento.'
    return parseAgentResponse(botReply)
  } catch (error) {
    console.warn('[AI COPILOT] Error de red con Groq, activando fallback local:', error)
    return processLocalFallbackAgent(messages[messages.length - 1].content, spaState)
  }
}

/**
 * 3. Parser de Acciones Embebidas
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
 * 4. Motor Local Resiliente (Fallback Inteligente 100% Offline / Sin API Key)
 * Procesa intenciones clave de finanzas, CRM, comisiones y citas incluso sin internet.
 */
function processLocalFallbackAgent(userQuery, spaState) {
  const query = userQuery.toLowerCase().trim()
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Consulta de pago/comisión a especialista específica o todas
  if (query.includes('pagar') || query.includes('comisi') || query.includes('cuanto le debo') || query.includes('cuánto le debo') || query.includes('liquidacion') || query.includes('liquidación')) {
    const specialists = spaState.teamMembers || []
    
    // Buscar si nombró a una en particular
    const matchedSpecialist = specialists.find(sp => query.includes(sp.name.toLowerCase()) || query.includes(sp.name.split(' ')[0].toLowerCase()))

    if (matchedSpecialist) {
      const apps = (spaState.appointments || []).filter(a => 
        (a.specialistId === matchedSpecialist.id || a.specialistName === matchedSpecialist.name) && 
        a.status !== 'Cancelada'
      )
      const todayApps = apps.filter(a => a.date === todayStr)
      const todayEarned = todayApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * (matchedSpecialist.commissionRate || 45) / 100)), 0)
      const totalEarned = apps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * (matchedSpecialist.commissionRate || 45) / 100)), 0)

      return {
        text: `**Liquidación de ${matchedSpecialist.name} (${matchedSpecialist.role}):**\n\n` +
              `- **Tasa de Comisión:** ${matchedSpecialist.commissionRate || 45}%\n` +
              `- **Citas atendidas hoy:** ${todayApps.length} servicio(s)\n` +
              `- **Monto a pagar por hoy:** **$${todayEarned.toLocaleString()} COP**\n` +
              `- **Acumulado histórico pendiente:** **$${totalEarned.toLocaleString()} COP**\n\n` +
              `*Los cálculos están basados en las citas confirmadas en el sistema.*`,
        action: null
      }
    } else {
      // Reporte consolidado de todas las chicas
      let summaryText = `**Reporte de Liquidación para el Equipo de Especialistas:**\n\n`
      let totalAll = 0

      specialists.forEach(sp => {
        const spApps = (spaState.appointments || []).filter(a => 
          (a.specialistId === sp.id || a.specialistName === sp.name) && a.status !== 'Cancelada' && a.date === todayStr
        )
        const spTotal = spApps.reduce((acc, a) => acc + (a.commissionAmount || ((a.price || 0) * (sp.commissionRate || 45) / 100)), 0)
        totalAll += spTotal
        summaryText += `- **${sp.name}** (${sp.commissionRate || 45}%): **$${spTotal.toLocaleString()} COP** (${spApps.length} citas hoy)\n`
      })

      summaryText += `\n**Total Neto a Pagar a Especialistas Hoy:** **$${totalAll.toLocaleString()} COP**`
      return { text: summaryText, action: null }
    }
  }

  // 2. Consulta de Caja & Finanzas
  if (query.includes('caja') || query.includes('plata') || query.includes('dinero') || query.includes('ingreso') || query.includes('reporte')) {
    const txs = spaState.transactions || []
    const inflows = txs.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0)
    const outflows = txs.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0)
    const net = inflows - outflows

    return {
      text: `**Estado Financiero y Flujo de Caja:**\n\n` +
            `- **Total Ingresos Registrados:** +$${inflows.toLocaleString()} COP\n` +
            `- **Total Gastos / Egresos:** -$${outflows.toLocaleString()} COP\n` +
            `- **Balance Neto en Caja:** **$${net.toLocaleString()} COP**\n\n` +
            `¿Deseas registrar un nuevo movimiento de caja o ver el arqueo ciego?`,
      action: null
    }
  }

  // 3. Consulta de CRM / Preferencias de Clienta
  if (query.includes('prefiere') || query.includes('cliente') || query.includes('clienta') || query.includes('alergia') || query.includes('historial')) {
    const clients = spaState.clients || []
    const matchedClient = clients.find(c => query.includes(c.name.toLowerCase()) || query.includes(c.name.split(' ')[0].toLowerCase()))

    if (matchedClient) {
      return {
        text: `**Ficha Técnica de ${matchedClient.name}:**\n\n` +
              `- **Teléfono / WhatsApp:** ${matchedClient.phone || 'No registrado'}\n` +
              `- **Correo:** ${matchedClient.email || 'No registrado'}\n` +
              `- **Notas y Preferencias Estéticas:** ${matchedClient.notes || 'Sin notas especiales registradas'}\n` +
              `- **Puntos de Lealtad:** ${matchedClient.loyaltyPoints || 0} pts\n\n` +
              `¿Deseas agendarle una nueva cita o actualizar sus notas?`,
        action: null
      }
    }
  }

  // 4. Días de Cierre / Festivos
  if (query.includes('festivo') || query.includes('cerrar') || query.includes('bloquear') || query.includes('vacaciones')) {
    const closed = spaState.closedDates || []
    return {
      text: `**Días de Cierre y Festivos Registrados:**\n\n` +
            (closed.length > 0 
              ? closed.map(c => `- **${c.date}**: ${c.reason} (${c.type})`).join('\n')
              : 'Actualmente no hay fechas bloqueadas.') +
            `\n\nPuedes decirme por ejemplo: *"Bloquea el 2026-10-12 por Festivo Nacional"* para agregarlo.`,
      action: null
    }
  }

  // Respuesta por defecto con sugerencias
  return {
    text: `Hola Catheryne. Estoy lista para asistirte en la gestión del spa. ¿En qué te puedo ayudar hoy?\n\n` +
          `**Puedes pedirme cosas como:**\n` +
          `- *"¿Cuánto le debo pagar a Valentina hoy?"*\n` +
          `- *"¿Cómo va el reporte de caja y dinero de hoy?"*\n` +
          `- *"¿Qué notas y preferencias tiene la clienta Mariana López?"*\n` +
          `- *"Agenda a Sofía Martínez mañana a las 3 PM para Facial de Oro con Camila"*\n` +
          `- *"Bloquea el 15 de octubre por mantenimiento"*\n` +
          `- *"Crea un producto nuevo Sérum Ácido Hialurónico a 95.000 con 10 unidades"*\n\n` +
          `*Para habilitar las respuestas ultra-avanzadas de Llama 3 con Groq a costo $0 USD, puedes ingresar tu clave gratuita en Configuración.*`,
    action: null
  }
}
