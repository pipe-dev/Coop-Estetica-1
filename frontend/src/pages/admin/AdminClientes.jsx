import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Phone, MessageSquare, Plus, Search, Calendar, DollarSign, FileText, Star, Clock, UserPlus, ExternalLink, Download } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { exportClientsDirectory } from '../../utils/exportUtils'
import styles from './AdminClientes.module.css'

export default function AdminClientes() {
  const { clients, appointments, transactions, addClient } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null)
  
  // Add client modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  // Calculate stats for each client
  const enrichedClients = clients.map(client => {
    // Find all appointments matching client name or phone
    const clientApps = appointments.filter(a => 
      a.clientName.toLowerCase() === client.name.toLowerCase() || 
      (a.clientPhone && client.phone && a.clientPhone.replace(/\D/g, '') === client.phone.replace(/\D/g, ''))
    )

    const completedApps = clientApps.filter(a => a.status === 'Pagada')
    const totalSpent = completedApps.reduce((acc, a) => acc + (a.price || 0), 0)
    
    // Sort appointments by date to find last visit
    const sortedApps = [...clientApps].sort((a, b) => b.date.localeCompare(a.date))
    const lastVisit = sortedApps[0]?.date || client.registeredAt || 'Sin visitas'

    return {
      ...client,
      totalVisits: clientApps.length,
      completedVisits: completedApps.length,
      totalSpent,
      lastVisit,
      appointmentHistory: sortedApps
    }
  })

  // Filter clients
  const filteredClients = enrichedClients.filter(c => {
    const term = searchTerm.toLowerCase()
    return c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.notes && c.notes.toLowerCase().includes(term))
  })

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!name || !phone) return

    addClient({
      id: `client-${Date.now()}`,
      name,
      phone,
      email: email || '',
      notes: notes || 'Sin notas registradas.',
      registeredAt: todayStr
    })

    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setShowAddModal(false)
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h2>👥 Directorio & Ficha de Clientas</h2>
          <p className={styles.subtitle}>Gestión de clientes, historial de visitas, llamadas directas y contacto por WhatsApp</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => exportClientsDirectory(clients, appointments)}
            title="Descargar directorio completo de clientas en Excel / CSV"
          >
            <Download size={15} />
            <span>Exportar Clientas</span>
          </button>

          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} />
            <span>Registrar Nueva Clienta</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o notas clínicas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <span className={styles.totalBadge}>{filteredClients.length} Clientas Registradas</span>
      </div>

      {/* CLIENTS GRID */}
      <div className={styles.clientsGrid}>
        {filteredClients.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={40} className={styles.emptyIcon} />
            <p>No se encontraron clientas con el criterio de búsqueda.</p>
          </div>
        ) : (
          filteredClients.map(client => {
            // Clean phone for WhatsApp (+57 Colombia prefix)
            const cleanPhoneDigits = client.phone.replace(/\D/g, '')
            const fullPhoneCO = cleanPhoneDigits.startsWith('57') ? cleanPhoneDigits : `57${cleanPhoneDigits}`
            const waMessage = encodeURIComponent(`Hola ${client.name}, te saludamos de Catheryne Ríos Estética. ¡Esperamos que estés teniendo un excelente día! 🌸`)
            const waUrl = `https://wa.me/${fullPhoneCO}?text=${waMessage}`
            const telUrl = `tel:+${fullPhoneCO}`

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.clientCard}
              >
                {/* CARD HEADER */}
                <div className={styles.cardHeader}>
                  <div className={styles.avatarCircle}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  <div className={styles.clientTitleInfo}>
                    <div className={styles.nameRow}>
                      <h3>{client.name}</h3>
                      {client.totalSpent >= 200000 && (
                        <span className={styles.vipBadge}>
                          <Star size={11} />
                          <span>VIP</span>
                        </span>
                      )}
                    </div>
                    <span className={styles.phoneText}>📞 {client.phone}</span>
                  </div>
                </div>

                {/* STATS ROW */}
                <div className={styles.statsRow}>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Visitas</span>
                    <span className={styles.statVal}>{client.completedVisits} citas</span>
                  </div>

                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Total Invertido</span>
                    <span className={styles.statValGold}>${client.totalSpent.toLocaleString()} COP</span>
                  </div>

                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Última Visita</span>
                    <span className={styles.statVal}>{client.lastVisit}</span>
                  </div>
                </div>

                {/* NOTES BOX */}
                {client.notes && (
                  <div className={styles.notesBox}>
                    <FileText size={13} className={styles.notesIcon} />
                    <span>{client.notes}</span>
                  </div>
                )}

                {/* DIRECT ACTION BUTTONS (LLAMAR & WHATSAPP) */}
                <div className={styles.cardActions}>
                  <a
                    href={telUrl}
                    className={styles.callBtn}
                    title={`Llamar directamente a ${client.name}`}
                  >
                    <Phone size={15} />
                    <span>Llamar</span>
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.waBtn}
                    title={`Enviar WhatsApp directo a ${client.name}`}
                  >
                    <MessageSquare size={15} />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    className={styles.historyBtn}
                    onClick={() => setSelectedClientForHistory(client)}
                    title="Ver expediente e historial de citas"
                  >
                    <Clock size={15} />
                    <span>Historial</span>
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Registrar Nueva Clienta</h3>
            
            <form onSubmit={handleAddSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre Completo de la Clienta</label>
                <input
                  type="text"
                  placeholder="Ej. Ana María Suárez"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. 3001234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="Ej. anamaria@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Notas Clínicas / Preferencias de Piel y Tratamiento</label>
                <textarea
                  placeholder="Ej. Piel sensible, prefiere tonos claros en uñas, alérgica a fragancias fuertes."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Guardar Clienta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT HISTORY EXPEDIENT MODAL */}
      {selectedClientForHistory && (
        <div className={styles.modalOverlay} onClick={() => setSelectedClientForHistory(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Expediente de {selectedClientForHistory.name}</h3>
                <p className={styles.modalSub}>📞 {selectedClientForHistory.phone} • Total Invertido: ${selectedClientForHistory.totalSpent.toLocaleString()} COP</p>
              </div>
            </div>

            <div className={styles.expedientSection}>
              <h4>Historial de Citas & Servicios ({selectedClientForHistory.appointmentHistory.length})</h4>

              {selectedClientForHistory.appointmentHistory.length === 0 ? (
                <p className={styles.noHistoryText}>No registra citas previas agendadas en el sistema.</p>
              ) : (
                <div className={styles.historyList}>
                  {selectedClientForHistory.appointmentHistory.map(app => (
                    <div key={app.id} className={styles.historyItem}>
                      <div className={styles.historyItemHeader}>
                        <span className={styles.historyService}>{app.serviceName}</span>
                        <span className={styles.historyPrice}>${(app.price || 0).toLocaleString()} COP</span>
                      </div>
                      <div className={styles.historyMeta}>
                        <span>📅 {app.date} • ⏰ {app.time}</span>
                        <span>👩‍🎨 {app.specialistName}</span>
                        <span className={styles.historyStatus}>{app.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalBtnGroup}>
              <button className={styles.closeBtn} onClick={() => setSelectedClientForHistory(null)}>
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
