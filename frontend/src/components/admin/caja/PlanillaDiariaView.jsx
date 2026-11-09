import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  DollarSign, 
  TrendingDown, 
  Plus, 
  Printer, 
  Scissors, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'
import { useAdmin } from '../../../context/AdminContext'
import api from '../../../services/api'
import { formatCOP, formatCOPInput, parseCOPInput, getLocalDateString } from '../../../utils/currencyUtils'
import styles from './PlanillaDiariaView.module.css'

export default function PlanillaDiariaView() {
  const { appointments, transactions, teamMembers, serviceCategories, addTransaction } = useAdmin()
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString())
  const [matrixData, setMatrixData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Modales
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Gastos Operativos')

  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceSpecId, setAdvanceSpecId] = useState('')
  const [advanceNotes, setAdvanceNotes] = useState('')

  // Cargar datos en vivo desde el Backend
  const loadDailyMatrix = async (date) => {
    setLoading(true)
    try {
      const data = await api.getDailyMatrix(date)
      if (data && !data.error) {
        setMatrixData(data)
      } else {
        setMatrixData(null)
      }
    } catch (e) {
      console.warn('Cargando fallback local de planilla diaria:', e)
      setMatrixData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDailyMatrix(selectedDate)
  }, [selectedDate, appointments, transactions])

  // Fallback offline resiliente: calcular matriz con el estado local si la API está en espera
  const fallbackMatrix = useMemo(() => {
    const dayApps = appointments.filter(a => a.date === selectedDate && a.status !== 'Cancelada')
    const dayTx = transactions.filter(t => {
      const d = typeof t.date === 'string' ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10)
      return d === selectedDate
    })

    const rows = dayApps.map(a => {
      const price = Number(a.price) || 0
      const commissionAmount = Number(a.commissionAmount) || 0
      const supplyCost = Number(a.supplyCost) || 0
      const aestheticAmount = a.aestheticAmount !== null && a.aestheticAmount !== undefined
        ? Number(a.aestheticAmount)
        : (price - commissionAmount)
      const paymentMethod = a.paymentMethod || 'Efectivo'
      const matchedCat = serviceCategories.find(c => (c.services || []).some(s => s.id === a.serviceId || s.name === a.serviceName))
      const categoryName = matchedCat?.name || 'OTROS'

      return {
        id: a.id,
        clientName: a.clientName,
        serviceName: a.serviceName,
        categoryName,
        price,
        commissionAmount,
        supplyCost,
        aestheticAmount,
        specialistId: a.specialistId,
        specialistName: a.specialistName,
        paymentMethod,
        time: a.time,
        status: a.status
      }
    })

    const activeSpecs = teamMembers.filter(s => s.active)
    const specialistTotals = {}
    activeSpecs.forEach(s => {
      specialistTotals[s.id] = { id: s.id, name: s.name, totalCommission: 0, count: 0 }
    })
    rows.forEach(r => {
      if (specialistTotals[r.specialistId]) {
        specialistTotals[r.specialistId].totalCommission += r.commissionAmount
        specialistTotals[r.specialistId].count += 1
      }
    })

    const expenses = dayTx.filter(t => t.type === 'Egreso' && t.category !== 'Anticipo Especialista' && t.category !== 'Liquidación Nómina')
    const advances = dayTx.filter(t => t.category === 'Anticipo Especialista')

    const totalGross = rows.reduce((acc, r) => acc + r.price, 0)
    const totalSpecialists = rows.reduce((acc, r) => acc + r.commissionAmount, 0)
    const totalSupplies = rows.reduce((acc, r) => acc + r.supplyCost, 0)
    const subtotalAesthetic = rows.reduce((acc, r) => acc + r.aestheticAmount, 0)
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
    const netAesthetic = subtotalAesthetic - totalExpenses

    const electronicTotal = rows.filter(r => r.paymentMethod !== 'Efectivo').reduce((acc, r) => acc + r.price, 0)
    const cashTotal = rows.filter(r => r.paymentMethod === 'Efectivo').reduce((acc, r) => acc + r.price, 0)
    const efectivoDelDia = subtotalAesthetic - electronicTotal

    return {
      date: selectedDate,
      specialists: activeSpecs.map(s => ({ id: s.id, name: s.name })),
      rows,
      specialistTotals,
      expenses,
      advances,
      summary: {
        totalGross,
        totalSpecialists,
        totalSupplies,
        subtotalAesthetic,
        totalExpenses,
        netAesthetic,
        electronicTotal,
        cashTotal,
        efectivoDelDia
      }
    }
  }, [appointments, transactions, selectedDate, teamMembers, serviceCategories])

  const activeData = matrixData || fallbackMatrix
  const rows = activeData.rows || []
  const specialists = activeData.specialists || []
  const summary = activeData.summary || {}
  const expenses = activeData.expenses || []
  const advances = activeData.advances || []
  const specialistTotals = activeData.specialistTotals || {}

  // Agrupar filas por categoría (ej. UÑAS, PELUQUERÍA / OTROS, FACIAL)
  const groupedRows = useMemo(() => {
    const groups = {}
    rows.forEach(r => {
      const cat = r.categoryName || 'OTROS'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(r)
    })
    return groups
  }, [rows])

  // Handlers para gastos y anticipos
  const handleCreateExpenseSubmit = async (e) => {
    e.preventDefault()
    const amt = parseCOPInput(expenseAmount)
    if (!amt || !expenseDesc) return

    const newTx = {
      id: `tx-exp-${Date.now()}`,
      type: 'Egreso',
      amount: amt,
      description: expenseDesc,
      category: expenseCategory,
      paymentMethod: 'Efectivo',
      date: selectedDate
    }

    addTransaction(newTx)
    await api.createCashExpense({
      amount: amt,
      description: expenseDesc,
      category: expenseCategory,
      paymentMethod: 'Efectivo'
    })

    setShowExpenseModal(false)
    setExpenseAmount('')
    setExpenseDesc('')
    loadDailyMatrix(selectedDate)
  }

  const handleCreateAdvanceSubmit = async (e) => {
    e.preventDefault()
    const amt = parseCOPInput(advanceAmount)
    const spec = specialists.find(s => s.id === advanceSpecId)
    if (!amt || !spec) return

    const newTx = {
      id: `tx-adv-${Date.now()}`,
      type: 'Egreso',
      amount: amt,
      description: advanceNotes ? `Anticipo a ${spec.name}: ${advanceNotes}` : `Anticipo de caja a ${spec.name}`,
      category: 'Anticipo Especialista',
      paymentMethod: 'Efectivo',
      specialistId: spec.id,
      specialistName: spec.name,
      date: selectedDate
    }

    addTransaction(newTx)
    await api.createCashAdvance({
      specialistId: spec.id,
      specialistName: spec.name,
      amount: amt,
      notes: advanceNotes
    })

    setShowAdvanceModal(false)
    setAdvanceAmount('')
    setAdvanceNotes('')
    loadDailyMatrix(selectedDate)
  }

  return (
    <div className={styles.container}>
      {/* BARRA SUPERIOR: SELECTOR DE FECHA & ACCIONES */}
      <div className={styles.topControls}>
        <div className={styles.datePickerBox}>
          <Calendar size={18} style={{ color: '#D4AF37' }} />
          <span className={styles.datePickerLabel}>Fecha de Planilla:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
          <button 
            type="button" 
            className={styles.quickDateBtn}
            onClick={() => setSelectedDate(getLocalDateString())}
          >
            Hoy
          </button>
        </div>

        <div className={styles.actionBtnGroup}>
          <button 
            type="button" 
            className={styles.secondaryBtn}
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={15} />
            <span>+ Registrar Gasto</span>
          </button>
          <button 
            type="button" 
            className={styles.secondaryBtn}
            onClick={() => setShowAdvanceModal(true)}
          >
            <Plus size={15} />
            <span>+ Anticipo a Especialista</span>
          </button>
          <button 
            type="button" 
            className={styles.primaryGoldBtn}
            onClick={() => window.print()}
          >
            <Printer size={15} />
            <span>Imprimir Planilla</span>
          </button>
        </div>
      </div>

      {/* KPIS DE RESUMEN EJECUTIVO (IDÉNTICO AL BALANCE DE EXCEL) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Total Bruto Cobrado</span>
          <span className={`${styles.kpiValue} ${styles.kpiGold}`}>{formatCOP(summary.totalGross || 0)}</span>
          <span className={styles.kpiSub}>{rows.length} procedimientos realizados</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Total a Especialistas</span>
          <span className={`${styles.kpiValue} ${styles.kpiBlue}`}>{formatCOP(summary.totalSpecialists || 0)}</span>
          <span className={styles.kpiSub}>Comisiones acumuladas del día</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Insumos Directos</span>
          <span className={`${styles.kpiValue} ${styles.kpiOrange}`}>{formatCOP(summary.totalSupplies || 0)}</span>
          <span className={styles.kpiSub}>Costo de materiales deducido</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Gastos del Día</span>
          <span className={`${styles.kpiValue} ${styles.kpiRed}`}>{formatCOP(summary.totalExpenses || 0)}</span>
          <span className={styles.kpiSub}>{expenses.length} egresos operativos</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Neto Estética (Final)</span>
          <span className={`${styles.kpiValue} ${styles.kpiGreen}`}>{formatCOP(summary.netAesthetic || 0)}</span>
          <span className={styles.kpiSub}>Subtotal Estética - Gastos</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Efectivo vs. Bancos</span>
          <span className={styles.kpiValue} style={{ fontSize: '1.05rem' }}>
            💵 {formatCOP(summary.cashTotal || 0)} | 📱 {formatCOP(summary.electronicTotal || 0)}
          </span>
          <span className={styles.kpiSub} style={{ color: (summary.efectivoDelDia || 0) < 0 ? '#F87171' : '#34D399' }}>
            Diferencia en cajón: {formatCOP(summary.efectivoDelDia || 0)}
          </span>
        </div>
      </div>

      {/* MATRIZ DE SERVICIOS (TABLA ESTILO EXCEL) */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <h3>
            <FileSpreadsheet size={18} style={{ color: '#D4AF37' }} />
            <span>Planilla Diaria de Liquidación • {selectedDate}</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#A3A3A3' }}>
            {rows.length === 0 ? 'Sin servicios registrados hoy' : `${rows.length} procedimientos registrados`}
          </span>
        </div>

        <div className={styles.tableScrollWrapper}>
          <table className={styles.excelTable}>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>CATEGORÍA</th>
                <th>PROCEDIMIENTO / SERVICIO</th>
                <th style={{ textAlign: 'right' }}>VALOR TOTAL</th>
                {specialists.map(s => (
                  <th key={s.id} className={styles.specColumnHeader}>
                    {s.name.toUpperCase()}
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>ESTÉTICA</th>
                <th style={{ textAlign: 'right' }}>INSUMOS</th>
                <th style={{ textAlign: 'center' }}>MEDIO PAGO</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6 + specialists.length} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    No hay citas marcadas como "Pagada" o finalizadas en esta fecha ({selectedDate}).
                  </td>
                </tr>
              ) : (
                Object.keys(groupedRows).map(categoryName => (
                  <React.Fragment key={categoryName}>
                    {/* ENCABEZADO DE GRUPO/CATEGORÍA (UÑAS, OTROS, FACIAL) */}
                    <tr className={styles.categorySectionRow}>
                      <td colSpan={6 + specialists.length}>
                        🏷️ {categoryName}
                      </td>
                    </tr>

                    {groupedRows[categoryName].map(row => (
                      <tr key={row.id}>
                        <td style={{ color: '#A3A3A3', fontSize: '0.76rem' }}>{row.categoryName}</td>
                        <td style={{ fontWeight: 600 }}>
                          {row.serviceName}
                          <small style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>
                            {row.clientName} ({row.time})
                          </small>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>
                          {formatCOP(row.price)}
                        </td>

                        {/* COLUMNAS DE ESPECIALISTAS */}
                        {specialists.map(s => {
                          const isAssigned = row.specialistId === s.id
                          return (
                            <td key={s.id} className={styles.specColumnCell}>
                              {isAssigned ? (
                                <span style={{ color: '#60A5FA', fontWeight: 700 }}>
                                  {formatCOP(row.commissionAmount)}
                                </span>
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.1)' }}>-</span>
                              )}
                            </td>
                          )
                        })}

                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#34D399' }}>
                          {formatCOP(row.aestheticAmount)}
                        </td>
                        <td style={{ textAlign: 'right', color: row.supplyCost > 0 ? '#F59E0B' : '#666' }}>
                          {row.supplyCost > 0 ? formatCOP(row.supplyCost) : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.paymentTag} ${row.paymentMethod === 'Efectivo' ? styles.tagCash : styles.tagElectronic}`}>
                            {row.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}

              {/* FILA DE SUBTOTALES */}
              {rows.length > 0 && (
                <tr className={styles.subtotalsRow}>
                  <td colSpan={2}>SUBTOTALES DEL DÍA:</td>
                  <td style={{ textAlign: 'right' }}>{formatCOP(summary.totalGross || 0)}</td>
                  {specialists.map(s => (
                    <td key={s.id} style={{ textAlign: 'right', color: '#60A5FA' }}>
                      {formatCOP(specialistTotals[s.id]?.totalCommission || 0)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', color: '#34D399' }}>
                    {formatCOP(summary.subtotalAesthetic || 0)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#F59E0B' }}>
                    {formatCOP(summary.totalSupplies || 0)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANELES INFERIORES: GASTOS DEL DÍA & LIQUIDACIÓN A ESPECIALISTAS */}
      <div className={styles.bottomPanelsGrid}>
        {/* PANEL IZQUIERDO: GASTOS DE CAJA Y CONCEPTO */}
        <div className={styles.subCard}>
          <div className={styles.subCardHeader}>
            <h4>
              <TrendingDown size={16} style={{ color: '#F87171' }} />
              <span>Gastos del Día ({expenses.length})</span>
            </h4>
            <button 
              type="button" 
              className={styles.miniAddBtn}
              onClick={() => setShowExpenseModal(true)}
            >
              <Plus size={13} />
              <span>Gasto</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <p className={styles.emptyMsg}>No hay gastos operativos registrados hoy.</p>
          ) : (
            <div>
              {expenses.map(e => (
                <div key={e.id} className={styles.expenseItem}>
                  <div className={styles.expenseDesc}>
                    <span>{e.description}</span>
                    <small style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>
                      {e.category} • {e.paymentMethod}
                    </small>
                  </div>
                  <span className={styles.expenseVal}>- {formatCOP(e.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 700 }}>
                <span>Total Gastos de Caja:</span>
                <span style={{ color: '#F87171' }}>- {formatCOP(summary.totalExpenses || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO: LIQUIDACIÓN NETA A ESPECIALISTAS Y ANTICIPOS */}
        <div className={styles.subCard}>
          <div className={styles.subCardHeader}>
            <h4>
              <Scissors size={16} style={{ color: '#60A5FA' }} />
              <span>Liquidación Neta a Pagar a Especialistas</span>
            </h4>
            <button 
              type="button" 
              className={styles.miniAddBtn}
              onClick={() => setShowAdvanceModal(true)}
            >
              <Plus size={13} />
              <span>Anticipo</span>
            </button>
          </div>

          <div>
            {specialists.map(s => {
              const earned = specialistTotals[s.id]?.totalCommission || 0
              const specAdvances = advances.filter(a => a.specialistId === s.id)
              const totalAdv = specAdvances.reduce((acc, a) => acc + a.amount, 0)
              const netToPay = Math.max(0, earned - totalAdv)

              if (earned === 0 && totalAdv === 0) return null

              return (
                <div key={s.id} className={styles.specPayoutItem}>
                  <div className={styles.specPayoutDetails}>
                    <span className={styles.specPayoutName}>{s.name}</span>
                    <span className={styles.specPayoutBreakdown}>
                      Ganó: {formatCOP(earned)}
                      {totalAdv > 0 && ` | Anticipos: - ${formatCOP(totalAdv)}`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.specNetTotal}>{formatCOP(netToPay)}</span>
                    <small style={{ display: 'block', color: '#888', fontSize: '0.7rem' }}>Neto a entregar</small>
                  </div>
                </div>
              )
            })}
            {Object.values(specialistTotals).every(s => s.totalCommission === 0) && advances.length === 0 && (
              <p className={styles.emptyMsg}>No hay liquidaciones pendientes para hoy.</p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR GASTO */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className={styles.modalOverlay} onClick={() => setShowExpenseModal(false)}>
            <motion.div 
              className={styles.modalBox}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>+ Registrar Gasto Operativo de Caja</h3>
              <form onSubmit={handleCreateExpenseSubmit}>
                <div className={styles.formGroup}>
                  <label>Monto del Gasto ($ COP)</label>
                  <input
                    type="text"
                    placeholder="Ej. 9.000"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(formatCOPInput(e.target.value))}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Concepto o Descripción Detallada</label>
                  <input
                    type="text"
                    placeholder="Ej. Ambientador, bolsas de basura, bono, etc."
                    value={expenseDesc}
                    onChange={e => setExpenseDesc(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select 
                    value={expenseCategory} 
                    onChange={e => setExpenseCategory(e.target.value)}
                  >
                    <option value="Gastos Operativos">Gastos Operativos / Aseo</option>
                    <option value="Insumos">Compra de Insumos</option>
                    <option value="Bonos">Bonos o Incentivos</option>
                    <option value="Servicios Públicos">Servicios Públicos</option>
                    <option value="Otro">Otro Egreso</option>
                  </select>
                </div>

                <div className={styles.modalBtnRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowExpenseModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.primaryGoldBtn}>
                    Guardar Gasto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL REGISTRAR ANTICIPO A ESPECIALISTA */}
      <AnimatePresence>
        {showAdvanceModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAdvanceModal(false)}>
            <motion.div 
              className={styles.modalBox}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>+ Entregar Anticipo a Especialista</h3>
              <form onSubmit={handleCreateAdvanceSubmit}>
                <div className={styles.formGroup}>
                  <label>Especialista</label>
                  <select 
                    value={advanceSpecId} 
                    onChange={e => setAdvanceSpecId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar Profesional --</option>
                    {specialists.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Monto de Anticipo ($ COP)</label>
                  <input
                    type="text"
                    placeholder="Ej. 15.000"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(formatCOPInput(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo o Nota (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Adelanto para almuerzo / transporte"
                    value={advanceNotes}
                    onChange={e => setAdvanceNotes(e.target.value)}
                  />
                </div>

                <div className={styles.modalBtnRow}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowAdvanceModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.primaryGoldBtn}>
                    Registrar Anticipo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
