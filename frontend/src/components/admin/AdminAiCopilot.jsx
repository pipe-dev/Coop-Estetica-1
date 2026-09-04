import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Send, 
  Mic, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  Bot, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  CalendarX,
  Volume2,
  VolumeX,
  Square,
  SlidersHorizontal,
  Play
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { sendChatMessageToCopilot, cleanAndNormalizeVoiceText } from '../../services/aiCopilotService'
import styles from './AdminAiCopilot.module.css'

/**
 * Limpia etiquetas Markdown y bloques de código para una locución fluida y natural
 */
function extractPlainTextForSpeech(content) {
  if (!content) return ''
  return content
    .replace(/```action[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`#|>]/g, '')
    .replace(/👉|🎉|💡|⚠️|✨|🚀|📊/g, '')
    .replace(/•|-|\+/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Puntuación de calidad y naturalidad humana para voces en español
 * Prioriza voces Neurales/Naturales de Colombia y Latinoamérica,
 * y penaliza drásticamente voces robóticas de Windows Desktop (como Helena).
 */
function getVoiceQualityScore(v) {
  const name = (v.name || '').toLowerCase()
  const lang = (v.lang || '').toLowerCase()
  let score = 0

  // 1. BONIFICACIÓN MÁXIMA: Voces Neurales / Naturales (Ultra-Humanas de última generación)
  if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
    score += 120
  }

  // 2. Acento colombiano o latino
  if (lang === 'es-co' || name.includes('colombia')) {
    score += 50
  } else if (lang === 'es-419' || lang === 'es-mx' || name.includes('mexico')) {
    score += 35
  } else if (lang === 'es-us') {
    score += 30
  }

  // 3. Voces de Google (en Chrome son voces de nube de alta fidelidad)
  if (name.includes('google')) {
    score += 90
  }

  // 4. Voces femeninas reconocidas de alta calidad acústica
  if (name.includes('salome') || name.includes('salomé')) score += 60
  if (name.includes('dalia')) score += 55
  if (name.includes('camila')) score += 50
  if (name.includes('sabina') || name.includes('sabrina')) score += 45
  if (name.includes('jimena')) score += 45
  if (name.includes('paulina')) score += 40
  if (name.includes('paloma')) score += 40
  if (name.includes('laura')) score += 35
  if (name.includes('monica') || name.includes('mónica')) score += 30

  // 5. Cloud Service (Chrome remote voices)
  if (v.localService === false) {
    score += 40
  }

  // 6. PENALIZACIÓN SEVERA: Voces masculinas (el copiloto es Catheryne)
  if (name.includes('pablo') || name.includes('jorge') || name.includes('alvaro') || 
      name.includes('gonzalo') || name.includes('alonso') || name.includes('raul') || 
      name.includes('male') || name.includes('hombre')) {
    score -= 100
  }

  // 7. PENALIZACIÓN SEVERA: Voces antiguas y metálicas de Windows Desktop (robóticas)
  if (name.includes('desktop') || name.includes('helena')) {
    score -= 80
  }

  return score
}

export function rankSpanishVoices(voices) {
  if (!voices || voices.length === 0) return []
  const spanish = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'))
  if (spanish.length === 0) return voices.slice(0, 1)

  return [...spanish].sort((a, b) => getVoiceQualityScore(b) - getVoiceQualityScore(a))
}

/**
 * Selecciona la voz más humana y realista disponible
 */
function getBestSpanishFemaleVoice(savedVoiceURI = '') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (voices.length === 0) return null

  // Si el usuario eligió una voz específica, usarla
  if (savedVoiceURI) {
    const matched = voices.find(v => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI)
    if (matched) return matched
  }

  const ranked = rankSpanishVoices(voices)
  return ranked[0] || voices[0] || null
}

function formatInline(text) {
  if (!text) return ''
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_{1}[^_]+_{1})/g)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <code key={i} className={styles.msgInlineCode}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function renderFormattedMessage(content) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let currentList = []
  let listType = null // 'ul' | 'ol'
  let currentTable = []

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${elements.length}`} className={styles.msgList}>{currentList}</ol>)
      } else {
        elements.push(<ul key={`ul-${elements.length}`} className={styles.msgList}>{currentList}</ul>)
      }
      currentList = []
      listType = null
    }
  }

  const flushTable = () => {
    if (currentTable.length > 0) {
      const rows = currentTable
      const isSeparator = (r) => /^\|(\s*:?-+:?\s*\|)+$/.test(r.trim())
      
      let headerRow = null
      let bodyRows = []

      if (rows.length >= 2 && isSeparator(rows[1])) {
        headerRow = rows[0].split('|').slice(1, -1).map(c => c.trim())
        bodyRows = rows.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()))
      } else {
        bodyRows = rows.map(r => r.split('|').slice(1, -1).map(c => c.trim()))
      }

      elements.push(
        <div key={`tbl-wrap-${elements.length}`} className={styles.msgTableWrap}>
          <table className={styles.msgTable}>
            {headerRow && (
              <thead>
                <tr>
                  {headerRow.map((h, hi) => (
                    <th key={hi}>{formatInline(h)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{formatInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      currentTable = []
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // 1. Markdown Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      flushList()
      currentTable.push(trimmed)
      return
    }
    flushTable()

    // 2. Headings (#, ##, ###, ####)
    if (trimmed.startsWith('#### ')) {
      flushList()
      elements.push(
        <h6 key={`h4-${index}`} className={styles.msgHeading4}>
          {formatInline(trimmed.slice(5))}
        </h6>
      )
      return
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h5 key={`h3-${index}`} className={styles.msgHeading3}>
          {formatInline(trimmed.slice(4))}
        </h5>
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h4 key={`h2-${index}`} className={styles.msgHeading2}>
          {formatInline(trimmed.slice(3))}
        </h4>
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h3 key={`h1-${index}`} className={styles.msgHeading1}>
          {formatInline(trimmed.slice(2))}
        </h3>
      )
      return
    }

    // 3. Horizontal Dividers
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushList()
      elements.push(<div key={`div-${index}`} className={styles.msgDivider} />)
      return
    }

    // 4. Blockquotes
    if (trimmed.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={`quote-${index}`} className={styles.msgBlockquote}>
          {formatInline(trimmed.slice(2))}
        </blockquote>
      )
      return
    }

    // 5. Bullet list item
    if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      const itemText = trimmed.slice(2)
      currentList.push(
        <li key={`li-${index}`} className={styles.msgListItem}>
          {formatInline(itemText)}
        </li>
      )
      return
    }

    // 6. Numbered list item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      currentList.push(
        <li key={`li-${index}`} className={styles.msgListItem}>
          {formatInline(numMatch[2])}
        </li>
      )
      return
    }

    flushList()

    if (!trimmed) {
      elements.push(<div key={`spacer-${index}`} className={styles.msgSpacer} />)
    } else {
      elements.push(
        <p key={`p-${index}`} className={styles.msgParagraph}>
          {formatInline(line)}
        </p>
      )
    }
  })

  flushList()
  flushTable()
  return <div className={styles.formattedMsg}>{elements}</div>
}

const INITIAL_GREETING = {
  role: 'assistant',
  content: `¡Hola Catheryne! Soy **Catheryne AI**, tu copiloto ejecutiva.\n\n` +
           `Estoy lista para ayudarte con caja, agenda de citas, liquidaciones de especialistas e inventario.\n\n` +
           `Pregúntame lo que necesites o pulsa una sugerencia rápida abajo:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getDynamicSuggestions = (messages) => {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''

  if (messages.length <= 1) {
    return [
      '¿Qué puedes hacer por mí y por mi estética?',
      '¿Cómo va el reporte de caja de hoy?',
      '¿Qué día es hoy?'
    ]
  }

  if (lastMsg.includes('paso 1: flujo de caja') || lastMsg.includes('5 pilares clave') || lastMsg.includes('empezamos explorando el paso 1')) {
    return [
      '1. Explícame el Flujo de Caja y Finanzas',
      '2. Explícame la Liquidación de Especialistas',
      '¿Cómo va el reporte de caja de hoy?'
    ]
  }

  if (lastMsg.includes('paso 1: control de caja') || lastMsg.includes('¿lista para pasar al paso 2')) {
    return [
      '2. Explícame la Liquidación de Especialistas',
      '¿Cómo registro un movimiento de caja?',
      '¿Cómo va el balance neto hoy?'
    ]
  }

  if (lastMsg.includes('paso 2: liquidación') || lastMsg.includes('¿avanzamos al paso 3')) {
    return [
      '3. Explícame cómo Agendar Citas por Voz o Texto',
      '¿Cuánto se le debe pagar a las especialistas hoy?',
      '¿Cómo se configuran las comisiones?'
    ]
  }

  if (lastMsg.includes('paso 3: agenda inteligente') || lastMsg.includes('¿continuamos con el paso 4')) {
    return [
      '4. Explícame el Inventario y Boutique',
      '¿Qué citas tenemos programadas para hoy?',
      'Agendar una cita rápida'
    ]
  }

  if (lastMsg.includes('paso 4: inventario') || lastMsg.includes('¿vamos al paso 5')) {
    return [
      '5. Explícame el CRM de Clientas y Festivos',
      '¿Qué productos tenemos en stock?',
      'Crea un producto nuevo'
    ]
  }

  if (lastMsg.includes('hemos completado el recorrido') || lastMsg.includes('felicitaciones')) {
    return [
      '¿Cómo va el reporte de caja de hoy?',
      '¿Qué citas tenemos programadas para hoy?',
      '¿Qué día es hoy?',
      'Bloquear un festivo o cierre'
    ]
  }

  return [
    '¿Cómo va el reporte de caja de hoy?',
    '¿Qué citas tenemos programadas para hoy?',
    '¿Qué día es hoy?',
    '¿Qué puedes hacer por mí y por mi estética?'
  ]
}

export default function AdminAiCopilot() {
  const adminState = useAdmin()
  const {
    addAppointment,
    addProduct,
    addClosedDate,
    updateClient,
    teamMembers = [],
    serviceCategories = []
  } = adminState

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_GREETING])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceInterim, setVoiceInterim] = useState('')
  const [lastActionExecuted, setLastActionExecuted] = useState(null)

  // ESTADO DE VOZ DE LECTURA (TTS 100% GRATUITO, ULTRA-HUMANO Y AUTOMÁTICO POR DEFECTO)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_copilot_voice_enabled')
      // ¡HABLA AUTOMÁTICAMENTE POR DEFECTO!
      return saved === null ? true : saved === 'true'
    } catch (e) {
      return true
    }
  })
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)

  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
    try {
      return localStorage.getItem('spa_copilot_voice_uri') || ''
    } catch (e) {
      return ''
    }
  })
  const [voiceRate, setVoiceRate] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('spa_copilot_voice_rate')) || 0.98
    } catch (e) {
      return 0.98
    }
  })
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])

  const messagesContainerRef = useRef(null)
  const latestAssistantMsgRef = useRef(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // Carga y ordenamiento de voces ultra-humanas del navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
      const updateVoices = () => {
        const all = window.speechSynthesis.getVoices() || []
        const ranked = rankSpanishVoices(all)
        setAvailableVoices(ranked)
        // Si no hay voz elegida aún, guardar automáticamente la #1 (la más humana)
        if (!selectedVoiceURI && ranked.length > 0) {
          setSelectedVoiceURI(ranked[0].voiceURI)
        }
      }
      updateVoices()
      window.speechSynthesis.onvoiceschanged = updateVoices
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null
          window.speechSynthesis.cancel()
        }
      }
    }
  }, [])

  // Alternar voz automática (mute / unmute general)
  const toggleVoiceEnabled = () => {
    setIsVoiceEnabled(prev => {
      const next = !prev
      try {
        localStorage.setItem('spa_copilot_voice_enabled', next ? 'true' : 'false')
      } catch (e) {}
      if (!next && synthRef.current) {
        synthRef.current.cancel()
        setSpeakingMessageIndex(null)
      }
      return next
    })
  }

  // Detener locución
  const stopSpeaking = () => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel()
      } catch (e) {}
    }
    setSpeakingMessageIndex(null)
  }

  // Reproducir mensaje con la voz nativa ultra-humana de Catheryne
  const speakMessage = (content, index) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Si ya está hablando este mensaje específico, alternar (detener)
    if (synthRef.current && synthRef.current.speaking && speakingMessageIndex === index) {
      stopSpeaking()
      return
    }

    stopSpeaking()

    const textToSpeak = extractPlainTextForSpeech(content)
    if (!textToSpeak) return

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      const voice = getBestSpanishFemaleVoice(selectedVoiceURI)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang || 'es-CO'
      } else {
        utterance.lang = 'es-CO'
      }

      // Parámetros acústicos ultra-humanos:
      // ¡PITCH 1.0! Vital para preservar formantes, respiración y entonación de grabaciones neurales
      utterance.pitch = 1.0
      // Cadencia natural y relajada (0.98x)
      utterance.rate = voiceRate || 0.98

      utterance.onstart = () => {
        setSpeakingMessageIndex(index)
      }
      utterance.onend = () => {
        setSpeakingMessageIndex(null)
      }
      utterance.onerror = (e) => {
        console.warn('Error en síntesis de voz:', e)
        setSpeakingMessageIndex(null)
      }

      synthRef.current.speak(utterance)
    } catch (err) {
      console.warn('No se pudo reproducir audio:', err)
      setSpeakingMessageIndex(null)
    }
  }

  // Scroll inteligente y cómodo:
  // - Si el usuario envió mensaje o la IA está pensando -> scroll al final.
  // - Si la IA responde -> scroll exactamente al INICIO de la respuesta para leer desde la primera línea.
  useEffect(() => {
    if (!isOpen) return

    const lastMsg = messages[messages.length - 1]
    const isAssistant = lastMsg && lastMsg.role === 'assistant'

    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if (isAssistant) {
      const timer = setTimeout(() => {
        if (latestAssistantMsgRef.current && messagesContainerRef.current) {
          const container = messagesContainerRef.current
          const el = latestAssistantMsgRef.current
          const targetScrollTop = el.offsetTop - container.offsetTop - 12
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          })
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 70)
      return () => clearTimeout(timer)
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  // Atajo de teclado: Ctrl + K o Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        stopSpeaking()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // ----------------------------------------------------
  // ENVIAR MENSAJE AL COPILOTO
  // ----------------------------------------------------
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText
    if (!query.trim() || isLoading) return

    stopSpeaking()

    const userMsg = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await sendChatMessageToCopilot(
        [...messages, userMsg],
        adminState
      )

      const botMsg = {
        role: 'assistant',
        content: response.text,
        action: response.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => {
        const nextMsgs = [...prev, botMsg]
        // Si la voz está activada, iniciar locución automática
        if (isVoiceEnabled && botMsg.content) {
          setTimeout(() => {
            speakMessage(botMsg.content, nextMsgs.length - 1)
          }, 250)
        }
        return nextMsgs
      })

      // Si el modelo emitió una acción, ejecutarla en el sistema
      if (response.action) {
        executeAction(response.action)
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ocurrió un error temporal al procesar tu solicitud. Por favor intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // ----------------------------------------------------
  // EJECUTOR DE ACCIONES EN LA BASE DE DATOS / ESTADO
  // ----------------------------------------------------
  const executeAction = (actionObj) => {
    const { action, data } = actionObj

    if (action === 'CREATE_APPOINTMENT' && data) {
      // Resolver ID de especialista y servicio si vinieron por nombre
      const matchedSp = teamMembers.find(t => t.name.toLowerCase().includes((data.specialistName || '').toLowerCase())) || teamMembers[0]
      const allServices = serviceCategories.flatMap(c => c.services || [])
      const matchedSrv = allServices.find(s => s.name.toLowerCase().includes((data.serviceName || '').toLowerCase())) || allServices[0]

      const newAppointment = {
        clientName: data.clientName || 'Clienta',
        clientPhone: data.clientPhone || '3000000000',
        serviceId: matchedSrv?.id || 'srv-1',
        serviceName: data.serviceName || matchedSrv?.name || 'Tratamiento Estética',
        specialistId: matchedSp?.id || 'team-1',
        specialistName: data.specialistName || matchedSp?.name || 'Catheryne Ríos',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '10:00 AM',
        price: matchedSrv?.price || 50000,
        status: 'Reservada'
      }

      addAppointment(newAppointment)
      setLastActionExecuted({
        type: 'Cita Agendada',
        details: `${newAppointment.clientName} - ${newAppointment.serviceName} (${newAppointment.date} a las ${newAppointment.time}) con ${newAppointment.specialistName}`
      })
    }

    if (action === 'CREATE_PRODUCT' && data) {
      addProduct({
        name: data.name,
        price: parseFloat(data.price) || 50000,
        stock: parseInt(data.stock, 10) || 10,
        category: data.category || 'facial',
        brand: 'Catheryne Ríos Luxury'
      })
      setLastActionExecuted({
        type: 'Producto Creado',
        details: `${data.name} ($${(data.price || 0).toLocaleString()} COP, ${data.stock || 10} unidades)`
      })
    }

    if (action === 'BLOCK_DATE' && data) {
      addClosedDate({
        date: data.date,
        reason: data.reason || 'Cierre Administrativo',
        type: data.type || 'Festivo'
      })
      setLastActionExecuted({
        type: 'Fecha Bloqueada',
        details: `${data.date} (${data.reason})`
      })
    }
  }

  // ----------------------------------------------------
  // ENTRADA DE VOZ ROBUSTA CON RETROALIMENTACIÓN EN VIVO
  // ----------------------------------------------------
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Te recomendamos usar Google Chrome o Microsoft Edge.')
      return
    }

    // Si ya está escuchando, el clic finaliza el dictado y envía de inmediato
    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch (e) {
        console.warn('Error deteniendo dictado:', e)
      }
      setIsListening(false)
      setVoiceInterim('')
      if (inputText.trim()) {
        handleSendMessage(inputText.trim())
      }
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'es-CO'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 2

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceInterim('Escuchando... habla claramente')
      }

      recognition.onresult = (event) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i]
          if (res.isFinal) {
            final += res[0].transcript + ' '
          } else {
            interim += res[0].transcript
          }
        }

        const raw = (final + interim).trim()
        if (raw) {
          const normalized = cleanAndNormalizeVoiceText(raw)
          setVoiceInterim(normalized)
          setInputText(normalized)
        }
      }

      recognition.onerror = (event) => {
        console.warn('[VOICE] Estado dictado:', event.error)
        setIsListening(false)
        setVoiceInterim('')
      }

      recognition.onend = () => {
        setIsListening(false)
        setVoiceInterim('')
        setInputText(prev => cleanAndNormalizeVoiceText(prev))
      }

      recognition.start()
    } catch (e) {
      console.warn('Error iniciando dictado:', e)
      setIsListening(false)
      setVoiceInterim('')
    }
  }

  const handleResetChat = () => {
    setMessages([INITIAL_GREETING])
    setLastActionExecuted(null)
  }

  return (
    <>
      {/* BOTÓN FLOTANTE DORADO */}
      <button 
        type="button" 
        className={styles.floatingTrigger}
        onClick={() => setIsOpen(true)}
        title="Abrir Copiloto IA de Administración (Ctrl+K)"
      >
        <Sparkles size={18} />
        <span>Catheryne AI</span>
        <span className={styles.triggerBadge}>IA 120B</span>
        <span className={styles.shortcutHint}>Ctrl+K</span>
      </button>

      {/* MODAL / DRAWER LATERAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* OVERLAY */}
            <motion.div 
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* DRAWER */}
            <motion.aside 
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              {/* HEADER */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <div className={styles.aiAvatar}>
                    <Bot size={22} />
                    <div className={styles.onlineDot} />
                  </div>
                  <div>
                    <h3 className={styles.headerTitle}>Catheryne AI</h3>
                    <p className={styles.headerSubtitle}>
                      <span>Copiloto Ejecutiva</span>
                      <span className={styles.modelBadge}>IA Estética</span>
                    </p>
                  </div>
                </div>

                <div className={styles.headerActions}>
                  {/* BOTÓN DE VOZ DE LECTURA NATIVO (100% GRATIS) */}
                  <button 
                    type="button" 
                    className={`${styles.iconBtn} ${isVoiceEnabled ? styles.iconBtnActive : ''}`} 
                    onClick={toggleVoiceEnabled}
                    title={isVoiceEnabled ? "Voz automática activa (Clic para silenciar)" : "Activar voz automática de Catheryne"}
                  >
                    {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

                  {/* AJUSTES DE VOZ HUMANA */}
                  <button 
                    type="button" 
                    className={`${styles.iconBtn} ${showVoiceSettings ? styles.iconBtnActive : ''}`} 
                    onClick={() => setShowVoiceSettings(prev => !prev)}
                    title="Configurar y probar voces humanas de Catheryne"
                  >
                    <SlidersHorizontal size={15} />
                  </button>

                  <button 
                    type="button" 
                    className={styles.iconBtn} 
                    onClick={() => {
                      stopSpeaking()
                      handleResetChat()
                    }}
                    title="Reiniciar Conversación"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button 
                    type="button" 
                    className={styles.iconBtn} 
                    onClick={() => {
                      stopSpeaking()
                      setIsOpen(false)
                    }}
                    title="Cerrar (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* PANEL DE CONFIGURACIÓN DE VOZ HUMANA */}
              <AnimatePresence>
                {showVoiceSettings && (
                  <motion.div 
                    className={styles.voiceSettingsPanel}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className={styles.voiceSettingsHeader}>
                      <div className={styles.voiceSettingsTitle}>
                        <Sparkles size={14} />
                        <span>Voz Humana de Catheryne AI</span>
                      </div>
                      <button 
                        type="button" 
                        className={styles.voiceCloseBtn}
                        onClick={() => setShowVoiceSettings(false)}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className={styles.voiceControlGroup}>
                      <label className={styles.voiceLabel}>Voz seleccionada:</label>
                      <select 
                        className={styles.voiceSelect}
                        value={selectedVoiceURI || (availableVoices[0]?.voiceURI || '')}
                        onChange={(e) => {
                          const uri = e.target.value
                          setSelectedVoiceURI(uri)
                          localStorage.setItem('spa_copilot_voice_uri', uri)
                        }}
                      >
                        {availableVoices.map((v, i) => {
                          const isNeural = v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('google')
                          return (
                            <option key={v.voiceURI || i} value={v.voiceURI}>
                              {isNeural ? '✨ [Ultra-Humana] ' : ''}{v.name}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className={styles.voiceSettingsRow}>
                      <div className={styles.voiceSliderGroup}>
                        <span className={styles.voiceLabel}>Velocidad: {voiceRate}x</span>
                        <input 
                          type="range" 
                          min="0.85" 
                          max="1.15" 
                          step="0.05"
                          value={voiceRate}
                          onChange={(e) => {
                            const r = parseFloat(e.target.value)
                            setVoiceRate(r)
                            localStorage.setItem('spa_copilot_voice_rate', r)
                          }}
                          className={styles.voiceSlider}
                        />
                      </div>

                      <button 
                        type="button" 
                        className={styles.voiceTestBtn}
                        onClick={() => speakMessage('¡Hola Catheryne! Soy tu copiloto ejecutiva. Así suena mi voz natural para tu estética.', -1)}
                      >
                        <Play size={11} />
                        <span>Probar</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FEED DE MENSAJES */}
              <div ref={messagesContainerRef} className={styles.messagesContainer}>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  const isLastAssistant = !isUser && index === messages.length - 1
                  return (
                    <div 
                      key={index} 
                      ref={isLastAssistant ? latestAssistantMsgRef : null}
                      className={`${styles.messageRow} ${isUser ? styles.userRow : ''}`}
                    >
                      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
                        {renderFormattedMessage(msg.content)}

                        {/* TARJETA VISUAL SI SE EJECUTÓ UNA ACCIÓN */}
                        {msg.action && (
                          <div className={styles.actionCard}>
                            <div className={styles.actionHeader}>
                              <CheckCircle2 size={14} />
                              <span>Acción Ejecutada en el Sistema</span>
                            </div>
                            <div className={styles.actionDetails}>
                              {msg.action.action === 'CREATE_APPOINTMENT' && (
                                <div>
                                  <strong>Cita Agendada:</strong> {msg.action.data.clientName} ({msg.action.data.serviceName}) el {msg.action.data.date} a las {msg.action.data.time} con {msg.action.data.specialistName}.
                                </div>
                              )}
                              {msg.action.action === 'CREATE_PRODUCT' && (
                                <div>
                                  <strong>Producto Creado:</strong> {msg.action.data.name} ($${(msg.action.data.price || 0).toLocaleString()} COP).
                                </div>
                              )}
                              {msg.action.action === 'BLOCK_DATE' && (
                                <div>
                                  <strong>Fecha Bloqueada:</strong> {msg.action.data.date} - {msg.action.data.reason}.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* PIE DE BURBUJA: HORA + BOTÓN DE AUDIO */}
                        <div className={styles.bubbleFooter}>
                          <span className={styles.timeLabel}>{msg.timestamp}</span>

                          {!isUser && msg.content && (
                            <button
                              type="button"
                              className={`${styles.voicePlayBtn} ${speakingMessageIndex === index ? styles.voicePlayBtnActive : ''}`}
                              onClick={() => speakMessage(msg.content, index)}
                              title={speakingMessageIndex === index ? "Detener locución" : "Escuchar respuesta de Catheryne AI"}
                            >
                              {speakingMessageIndex === index ? (
                                <>
                                  <span className={styles.soundWaveBar} />
                                  <span className={styles.soundWaveBar} />
                                  <span className={styles.soundWaveBar} />
                                  <Square size={10} />
                                  <span>Detener</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={12} />
                                  <span>Escuchar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* INDICADOR DE ESCRITURA */}
                {isLoading && (
                  <div className={styles.messageRow}>
                    <div className={`${styles.bubble} ${styles.botBubble}`}>
                      <span>Pensando</span>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* CHIPS DE SUGERENCIAS RÁPIDAS DINÁMICAS */}
              <div className={styles.suggestionsWrap}>
                {getDynamicSuggestions(messages).map((sug, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    className={styles.chip}
                    onClick={() => handleSendMessage(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* FOOTER FORMULARIO */}
              <div className={styles.footer}>
                {/* BANNER EN VIVO DE DICTADO POR VOZ */}
                {isListening && (
                  <div className={styles.voiceLiveBanner}>
                    <div className={styles.voicePulseDot} />
                    <span className={styles.voiceLiveText}>
                      {voiceInterim || '🎙️ Escuchando... habla claramente'}
                    </span>
                    <button 
                      type="button" 
                      className={styles.voiceStopBtn}
                      onClick={handleVoiceInput}
                      title="Enviar lo dictado"
                    >
                      Listo / Enviar
                    </button>
                  </div>
                )}

                <form 
                  className={styles.inputForm}
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                >
                  <input 
                    type="text" 
                    className={styles.inputField}
                    placeholder="Escribe o dicta una instrucción a Catheryne AI..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    disabled={isLoading}
                  />

                  {/* BOTÓN DE MICRÓFONO */}
                  <button 
                    type="button" 
                    className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
                    onClick={handleVoiceInput}
                    title="Dictar por voz"
                  >
                    <Mic size={18} />
                  </button>

                  {/* BOTÓN DE ENVIAR */}
                  <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={!inputText.trim() || isLoading}
                    title="Enviar mensaje"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
