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
  Volume2
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { sendChatMessageToCopilot } from '../../services/aiCopilotService'
import styles from './AdminAiCopilot.module.css'

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
  content: `¡Hola Catheryne! Soy **Catheryne AI**, tu copiloto ejecutiva de operaciones e inteligencia de negocios para tu estética.\n\n` +
           `Estoy diseñada para acompañarte día a día y hacer que la administración de tu estética sea impecable, rápida y sin estrés.\n\n` +
           `Para comenzar a conocernos y presentarte todo mi potencial paso a paso, haz clic abajo o pregúntame:\n\n` +
           `👉 **"¿Qué puedes hacer por mí y por mi estética?"**`,
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
  const [lastActionExecuted, setLastActionExecuted] = useState(null)

  const messagesEndRef = useRef(null)

  // Scroll al final al recibir mensajes
  useEffect(() => {
    if (isOpen) {
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

      setMessages(prev => [...prev, botMsg])

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
  // ENTRADA DE VOZ (MICROPHONE DICTATION)
  // ----------------------------------------------------
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-CO'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInputText(transcript)
          handleSendMessage(transcript)
        }
      }

      recognition.start()
    } catch (e) {
      console.warn('Error iniciando dictado:', e)
      setIsListening(false)
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
                  <button 
                    type="button" 
                    className={styles.iconBtn} 
                    onClick={handleResetChat}
                    title="Reiniciar Conversación"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button 
                    type="button" 
                    className={styles.iconBtn} 
                    onClick={() => setIsOpen(false)}
                    title="Cerrar (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* FEED DE MENSAJES */}
              <div className={styles.messagesContainer}>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div 
                      key={index} 
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

                        <span className={styles.timeLabel}>{msg.timestamp}</span>
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
