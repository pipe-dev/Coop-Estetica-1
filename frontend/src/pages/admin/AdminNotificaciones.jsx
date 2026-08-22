import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Smartphone, Calendar, Clock, CheckCircle2, Send, Copy, Sparkles, User, AlertCircle, ExternalLink, MessageCircle } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { getLocalDateString } from '../../utils/currencyUtils'
import styles from './AdminNotificaciones.module.css'

export default function AdminNotificaciones() {
  const {
    appointments = [],
    notifications = [],
    addNotification,
    toggleNotificationActive,
    deleteNotification
  } = useAdmin()

  // Main Tabs: 'reminders' | 'announcements'
  const [activeTab, setActiveTab] = useState('reminders')

  // Reminders Sub-Filter: 'tomorrow' | 'today' | 'custom'
  const [reminderMode, setReminderMode] = useState('tomorrow')

  // Date calculation
  const todayStr = getLocalDateString()
  const tomorrowObj = new Date()
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrowObj)

  const [customDate, setCustomDate] = useState(tomorrowStr)
  const [sentReminderIds, setSentReminderIds] = useState(new Set())
  const [copyToast, setCopyToast] = useState(null)

  // Announcements form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Determine active filter date
  const activeFilterDate = reminderMode === 'tomorrow'
    ? tomorrowStr
    : reminderMode === 'today'
      ? todayStr
      : customDate

  // Filter appointments for reminders
  const targetAppointments = appointments.filter(app => {
    // Only non-cancelled appointments
    if (app.status === 'Cancelada') return false
    return app.date === activeFilterDate
  })

  // Calculate metrics
  const totalRemindersCount = targetAppointments.length
  const sentCount = targetAppointments.filter(app => sentReminderIds.has(app.id)).length
  const pendingCount = totalRemindersCount - sentCount

  // Helper to generate the exact WhatsApp message
  const generateReminderMessage = (app) => {
    const isTodayMode = reminderMode === 'today'
    const cleanPhone = (app.clientPhone || '').replace(/\D/g, '')

    if (isTodayMode) {
      return `⏰ *¡TU CITA ESTÁ POR COMENZAR! — CATHERYNE RÍOS ESTÉTICA* ⏰
Hola *${app.clientName}*, ¡esperamos que estés teniendo un lindo día! 🌸

Te recordamos que tu cita de hoy está lista para iniciar:
💆 *Tratamiento:* ${app.serviceName}
👩‍⚕️ *Especialista:* ${app.specialistName}
⏰ *Hora:* ${app.time}
📍 *Lugar:* Catheryne Ríos Estética

Tu especialista ya tiene la cabina y los insumos preparados para recibirte puntualmente. ✨💖 ¡Te esperamos!`
    }

    // Tomorrow / Custom Date Mode
    return `🌸 *RECORDATORIO DE TU CITA — CATHERYNE RÍOS ESTÉTICA* 🌸
Hola *${app.clientName}*, ¡te saludamos con mucho cariño! ✨

Te recordamos tu cita programada para el día de mañana:
🗓️ *Fecha:* ${app.date}
⏰ *Hora:* ${app.time}
💆 *Tratamiento:* ${app.serviceName}
👩‍⚕️ *Especialista:* ${app.specialistName}
📍 *Lugar:* Catheryne Ríos Estética

Por favor responde a este mensaje con un *“CONFIRMO”* para asegurar tu espacio con tu especialista. 💖
¡Te esperamos para consentirte y realzar tu belleza!`
  }

  // Handle WhatsApp Link Dispatch
  const handleSendWhatsApp = (app) => {
    const msg = generateReminderMessage(app)
    const rawPhone = (app.clientPhone || '').replace(/\D/g, '')
    const fullPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone

    const encoded = encodeURIComponent(msg)
    const url = fullPhone ? `https://wa.me/${fullPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`

    // Mark as sent in state
    setSentReminderIds(prev => new Set([...prev, app.id]))

    // Open WhatsApp
    window.open(url, '_blank')
  }

  // Handle Copy Message
  const handleCopyMessage = (app) => {
    const msg = generateReminderMessage(app)
    navigator.clipboard.writeText(msg)
    setCopyToast(app.id)
    setTimeout(() => setCopyToast(null), 2500)
  }

  // Announcements submit
  const handleAddAnnouncement = (e) => {
    e.preventDefault()
    if (!title || !description) return

    addNotification({
      id: `notif-${Date.now()}`,
      title,
      description,
      active: true,
      date: todayStr
    })

    setTitle('')
    setDescription('')
    setShowAddModal(false)
  }

  return (
    <div className={styles.container}>
      
      {/* MAIN HEADER & TAB SWITCHER */}
      <div className={styles.header}>
        <div>
          <h2>🔔 Comunicaciones & Notificaciones</h2>
          <p className={styles.subtitle}>Despacho de recordatorios oficiales por WhatsApp y avisos para clientas</p>
        </div>

        {/* TOP TAB BUTTONS */}
        <div className={styles.tabSwitcher}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'reminders' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reminders')}
          >
            <Smartphone size={16} />
            <span>Recordatorios WhatsApp</span>
            {targetAppointments.length > 0 && (
              <span className={styles.tabBadge}>{targetAppointments.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'announcements' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            <Megaphone size={16} />
            <span>Anuncios & Promociones</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WHATSAPP REMINDERS DISPATCH CENTER */}
      {activeTab === 'reminders' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.tabContent}
        >
          {/* SUB-FILTER BUTTONS ROW */}
          <div className={styles.subFilterRow}>
            <div className={styles.modePillsGroup}>
              <button
                type="button"
                className={`${styles.modePill} ${reminderMode === 'tomorrow' ? styles.modePillActive : ''}`}
                onClick={() => setReminderMode('tomorrow')}
              >
                <span>☀️ Citas de Mañana (Confirmación)</span>
              </button>

              <button
                type="button"
                className={`${styles.modePill} ${reminderMode === 'today' ? styles.modePillActive : ''}`}
                onClick={() => setReminderMode('today')}
              >
                <span>⏰ Citas de Hoy (Aviso de Puntualidad)</span>
              </button>

              <button
                type="button"
                className={`${styles.modePill} ${reminderMode === 'custom' ? styles.modePillActive : ''}`}
                onClick={() => setReminderMode('custom')}
              >
                <span>📅 Fecha Específica</span>
              </button>
            </div>

            {reminderMode === 'custom' && (
              <div className={styles.customDateBox}>
                <label>Seleccionar Fecha:</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* LIVE METRICS STRIP */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Fecha Consultada</span>
              <span className={styles.metricValueDate}>
                {reminderMode === 'tomorrow' ? `Mañana (${tomorrowStr})` : reminderMode === 'today' ? `Hoy (${todayStr})` : activeFilterDate}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Citas a Recordar</span>
              <span className={styles.metricValue}>{totalRemindersCount}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Recordatorios Enviados</span>
              <span className={styles.metricValueGreen}>{sentCount}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Pendientes de Enviar</span>
              <span className={styles.metricValueGold}>{pendingCount}</span>
            </div>
          </div>

          {/* APPOINTMENTS DISPATCH LIST */}
          <div className={styles.remindersSection}>
            <div className={styles.sectionHeader}>
              <h3>
                {reminderMode === 'tomorrow' ? '📋 Citas de Mañana para Confirmar Asistencia' : reminderMode === 'today' ? '⏰ Citas de Hoy para Aviso de Puntualidad' : `📅 Citas del ${activeFilterDate}`}
              </h3>
              <span className={styles.sectionSubtext}>
                Toca "Enviar WhatsApp" para abrir el chat con el mensaje pre-cargado de Catheryne Ríos Estética.
              </span>
            </div>

            {targetAppointments.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <Calendar size={42} className={styles.emptyIcon} />
                <h4>No hay citas programadas para esta fecha</h4>
                <p>No se encontraron citas agendadas en la fecha seleccionada ({activeFilterDate}).</p>
              </div>
            ) : (
              <div className={styles.appointmentsList}>
                {targetAppointments.map(app => {
                  const isSent = sentReminderIds.has(app.id)
                  const cleanPhone = (app.clientPhone || '').replace(/\D/g, '')

                  return (
                    <div
                      key={app.id}
                      className={`${styles.appointmentReminderCard} ${isSent ? styles.cardSent : ''}`}
                    >
                      <div className={styles.timeBadgeBox}>
                        <Clock size={16} />
                        <span className={styles.timeText}>{app.time}</span>
                      </div>

                      <div className={styles.clientDetailsBox}>
                        <div className={styles.clientMainRow}>
                          <strong className={styles.clientName}>{app.clientName}</strong>
                          <span className={styles.clientPhone}>{app.clientPhone || 'Sin teléfono'}</span>
                        </div>

                        <div className={styles.serviceSubRow}>
                          <span className={styles.serviceTag}>💆 {app.serviceName}</span>
                          <span className={styles.specialistTag}>👩‍⚕️ {app.specialistName}</span>
                        </div>
                      </div>

                      <div className={styles.statusBadgeBox}>
                        {isSent ? (
                          <span className={styles.badgeSent}>
                            <CheckCircle2 size={13} />
                            <span>Enviado</span>
                          </span>
                        ) : (
                          <span className={styles.badgePending}>
                            <AlertCircle size={13} />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </div>

                      <div className={styles.actionButtonsBox}>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopyMessage(app)}
                          title="Copiar texto del recordatorio"
                        >
                          <Copy size={14} />
                          <span>{copyToast === app.id ? '¡Copiado!' : 'Copiar'}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.sendWhatsAppBtn}
                          onClick={() => handleSendWhatsApp(app)}
                        >
                          <MessageCircle size={16} />
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 2: PUBLIC ANNOUNCEMENTS & BANNERS */}
      {activeTab === 'announcements' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.tabContent}
        >
          <div className={styles.announcementsTopRow}>
            <div>
              <h3>Gestión de Anuncios & Promociones Web</h3>
              <p className={styles.subtext}>Publica avisos especiales y novedades visibles para las clientas en la página web.</p>
            </div>

            <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Crear Anuncio</span>
            </button>
          </div>

          <div className={styles.cardsGrid}>
            {notifications.length === 0 ? (
              <div className={styles.emptyCard}>
                <Bell size={40} className={styles.emptyIcon} />
                <h4>No hay anuncios activos</h4>
                <p>Pulsa "Crear Anuncio" para publicar un nuevo aviso de promoción o novedad.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`${styles.notifCard} ${!n.active ? styles.cardInactive : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleGroup}>
                      <Megaphone size={18} className={styles.goldMegaphone} />
                      <h4>{n.title}</h4>
                    </div>
                    
                    <div className={styles.actionsGroup}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => toggleNotificationActive(n.id)}
                        aria-label="Activar/Desactivar"
                      >
                        {n.active ? (
                          <ToggleRight size={24} className={styles.toggleActiveIcon} />
                        ) : (
                          <ToggleLeft size={24} className={styles.toggleInactiveIcon} />
                        )}
                      </button>

                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteNotification(n.id)}
                        aria-label="Eliminar anuncio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className={styles.description}>{n.description}</p>
                  <span className={styles.dateTag}>Publicado: {n.date}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Publicar Nuevo Anuncio</h3>
            
            <form onSubmit={handleAddAnnouncement} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Título del Anuncio / Promoción</label>
                <input
                  type="text"
                  placeholder="Ej. ✨ 20% OFF en Limpieza Facial de Temporada"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Detalle / Descripción</label>
                <textarea
                  rows="3"
                  placeholder="Ej. Válido durante todo el mes de Agosto agendando de Lunes a Jueves..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Publicar Anuncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
