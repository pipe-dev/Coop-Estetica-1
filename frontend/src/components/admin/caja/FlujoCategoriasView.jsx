import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Plus, Calendar, TrendingUp, TrendingDown, Printer } from 'lucide-react'
import { useAdmin } from '../../../context/AdminContext'
import api from '../../../services/api'
import { formatCOP, formatCOPInput, parseCOPInput, getLocalDateString } from '../../../utils/currencyUtils'
import styles from './FlujoCategoriasView.module.css'

export default function FlujoCategoriasView() {
  const { appointments, transactions, serviceCategories, addTransaction } = useAdmin()

  // Fechas: por defecto los últimos 7 días
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 6)

  const [startDate, setStartDate] = useState(() => sevenDaysAgo.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => today.toISOString().slice(0, 10))
  const [flowData, setFlowData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Modal para registrar salida / compra de insumos de una categoría
  const [selectedCatForExpense, setSelectedCatForExpense] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')

  const loadFlow = async (start, end) => {
    setLoading(true)
    try {
      const data = await api.getCategoryFlow(start, end)
      if (data && !data.error) {
        setFlowData(data)
      } else {
        setFlowData(null)
      }
    } catch (e) {
      console.warn('Fallback local de flujo por categorías:', e)
      setFlowData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlow(startDate, endDate)
  }, [startDate, endDate, appointments, transactions, serviceCategories])

  // Fallback offline
  const fallbackFlow = useMemo(() => {
    const appsInRange = appointments.filter(
      a => a.date >= startDate && a.date <= endDate && a.status !== 'Cancelada'
    )
    const txInRange = transactions.filter(t => {
      const d = typeof t.date === 'string' ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10)
      return d >= startDate && d <= endDate && t.type === 'Egreso'
    })

    const categories = serviceCategories.map(cat => {
      const srvIds = new Set((cat.services || []).map(s => s.id))
      const catApps = appsInRange.filter(a => srvIds.has(a.serviceId) || a.service?.categoryId === cat.id)

      // Agrupar ingresos por fecha
      const incomeMap = {}
      catApps.forEach(a => {
        incomeMap[a.date] = (incomeMap[a.date] || 0) + Number(a.price)
      })
      const incomeEntries = Object.keys(incomeMap).sort().map(d => ({ date: d, amount: incomeMap[d] }))

      // Gastos atribuidos
      const catTx = txInRange.filter(
        t => t.serviceCategoryId === cat.id || 
             (t.serviceCategoryName && t.serviceCategoryName.toLowerCase().includes(cat.name.toLowerCase())) ||
             (t.description && t.description.toLowerCase().includes(cat.name.toLowerCase()))
      )
      const expenseEntries = catTx.map(t => ({
        date: typeof t.date === 'string' ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10),
        description: t.description,
        amount: t.amount
      }))

      const totalIncome = incomeEntries.reduce((acc, i) => acc + i.amount, 0)
      const totalExpenses = expenseEntries.reduce((acc, e) => acc + e.amount, 0)
      const netMargin = totalIncome - totalExpenses

      return {
        id: cat.id,
        name: cat.name,
        totalIncome,
        totalExpenses,
        netMargin,
        incomeEntries,
        expenseEntries
      }
    })

    const grandTotalIncome = categories.reduce((acc, c) => acc + c.totalIncome, 0)
    const grandTotalExpenses = categories.reduce((acc, c) => acc + c.totalExpenses, 0)
    const grandTotalNet = categories.reduce((acc, c) => acc + c.netMargin, 0)

    return {
      startDate,
      endDate,
      categories,
      grandTotals: {
        income: grandTotalIncome,
        expenses: grandTotalExpenses,
        net: grandTotalNet
      }
    }
  }, [appointments, transactions, serviceCategories, startDate, endDate])

  const activeData = flowData || fallbackFlow
  const categories = activeData.categories || []
  const grandTotals = activeData.grandTotals || {}

  const handleCreateCategoryExpenseSubmit = async (e) => {
    e.preventDefault()
    const amt = parseCOPInput(expenseAmount)
    if (!amt || !expenseDesc || !selectedCatForExpense) return

    const newTx = {
      id: `tx-cat-${Date.now()}`,
      type: 'Egreso',
      amount: amt,
      description: expenseDesc,
      category: 'Insumos',
      serviceCategoryId: selectedCatForExpense.id,
      serviceCategoryName: selectedCatForExpense.name,
      paymentMethod: 'Efectivo',
      date: endDate
    }

    addTransaction(newTx)
    await api.createCashExpense({
      amount: amt,
      description: expenseDesc,
      category: 'Insumos',
      serviceCategoryId: selectedCatForExpense.id,
      serviceCategoryName: selectedCatForExpense.name,
      paymentMethod: 'Efectivo'
    })

    setSelectedCatForExpense(null)
    setExpenseAmount('')
    setExpenseDesc('')
    loadFlow(startDate, endDate)
  }

  // Atajos de rango
  const setRangeThisWeek = () => {
    const t = new Date()
    const firstDay = new Date(t)
    firstDay.setDate(t.getDate() - t.getDay() + 1) // Lunes
    setStartDate(firstDay.toISOString().slice(0, 10))
    setEndDate(t.toISOString().slice(0, 10))
  }

  const setRangeThisMonth = () => {
    const t = new Date()
    const firstDay = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`
    setStartDate(firstDay)
    setEndDate(t.toISOString().slice(0, 10))
  }

  return (
    <div className={styles.container}>
      {/* SELECTOR DE RANGO */}
      <div className={styles.topControls}>
        <div className={styles.dateRangeBox}>
          <Calendar size={18} style={{ color: '#D4AF37' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#A3A3A3' }}>Periodo:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={styles.dateInput}
          />
          <span style={{ color: '#888' }}>a</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={styles.dateInput}
          />
          <button type="button" className={styles.quickBtn} onClick={setRangeThisWeek}>
            Esta Semana
          </button>
          <button type="button" className={styles.quickBtn} onClick={setRangeThisMonth}>
            Este Mes
          </button>
        </div>

        <button 
          type="button" 
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
            color: '#0B0B0D',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Printer size={15} />
          <span>Imprimir Flujo</span>
        </button>
      </div>

      {/* GRAND TOTAL CONSOLIDADO (IDÉNTICO A TOTALES $88.600 EN EXCEL) */}
      <div className={styles.grandTotalBanner}>
        <div className={styles.grandTotalInfo}>
          <h3>Gran Total Consolidado • Ganancia Neta</h3>
          <p>Suma consolidada de ingresos menos salidas de insumos entre {startDate} y {endDate}</p>
        </div>
        <div className={styles.grandTotalNumbers}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ display: 'block', color: '#60A5FA', fontSize: '0.74rem' }}>Ingresos Totales</small>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{formatCOP(grandTotals.income || 0)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small style={{ display: 'block', color: '#F87171', fontSize: '0.74rem' }}>Salidas Insumos</small>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>- {formatCOP(grandTotals.expenses || 0)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small style={{ display: 'block', color: '#A3A3A3', fontSize: '0.74rem' }}>Margen Consolidado</small>
            <span className={styles.grandTotalVal}>{formatCOP(grandTotals.net || 0)}</span>
          </div>
        </div>
      </div>

      {/* 4 CUADROS DE CATEGORÍAS (MANICURE, PELUQUERÍA, DEPILACIÓN, LIFTING) */}
      <div className={styles.categoriesGrid}>
        {categories.map(cat => {
          // Unir entradas por fecha o visualización combinada
          const maxRows = Math.max(cat.incomeEntries.length, cat.expenseEntries.length, 1)
          const rowsList = []

          for (let i = 0; i < maxRows; i++) {
            const inc = cat.incomeEntries[i] || null
            const exp = cat.expenseEntries[i] || null
            rowsList.push({
              date: inc?.date || exp?.date || '-',
              income: inc?.amount || 0,
              expense: exp?.amount || 0,
              desc: exp?.description || (inc ? 'Citas cobradas' : '-')
            })
          }

          return (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryTitle}>🏷️ {cat.name}</span>
                <button 
                  type="button" 
                  className={styles.addExpenseBtn}
                  onClick={() => setSelectedCatForExpense(cat)}
                  title="Registrar compra de insumos para esta categoría"
                >
                  <Plus size={13} />
                  <span>Insumo</span>
                </button>
              </div>

              <table className={styles.categoryTable}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>FECHA</th>
                    <th style={{ textAlign: 'right' }}>INGRESO</th>
                    <th style={{ textAlign: 'right' }}>SALIDA</th>
                    <th>DESCRIPCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsList.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#888' }}>{r.date}</td>
                      <td style={{ textAlign: 'right', color: r.income > 0 ? '#60A5FA' : '#555', fontWeight: r.income > 0 ? 600 : 400 }}>
                        {r.income > 0 ? formatCOP(r.income) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: r.expense > 0 ? '#F87171' : '#555', fontWeight: r.expense > 0 ? 600 : 400 }}>
                        {r.expense > 0 ? formatCOP(r.expense) : '-'}
                      </td>
                      <td style={{ fontSize: '0.74rem', color: '#A3A3A3', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.subtotalFooter}>
                <div>
                  <small style={{ display: 'block', color: '#888', fontSize: '0.7rem' }}>
                    In: {formatCOP(cat.totalIncome)} | Out: -{formatCOP(cat.totalExpenses)}
                  </small>
                  <span>TOTAL NETO:</span>
                </div>
                <span className={styles.netMargin}>{formatCOP(cat.netMargin)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL REGISTRAR INSUMO / SALIDA DE CATEGORÍA */}
      <AnimatePresence>
        {selectedCatForExpense && (
          <div className={styles.modalOverlay} onClick={() => setSelectedCatForExpense(null)}>
            <motion.div 
              className={styles.modalBox}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>+ Registrar Compra / Salida en {selectedCatForExpense.name}</h3>
              <form onSubmit={handleCreateCategoryExpenseSubmit}>
                <div className={styles.formGroup}>
                  <label>Monto de la Salida ($ COP)</label>
                  <input
                    type="text"
                    placeholder="Ej. 25.000 o 27.400"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(formatCOPInput(e.target.value))}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción del Material / Insumo</label>
                  <input
                    type="text"
                    placeholder="Ej. REM CUT, NOVI MASGLO o TINTES"
                    value={expenseDesc}
                    onChange={e => setExpenseDesc(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.modalBtnRow}>
                  <button type="button" className={styles.quickBtn} onClick={() => setSelectedCatForExpense(null)}>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                      color: '#0B0B0D',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Guardar Salida
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
