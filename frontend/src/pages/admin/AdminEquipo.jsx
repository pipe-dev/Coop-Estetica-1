import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Plus, CheckCircle2, Award, Shield, Settings2, Sparkles, TrendingUp, Download } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { getLocalDateString } from '../../utils/currencyUtils'
import { exportPayrollReport } from '../../utils/exportUtils'
import styles from './AdminEquipo.module.css'

export default function AdminEquipo() {
  const {
    teamMembers = [],
    appointments = [],
    addTransaction,
    addTeamMember,
    updateTeamMember
  } = useAdmin()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [commissionRate, setCommissionRate] = useState(40)
  const [color, setColor] = useState('#D4AF37')

  // Calculate accrued commissions per specialist based on paid/completed appointments
  const calculateCommissionForMember = (memberId, rate = 40) => {
    const validApps = appointments.filter(a => a.specialistId === memberId && (a.status === 'Pagada' || a.status === 'Finalizada'))
    const totalGenerated = validApps.reduce((acc, a) => acc + (Number(a.price) || 0), 0)
    const commissionAmount = Math.round((totalGenerated * rate) / 100)
    const salonRetention = totalGenerated - commissionAmount

    return {
      finishedCount: validApps.length,
      totalGenerated,
      commissionAmount,
      salonRetention
    }
  }

  // Summary metrics across all team members
  const allStats = teamMembers.map(m => calculateCommissionForMember(m.id, m.commissionRate))
  const totalBilledAll = allStats.reduce((acc, s) => acc + s.totalGenerated, 0)
  const totalPayrollAll = allStats.reduce((acc, s) => acc + s.commissionAmount, 0)
  const totalCompletedApps = allStats.reduce((acc, s) => acc + s.finishedCount, 0)

  const handlePayWorker = (member, stats) => {
    if (stats.commissionAmount <= 0) {
      alert(`No hay saldo acumulado de nómina para liquidar a ${member.name}.`)
      return
    }

    if (window.confirm(`¿Confirmar liquidación y pago de nómina por $${stats.commissionAmount.toLocaleString()} COP a favor de ${member.name}?`)) {
      if (addTransaction) {
        addTransaction({
          id: `tx-pay-${Date.now()}`,
          type: 'Egreso',
          amount: stats.commissionAmount,
          description: `Pago de Nómina & Comisiones a ${member.name}`,
          category: 'Nómina',
          paymentMethod: 'Efectivo',
          date: getLocalDateString()
        })
      }
      alert(`¡Pago de Nómina por $${stats.commissionAmount.toLocaleString()} COP registrado exitosamente en Caja a favor de ${member.name}!`)
    }
  }

  const handleAddMemberSubmit = (e) => {
    e.preventDefault()
    if (!name || !role) return

    addTeamMember({
      id: `team-${Date.now()}`,
      name,
      role,
      commissionRate: parseFloat(commissionRate) || 40,
      color: color || '#D4AF37',
      active: true
    })

    setName('')
    setRole('')
    setCommissionRate(40)
    setShowAddModal(false)
  }

  return (
    <div className={styles.equipoContainer}>
      
      {/* HEADER ROW */}
      <div className={styles.topRow}>
        <div>
          <h3>Equipo, Nómina & Comisiones</h3>
          <p className={styles.subtext}>Administra los porcentajes de comisión, liquidación directa a caja y altas de especialistas.</p>
        </div>

        <div className={styles.headerBtns}>
          <button
            type="button"
            className={styles.exportPayrollBtn}
            onClick={() => exportPayrollReport(teamMembers, appointments)}
            title="Descargar reporte de nómina y comisiones en Excel / CSV"
          >
            <Download size={15} />
            <span>Exportar Nómina</span>
          </button>

          <button className={styles.addMemberBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Agregar Especialista</span>
          </button>
        </div>
      </div>

      {/* TOP SUMMARY STATS */}
      <div className={styles.summaryStatsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Especialistas Activas</span>
          <span className={styles.metricValue}>{teamMembers.length}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Citas Pagadas Realizadas</span>
          <span className={styles.metricValue}>{totalCompletedApps} Citas</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Facturado Bruto</span>
          <span className={styles.metricValue}>${totalBilledAll.toLocaleString()} COP</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Nómina Total a Liquidar</span>
          <span className={styles.metricValueGold}>${totalPayrollAll.toLocaleString()} COP</span>
        </div>
      </div>

      {/* WORKERS GRID */}
      <div className={styles.workersGrid}>
        {teamMembers.map(member => {
          const stats = calculateCommissionForMember(member.id, member.commissionRate)

          return (
            <div key={member.id} className={styles.workerCard}>
              <div className={styles.cardHeader}>
                <div
                  className={styles.avatarCircle}
                  style={{
                    borderColor: member.color || 'var(--color-gold)',
                    color: member.color || 'var(--color-gold)'
                  }}
                >
                  {member.name.charAt(0)}
                </div>
                <div className={styles.headerInfo}>
                  <h4 className={styles.workerName}>{member.name}</h4>
                  <span className={styles.workerRole}>{member.role}</span>
                </div>
                
                <div className={styles.rateBadgeRow}>
                  <span className={styles.commissionBadge}>{member.commissionRate}%</span>
                  <button
                    type="button"
                    className={styles.editRateBtn}
                    title="Modificar porcentaje de comisión"
                    onClick={() => {
                      const newRate = prompt(`Actualizar % de comisión para ${member.name}:`, member.commissionRate)
                      if (newRate !== null) {
                        const parsed = parseFloat(newRate)
                        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                          updateTeamMember(member.id, { commissionRate: parsed })
                        }
                      }
                    }}
                  >
                    Editar %
                  </button>
                </div>
              </div>

              <div className={styles.statsBox}>
                <div className={styles.statRow}>
                  <span>Citas Pagadas Atendidas:</span>
                  <strong>{stats.finishedCount} Citas</strong>
                </div>

                <div className={styles.statRow}>
                  <span>Total Facturado Bruto:</span>
                  <strong className={styles.goldText}>${stats.totalGenerated.toLocaleString()} COP</strong>
                </div>

                <div className={styles.divider} />

                <div className={styles.payHighlightBox}>
                  <span className={styles.payLabel}>Pago Neto a Entregar (Nómina):</span>
                  <span className={styles.payAmount}>${stats.commissionAmount.toLocaleString()} <small>COP</small></span>
                </div>

                <div className={styles.salonRetentionRow}>
                  <span>Retención Neta para la Estética:</span>
                  <span>${stats.salonRetention.toLocaleString()} COP</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.payBtn}
                  onClick={() => handlePayWorker(member, stats)}
                  disabled={stats.commissionAmount === 0}
                >
                  <DollarSign size={16} />
                  <span>Liquidar & Pagar Nómina</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Agregar Nueva Especialista</h3>
            
            <form onSubmit={handleAddMemberSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Laura Restrepo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Especialidad / Rol</label>
                  <input
                    type="text"
                    placeholder="Ej. Cosmiatra & Maquilladora"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>% Comisión</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej. 40"
                    value={commissionRate}
                    onChange={e => setCommissionRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Color Identificador de Agenda</label>
                <select value={color} onChange={e => setColor(e.target.value)}>
                  <option value="#D4AF37">Dorado Luxury (#D4AF37)</option>
                  <option value="#EC4899">Rosa Glam (#EC4899)</option>
                  <option value="#8B5CF6">Morado Lavanda (#8B5CF6)</option>
                  <option value="#3B82F6">Azul Zafiro (#3B82F6)</option>
                  <option value="#10B981">Verde Esmeralda (#10B981)</option>
                </select>
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar Especialista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
