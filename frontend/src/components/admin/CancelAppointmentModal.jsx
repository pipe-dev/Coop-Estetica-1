import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ShieldAlert, Ban, Calendar, User, Clock } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import styles from './CancelAppointmentModal.module.css'

export default function CancelAppointmentModal({ appointment, onClose }) {
  const { teamMembers = [], cancelAppointment } = useAdmin()

  const [reason, setReason] = useState('Clienta canceló con anticipación')
  const [details, setDetails] = useState('')
  const [responsibleName, setResponsibleName] = useState(teamMembers[0]?.name || 'Administración')

  if (!appointment) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) return

    cancelAppointment(appointment.id, {
      reason,
      details: details.trim(),
      responsibleName
    })

    alert(`¡Cita de "${appointment.clientName}" anulada correctamente! Se ha registrado el evento de auditoría en el Historial.`)
    onClose()
  }

  return (
    <AnimatePresence>
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={styles.modalCard}
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className={styles.modalHeader}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.warningBadge}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Anulación Auditada de Cita</h3>
                <p className={styles.modalSubtitle}>Esta acción quedará grabada en el historial inmutable de auditoría</p>
              </div>
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className={styles.modalBody}>
            {/* APPOINTMENT SUMMARY CARD */}
            <div className={styles.appSummaryCard}>
              <div className={styles.summaryRow}>
                <span>Clienta:</span>
                <strong>{appointment.clientName} ({appointment.clientPhone || 'Sin teléfono'})</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Servicio:</span>
                <strong>{appointment.serviceName}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Especialista:</span>
                <strong>{appointment.specialistName}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Horario:</span>
                <span>{appointment.date} • {appointment.time}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Valor del Servicio:</span>
                <span className={styles.priceTag}>${(appointment.price || 0).toLocaleString()} COP</span>
              </div>
            </div>

            {/* AUDIT NOTICE */}
            <div className={styles.auditNoticeBox}>
              <AlertTriangle size={18} />
              <span>Para prevenir cobros no registrados o fraude, es obligatorio especificar el motivo real y el responsable.</span>
            </div>

            {/* FORM */}
            <form id="cancelAppForm" onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Motivo Principal de la Anulación *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} required>
                  <option value="Clienta canceló con anticipación">Clienta canceló con anticipación</option>
                  <option value="No asistió a la cita (No-Show / Inasistencia)">No asistió a la cita (No-Show / Inasistencia)</option>
                  <option value="Reprogramación de fecha y hora">Reprogramación de fecha y hora</option>
                  <option value="Emergencia / Fuerza mayor del Spa">Emergencia / Fuerza mayor del Spa</option>
                  <option value="Error involuntario al agendar">Error involuntario al agendar</option>
                  <option value="Otro motivo justificado">Otro motivo justificado</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Responsable que Autoriza la Anulación *</label>
                <select value={responsibleName} onChange={e => setResponsibleName(e.target.value)} required>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                  <option value="Administración General">Administración General</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Explicación Detallada / Justificación (Opcional)</label>
                <textarea
                  placeholder="Ej. La clienta avisó por WhatsApp 2 horas antes debido a lluvia fuerte..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Conservar Cita
            </button>
            <button type="submit" form="cancelAppForm" className={styles.confirmCancelBtn}>
              <Ban size={16} />
              <span>Confirmar Anulación Auditada</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
