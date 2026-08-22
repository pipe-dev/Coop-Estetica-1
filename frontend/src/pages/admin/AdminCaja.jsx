import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, Calendar, Lock, Unlock, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, Download, Plus, History, Scale, FileCheck2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput, getLocalDateString } from '../../utils/currencyUtils'
import { exportCajaTransactions } from '../../utils/exportUtils'
import ExecutiveAnalyticsModal from '../../components/admin/ExecutiveAnalyticsModal'
import styles from './AdminCaja.module.css'

export default function AdminCaja() {
  const [selectedAnalyticsCard, setSelectedAnalyticsCard] = useState(null)
  const {
    transactions,
    teamMembers,
    cashSessions,
    activeCashSession,
    openCashSession,
    closeCashSession,
    reconcileCashSession,
    addTransaction
  } = useAdmin()

  // Transaction form states
  const [type, setType] = useState('Ingreso')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Servicios')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [description, setDescription] = useState('')

  // Open session modal states
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openResponsibleId, setOpenResponsibleId] = useState(teamMembers[0]?.id || '')
  const [openBase, setOpenBase] = useState('100.000')
  const [openNotes, setOpenNotes] = useState('Apertura de Turno')

  // Close session modal states (Arqueo Ciego)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeStep, setCloseStep] = useState('blind_count') // 'blind_count' | 'audit_reveal'
  const [actualCashInput, setActualCashInput] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [closeResolutionType, setCloseResolutionType] = useState('Reposición Responsable')
  const [closeResolutionReason, setCloseResolutionReason] = useState('')
  const [closeAuthorizedBy, setCloseAuthorizedBy] = useState('Catheryne Ríos (Administradora)')

  // Reconciliation modal states
  const [reconcilingSession, setReconcilingSession] = useState(null)
  const [resolutionType, setResolutionType] = useState('Reposición Responsable')
  const [resolutionReason, setResolutionReason] = useState('')
  const [resolvedBy, setResolvedBy] = useState(teamMembers[0]?.name || 'Administración')

  // Date helpers
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Period filter helper
  const filterByPeriod = (list, startStr) => list.filter(t => t.date >= startStr)

  // TODAY
  const todayTx = transactions.filter(t => t.date === todayStr)
  const todayInflows = todayTx.filter(t => t.type === 'Ingreso').reduce((a, t) => a + t.amount, 0)
  const todayOutflows = todayTx.filter(t => t.type === 'Egreso').reduce((a, t) => a + t.amount, 0)
  const todayNet = todayInflows - todayOutflows

  // THIS WEEK
  const weekTx = filterByPeriod(transactions, weekStartStr)
  const weekInflows = weekTx.filter(t => t.type === 'Ingreso').reduce((a, t) => a + t.amount, 0)
  const weekOutflows = weekTx.filter(t => t.type === 'Egreso').reduce((a, t) => a + t.amount, 0)
  const weekNet = weekInflows - weekOutflows

  // THIS MONTH
  const monthTx = filterByPeriod(transactions, monthStartStr)
  const monthInflows = monthTx.filter(t => t.type === 'Ingreso').reduce((a, t) => a + t.amount, 0)
  const monthOutflows = monthTx.filter(t => t.type === 'Egreso').reduce((a, t) => a + t.amount, 0)
  const monthNet = monthInflows - monthOutflows

  // ALL TIME totals (kept for balance card)
  const totalInflows = transactions.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0)
  const totalOutflows = transactions.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0)
  const netBalance = totalInflows - totalOutflows

  // Payment method breakdowns
  const cashTotal = transactions.filter(t => t.paymentMethod === 'Efectivo' && t.type === 'Ingreso').reduce((a, b) => a + b.amount, 0)
  const nequiTotal = transactions.filter(t => (t.paymentMethod === 'Nequi' || t.paymentMethod === 'Daviplata') && t.type === 'Ingreso').reduce((a, b) => a + b.amount, 0)
  const cardTotal = transactions.filter(t => (t.paymentMethod === 'Tarjeta / Datáfono' || t.paymentMethod === 'Tarjeta') && t.type === 'Ingreso').reduce((a, b) => a + b.amount, 0)

  // Cash calculation for active session
  const activeCashInflows = transactions
    .filter(t => t.type === 'Ingreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
    .reduce((acc, t) => acc + t.amount, 0)

  const activeCashOutflows = transactions
    .filter(t => t.type === 'Egreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
    .reduce((acc, t) => acc + t.amount, 0)

  const expectedCashInBox = (activeCashSession?.initialBase || 0) + activeCashInflows - activeCashOutflows
  const realCashVal = parseCOPInput(actualCashInput)
  const currentDiscrepancy = realCashVal - expectedCashInBox

  const handleAddTransaction = (e) => {
    e.preventDefault()
    const parsedAmount = parseCOPInput(amount)
    if (!parsedAmount || !description) return

    addTransaction({
      id: `tx-${Date.now()}`,
      type,
      amount: parsedAmount,
      description,
      category,
      paymentMethod,
      date: new Date().toISOString().split('T')[0]
    })

    setAmount('')
    setDescription('')
  }

  const handleOpenSubmit = (e) => {
    e.preventDefault()
    const responsibleObj = teamMembers.find(m => m.id === openResponsibleId)
    openCashSession({
      responsibleId: openResponsibleId,
      responsibleName: responsibleObj?.name || 'Responsable',
      initialBase: parseCOPInput(openBase),
      notes: openNotes
    })
    setShowOpenModal(false)
  }

  const handleOpenCloseModal = () => {
    setCloseStep('blind_count')
    setActualCashInput('')
    setCloseNotes('')
    setCloseResolutionReason('')
    setCloseResolutionType('Reposición Responsable')
    setShowCloseModal(true)
  }

  const handleVerifyBlindCount = (e) => {
    e.preventDefault()
    const parsed = parseCOPInput(actualCashInput)
    if (parsed === undefined || isNaN(parsed) || parsed < 0) {
      alert('Por favor ingresa el valor de efectivo físico contado en caja.')
      return
    }
    setCloseStep('audit_reveal')
  }

  const handleFinalizeAuditedClose = (e) => {
    e.preventDefault()
    const parsedActual = parseCOPInput(actualCashInput) || 0
    const diff = parsedActual - expectedCashInBox

    closeCashSession({
      actualCash: parsedActual,
      notes: closeNotes
    })

    if (diff !== 0) {
      reconcileCashSession({
        sessionId: activeCashSession.id,
        resolutionType: closeResolutionType,
        amount: Math.abs(diff),
        reason: closeResolutionReason || (diff < 0 ? `Faltante de turno: -$${Math.abs(diff).toLocaleString()} COP` : `Sobrante de turno: +$${diff.toLocaleString()} COP`),
        resolvedBy: closeAuthorizedBy || 'Administración'
      })
      alert(`¡Cierre y Auditoría finalizados! Se ha registrado el descuadre de forma inmutable en el Historial.`)
    } else {
      alert(`🎉 ¡Caja Cerrada con éxito! Cuadre perfecto sin diferencias.`)
    }

    setShowCloseModal(false)
    setCloseStep('blind_count')
    setActualCashInput('')
    setCloseNotes('')
    setCloseResolutionReason('')
  }

  const handleReconcileSubmit = (e) => {
    e.preventDefault()
    if (!reconcilingSession) return

    reconcileCashSession({
      sessionId: reconcilingSession.id,
      resolutionType,
      amount: Math.abs(reconcilingSession.difference),
      reason: resolutionReason || `Saneamiento de descuadre de $${Math.abs(reconcilingSession.difference)} COP`,
      resolvedBy
    })

    setReconcilingSession(null)
    setResolutionReason('')
  }

  return (
    <div className={styles.cajaContainer}>
      
      {/* CASH BOX SESSION CONTROL BANNER */}
      <div className={`${styles.sessionBanner} ${activeCashSession ? styles.bannerOpen : styles.bannerClosed}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconBox}>
            {activeCashSession ? <UserCheck size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div>
            {activeCashSession ? (
              <>
                <h3 className={styles.bannerTitle}>Caja Abierta — Responsable: <span className={styles.goldHighlight}>{activeCashSession.responsibleName}</span></h3>
                <p className={styles.bannerMeta}>Base Inicial: ${activeCashSession.initialBase.toLocaleString()} COP | Abierta en: {activeCashSession.openedAt}</p>
              </>
            ) : (
              <>
                <h3 className={styles.bannerTitle}>Caja Cerrada — Requiere Apertura</h3>
                <p className={styles.bannerMeta}>Asigna un responsable de turno para iniciar operaciones y evitar pérdidas de dinero.</p>
              </>
            )}
          </div>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.exportExcelBtn}
            onClick={() => exportCajaTransactions(transactions, 'General')}
            title="Descargar reporte contable completo en Excel / CSV"
          >
            <Download size={15} />
            <span>Exportar Caja (Excel)</span>
          </button>

          {activeCashSession ? (
            <button className={styles.closeCashBtn} onClick={handleOpenCloseModal}>
              <Lock size={16} />
              <span>Arqueo Ciego & Cierre</span>
            </button>
          ) : (
            <button className={styles.openCashBtn} onClick={() => setShowOpenModal(true)}>
              <Unlock size={16} />
              <span>Abrir Nuevo Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS — HOY, SEMANA, MES + BALANCE */}
      <div className={styles.summaryGrid}>

        {/* HOY */}
        <div className={`${styles.summaryCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('ingresos_hoy')}>
          <div className={styles.cardHeader}>
            <span>Ingresos Hoy</span>
            <div className={`${styles.badge} ${styles.greenBadge}`}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className={styles.cardValue}>${todayInflows.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <span className={styles.subtext}>Egresos: ${todayOutflows.toLocaleString()}</span>
          <div className={styles.profitRow}>
            <span className={styles.profitLabel}>Ganancia Neta Hoy</span>
            <span className={`${styles.profitValue} ${todayNet >= 0 ? styles.positiveProfit : styles.negativeProfit}`}>
              ${todayNet.toLocaleString()}
            </span>
          </div>
        </div>

        {/* SEMANA */}
        <div className={`${styles.summaryCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('ingresos_semana')}>
          <div className={styles.cardHeader}>
            <span>Ingresos Semana</span>
            <div className={`${styles.badge} ${styles.blueBadge}`}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className={styles.cardValue}>${weekInflows.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <span className={styles.subtext}>Egresos: ${weekOutflows.toLocaleString()}</span>
          <div className={styles.profitRow}>
            <span className={styles.profitLabel}>Ganancia Neta Semana</span>
            <span className={`${styles.profitValue} ${weekNet >= 0 ? styles.positiveProfit : styles.negativeProfit}`}>
              ${weekNet.toLocaleString()}
            </span>
          </div>
        </div>

        {/* MES */}
        <div className={`${styles.summaryCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('ingresos_mes')}>
          <div className={styles.cardHeader}>
            <span>Ingresos del Mes</span>
            <div className={`${styles.badge} ${styles.purpleBadge}`}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className={styles.cardValue}>${monthInflows.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <span className={styles.subtext}>Egresos: ${monthOutflows.toLocaleString()}</span>
          <div className={styles.profitRow}>
            <span className={styles.profitLabel}>Ganancia Neta Mes</span>
            <span className={`${styles.profitValue} ${monthNet >= 0 ? styles.positiveProfit : styles.negativeProfit}`}>
              ${monthNet.toLocaleString()}
            </span>
          </div>
        </div>

        {/* BALANCE TOTAL */}
        <div className={`${styles.summaryCard} ${styles.clickableCard}`} onClick={() => setSelectedAnalyticsCard('balance')}>
          <div className={styles.cardHeader}>
            <span>Balance Neto en Caja</span>
            <div className={`${styles.badge} ${styles.goldBadge}`}>
              <Wallet size={18} />
            </div>
          </div>
          <div className={styles.cardValue}>${netBalance.toLocaleString()} <span className={styles.currency}>COP</span></div>
          <div className={styles.methodBreakdown}>
            <span>💵 Efectivo: ${cashTotal.toLocaleString()}</span>
            <span>📱 Nequi: ${nequiTotal.toLocaleString()}</span>
            <span>💳 Tarjeta: ${cardTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* EXPANDED ANALYTICS MODAL */}
      <ExecutiveAnalyticsModal
        cardType={selectedAnalyticsCard}
        onClose={() => setSelectedAnalyticsCard(null)}
        transactions={transactions}
      />

      {/* NEW TRANSACTION FORM & HISTORY GRID */}
      <div className={styles.contentGrid}>
        
        {/* LEFT: REGISTER TRANSACTION FORM */}
        <div className={styles.formCard}>
          <h3>Registrar Movimiento de Caja</h3>
          
          <form onSubmit={handleAddTransaction} className={styles.txForm}>
            <div className={styles.typeSelector}>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'Ingreso' ? styles.typeIngresoActive : ''}`}
                onClick={() => { setType('Ingreso'); setCategory('Servicios'); }}
              >
                + Ingreso
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'Egreso' ? styles.typeEgresoActive : ''}`}
                onClick={() => { setType('Egreso'); setCategory('Insumos'); }}
              >
                - Egreso / Gasto
              </button>
            </div>

            <div className={styles.formGroup}>
              <label>Monto ($ COP)</label>
              <input
                type="text"
                placeholder="Ej. 120.000"
                value={amount}
                onChange={e => setAmount(formatCOPInput(e.target.value))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {type === 'Ingreso' ? (
                  <>
                    <option value="Servicios">Servicios de Estética</option>
                    <option value="Venta de Productos">Venta de Productos</option>
                    <option value="Gift Cards">Gift Cards / Bonos</option>
                    <option value="Otros Ingresos">Otros Ingresos</option>
                  </>
                ) : (
                  <>
                    <option value="Insumos">Insumos & Materiales</option>
                    <option value="Pago a Trabajadora">Pago / Comisión a Trabajadora</option>
                    <option value="Servicios Públicos">Servicios Públicos / Arriendo</option>
                    <option value="Otros Gastos">Otros Gastos Operativos</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Método de Pago</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Nequi">📱 Nequi / Daviplata</option>
                <option value="Tarjeta / Datáfono">💳 Tarjeta / Datáfono</option>
                <option value="Transferencia">🏦 Transferencia Bancaria</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción / Detalle</label>
              <input
                type="text"
                placeholder="Ej. Compra de esmaltes semipermanentes"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              <Plus size={16} />
              <span>Guardar Transacción</span>
            </button>
          </form>
        </div>

        {/* RIGHT: TRANSACTIONS TABLE */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h4>Historial de Movimientos</h4>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.txTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Método</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className={`${styles.typePill} ${t.type === 'Ingreso' ? styles.pillIngreso : styles.pillEgreso}`}>
                        {t.type}
                      </span>
                    </td>
                    <td><span className={styles.methodTag}>{t.paymentMethod || 'Efectivo'}</span></td>
                    <td>{t.description}</td>
                    <td className={t.type === 'Ingreso' ? styles.inflowAmount : styles.outflowAmount}>
                      {t.type === 'Ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CASH SESSIONS AUDIT HISTORY TABLE */}
      <div className={styles.auditCard}>
        <div className={styles.auditHeader}>
          <div className={styles.auditTitleGroup}>
            <History size={18} className={styles.goldIcon} />
            <h4>Historial Auditado de Turnos & Asistente Anti-Descuadre</h4>
          </div>
          <span className={styles.auditBadge}>Control de Pérdidas & Reconciliación</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.txTable}>
            <thead>
              <tr>
                <th>Responsable</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Base Inicial</th>
                <th>Efectivo Esperado</th>
                <th>Efectivo Contado</th>
                <th>Diferencia / Descuadre</th>
                <th>Estado Auditoría</th>
                <th>Acción / Reconciliación</th>
              </tr>
            </thead>
            <tbody>
              {cashSessions.map(session => (
                <tr key={session.id}>
                  <td><strong>{session.responsibleName}</strong></td>
                  <td>{session.openedAt}</td>
                  <td>{session.closedAt || '— En Curso'}</td>
                  <td>${session.initialBase.toLocaleString()} COP</td>
                  <td>{session.expectedCash !== undefined ? `$${session.expectedCash.toLocaleString()} COP` : '—'}</td>
                  <td>{session.realCash !== undefined ? `$${session.realCash.toLocaleString()} COP` : '—'}</td>
                  <td>
                    {session.difference !== undefined ? (
                      <span className={session.difference === 0 ? styles.diffPerfect : session.difference < 0 ? styles.diffNegative : styles.diffPositive}>
                        {session.difference === 0 ? '✓ $0 (Cuadrada)' : session.difference < 0 ? `⚠️ -${Math.abs(session.difference).toLocaleString()} COP` : `+${session.difference.toLocaleString()} COP`}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={session.status === 'Abierta' ? styles.statusOpenTag : session.isReconciled ? styles.statusReconciledTag : styles.statusPendingTag}>
                      {session.status === 'Abierta' ? 'En Curso' : session.reconciliationStatus || (session.difference === 0 ? 'Cuadrada Perfecta' : 'Pendiente Reconciliar')}
                    </span>
                  </td>
                  <td>
                    {session.status === 'Cerrada' && session.difference !== 0 && !session.isReconciled ? (
                      <button className={styles.reconcileActionBtn} onClick={() => setReconcilingSession(session)}>
                        <Scale size={14} />
                        <span>Reconciliar Caja</span>
                      </button>
                    ) : session.isReconciled && session.resolutionType ? (
                      <span className={styles.resolvedInfoTag} title={session.resolutionReason}>
                        <FileCheck2 size={12} />
                        <span>{session.resolutionType}</span>
                      </span>
                    ) : (
                      <span className={styles.noActionTag}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN CASH MODAL */}
      {showOpenModal && (
        <div className={styles.modalOverlay} onClick={() => setShowOpenModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Abrir Turno de Caja</h3>
            
            <form onSubmit={handleOpenSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Selecciona la Persona Responsable</label>
                <select value={openResponsibleId} onChange={e => setOpenResponsibleId(e.target.value)}>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Base Inicial en Efectivo ($ COP)</label>
                <input
                  type="text"
                  placeholder="Ej. 100.000"
                  value={openBase}
                  onChange={e => setOpenBase(formatCOPInput(e.target.value))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Observaciones de Apertura</label>
                <input
                  type="text"
                  placeholder="Ej. Billetes de baja denominación entregados"
                  value={openNotes}
                  onChange={e => setOpenNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowOpenModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE CASH MODAL (ARQUEO CIEGO & AUDITORÍA) */}
      {showCloseModal && activeCashSession && (
        <div className={styles.modalOverlay} onClick={() => setShowCloseModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            
            {/* STEP 1: CONTEO CIEGO (SIN PISTAS DE SALDO) */}
            {closeStep === 'blind_count' && (
              <>
                <div>
                  <h3>🔒 Arqueo Ciego de Caja</h3>
                  <p className={styles.modalSub}>Responsable que entrega el turno: <strong>{activeCashSession.responsibleName}</strong></p>
                </div>

                <div className={styles.blindNoticeBox}>
                  <ShieldAlert size={20} className={styles.blindIcon} />
                  <span>
                    <strong>Protocolo de Seguridad Anti-Fraude:</strong> Realiza el conteo físico de todos los billetes y monedas en la gaveta. Por seguridad, el sistema no revelará el saldo esperado hasta que registres tu conteo.
                  </span>
                </div>

                <form onSubmit={handleVerifyBlindCount} className={styles.modalForm}>
                  <div className={styles.blindHeroInputGroup}>
                    <label className={styles.blindHeroLabel}>Efectivo Físico Contado en Caja ($ COP) *</label>
                    <input
                      type="text"
                      className={styles.blindBigInput}
                      placeholder="Ej. 180.000"
                      value={actualCashInput}
                      onChange={e => setActualCashInput(formatCOPInput(e.target.value))}
                      required
                      autoFocus
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Notas de Entrega / Desglose de Billetes</label>
                    <input
                      type="text"
                      placeholder="Ej. 2 billetes de 50k, 4 de 20k..."
                      value={closeNotes}
                      onChange={e => setCloseNotes(e.target.value)}
                    />
                  </div>

                  <div className={styles.modalBtnGroup}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowCloseModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.verifyCountBtn}>
                      <span>🔍 Verificar Conteo & Revelar Arqueo</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: REVELACIÓN DEL ARQUEO & RECONCILIACIÓN OBLIGATORIA */}
            {closeStep === 'audit_reveal' && (
              <>
                <div>
                  <h3>📋 Acta de Auditoría & Cierre de Caja</h3>
                  <p className={styles.modalSub}>Turno de: <strong>{activeCashSession.responsibleName}</strong></p>
                </div>

                {/* CALCULATION SUMMARY */}
                <div className={styles.auditCalculationBox}>
                  <div className={styles.calcRow}>
                    <span>Base Inicial de Turno:</span>
                    <span>+${activeCashSession.initialBase.toLocaleString()} COP</span>
                  </div>
                  <div className={styles.calcRow}>
                    <span>Ventas en Efectivo del Turno:</span>
                    <span>+${activeCashInflows.toLocaleString()} COP</span>
                  </div>
                  <div className={styles.calcRow}>
                    <span>Egresos en Efectivo del Turno:</span>
                    <span>-${activeCashOutflows.toLocaleString()} COP</span>
                  </div>
                  <div className={`${styles.calcRow} ${styles.calcTotalRow}`}>
                    <span>Efectivo Esperado según Sistema:</span>
                    <span>${expectedCashInBox.toLocaleString()} COP</span>
                  </div>
                  <div className={styles.calcRow} style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    <span>Efectivo Declarado por Trabajadora:</span>
                    <span>${(realCashVal || 0).toLocaleString()} COP</span>
                  </div>
                </div>

                {/* DISCREPANCY RESULT ALERT BANNER */}
                {currentDiscrepancy === 0 && (
                  <div className={`${styles.diffAlertCard} ${styles.diffAlertGreen}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                      <CheckCircle2 size={18} />
                      <span>🎉 ¡CAJA CUADRADA PERFECTAMENTE!</span>
                    </div>
                    <span style={{ fontSize: '0.78rem' }}>No se detectaron faltantes ni sobrantes de efectivo. La gaveta coincide exactamente con los registros.</span>
                  </div>
                )}

                {currentDiscrepancy < 0 && (
                  <div className={`${styles.diffAlertCard} ${styles.diffAlertRed}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                      <AlertTriangle size={18} />
                      <span>⚠️ ALERTA: FALTANTE DE DINERO EN CAJA</span>
                    </div>
                    <div className={styles.diffHeroAmount}>
                      -${Math.abs(currentDiscrepancy).toLocaleString()} COP
                    </div>
                    <span style={{ fontSize: '0.78rem' }}>Por seguridad, es obligatorio justificar este faltante y asignar el método de saneamiento.</span>
                  </div>
                )}

                {currentDiscrepancy > 0 && (
                  <div className={`${styles.diffAlertCard} ${styles.diffAlertGold}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                      <CheckCircle2 size={18} />
                      <span>🟡 SOBRANTE DE DINERO EN CAJA</span>
                    </div>
                    <div className={styles.diffHeroAmount}>
                      +${currentDiscrepancy.toLocaleString()} COP
                    </div>
                    <span style={{ fontSize: '0.78rem' }}>Se registrará el sobrante a favor de la caja del spa.</span>
                  </div>
                )}

                {/* FINAL FORM WITH MANDATORY RECONCILIATION IF DISCREPANCY */}
                <form onSubmit={handleFinalizeAuditedClose} className={styles.modalForm}>
                  {currentDiscrepancy !== 0 && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Solución / Método de Saneamiento del Descuadre *</label>
                        <select value={closeResolutionType} onChange={e => setCloseResolutionType(e.target.value)} required>
                          <option value="Reposición Responsable">🙋 Reposición Directa por Trabajadora (Descuento de Nómina o Entrega)</option>
                          <option value="Asumido por el Spa (Pérdida)">🏢 Asumido por el Spa como Pérdida Operativa</option>
                          <option value="Error de Facturación / Digitador">📝 Ajuste por Error de Facturación o Vuelto Mal Entregado</option>
                          <option value="Ajuste de Sobrante">💵 Registro de Sobrante Operativo en Caja</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Justificación / Explicación del Descuadre *</label>
                        <input
                          type="text"
                          placeholder="Ej. La especialista repondrá los $10.000 en su liquidación de nómina"
                          value={closeResolutionReason}
                          onChange={e => setCloseResolutionReason(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Autorizado por *</label>
                        <input
                          type="text"
                          value={closeAuthorizedBy}
                          onChange={e => setCloseAuthorizedBy(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className={styles.modalBtnGroup}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setCloseStep('blind_count')}>
                      ← Recalcular Conteo
                    </button>
                    
                    <button
                      type="submit"
                      className={currentDiscrepancy === 0 ? styles.closeSubmitBtnGreen : styles.closeSubmitBtn}
                    >
                      <Lock size={16} />
                      <span>
                        {currentDiscrepancy === 0
                          ? 'Finalizar Cierre Cuadrado'
                          : 'Finalizar Cierre & Grabar Descuadre en Auditoría'}
                      </span>
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* RECONCILIATION ANTI-DISCREPANCY MODAL */}
      {reconcilingSession && (
        <div className={styles.modalOverlay} onClick={() => setReconcilingSession(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Asistente de Reconciliación Anti-Descuadre</h3>
            <p className={styles.modalSub}>
              Resolución de descuadre de <strong>${Math.abs(reconcilingSession.difference).toLocaleString()} COP</strong> del turno de <strong>{reconcilingSession.responsibleName}</strong>.
            </p>

            <form onSubmit={handleReconcileSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Método de Saneamiento / Solución del Descuadre</label>
                <select value={resolutionType} onChange={e => setResolutionType(e.target.value)}>
                  <option value="Reposición Responsable">🙋 Reposición Directa por Trabajadora (Descuento de Nómina o Entrega)</option>
                  <option value="Pago Olvidado">📝 Registro Tardío de Pago de Cita en Efectivo</option>
                  <option value="Ajuste de Sobrante">💵 Registro de Sobrante Operativo en Caja</option>
                  <option value="Gasto Menor No Anotado">🛒 Ajuste por Gasto Menor o Vueltos No Anotados</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Detalle / Justificación Auditable</label>
                <input
                  type="text"
                  placeholder="Ej. La trabajadora repuso el faltante de $20.000 COP en efectivo al cerrar"
                  value={resolutionReason}
                  onChange={e => setResolutionReason(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Persona que Autoriza el Saneamiento</label>
                <input
                  type="text"
                  value={resolvedBy}
                  onChange={e => setResolvedBy(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={() => setReconcilingSession(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.reconcileSubmitBtn}>
                  Cuadrar & Saneada en Historial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
