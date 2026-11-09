import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, DollarSign, TrendingDown, BookOpen, Printer, Sparkles } from 'lucide-react'
import { useAdmin } from '../../../context/AdminContext'
import api from '../../../services/api'
import { formatCOP } from '../../../utils/currencyUtils'
import styles from './LibroMensualView.module.css'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function LibroMensualView() {
  const { appointments, transactions } = useAdmin()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(() => now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => now.getMonth() + 1)
  const [ledgerData, setLedgerData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadLedger = async (year, month) => {
    setLoading(true)
    try {
      const data = await api.getMonthlyLedger(year, month)
      if (data && !data.error) {
        setLedgerData(data)
      } else {
        setLedgerData(null)
      }
    } catch (e) {
      console.warn('Fallback local de libro mensual:', e)
      setLedgerData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLedger(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, appointments, transactions])

  // Fallback offline
  const fallbackLedger = useMemo(() => {
    const monthStr = String(selectedMonth).padStart(2, '0')
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

    let runningCash = 0
    const days = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedYear}-${monthStr}-${String(d).padStart(2, '0')}`
      const dayApps = appointments.filter(a => a.date === dayStr && a.status !== 'Cancelada')
      const dayTx = transactions.filter(t => {
        const txDate = typeof t.date === 'string' ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10)
        return txDate === dayStr
      })

      const totalDia = dayApps.reduce((acc, a) => {
        const aesthetic = a.aestheticAmount !== null && a.aestheticAmount !== undefined
          ? Number(a.aestheticAmount)
          : (Number(a.price) - Number(a.commissionAmount || 0))
        return acc + aesthetic
      }, 0)

      const transaccion = dayApps
        .filter(a => a.paymentMethod !== 'Efectivo')
        .reduce((acc, a) => acc + Number(a.price), 0)

      const gastosDia = dayTx
        .filter(t => t.type === 'Egreso' && t.category !== 'Anticipo Especialista' && t.category !== 'Liquidación Nómina' && t.category !== 'Insumos')
        .reduce((acc, t) => acc + t.amount, 0)

      const gastosSinRegistrar = dayTx
        .filter(t => t.category === 'Ajuste de Caja')
        .reduce((acc, t) => acc + t.amount, 0)

      const payrollCuts = dayTx
        .filter(t => t.category === 'Liquidación Nómina' || t.category === 'Anticipo Especialista')
        .map(t => ({ specialistName: t.specialistName || 'Especialista', amount: t.amount, description: t.description }))

      const supplyRestocks = dayTx
        .filter(t => t.category === 'Insumos')
        .map(t => ({ description: t.description, amount: t.amount }))

      const efectivoDia = (totalDia > 0 || transaccion > 0 || gastosDia > 0)
        ? (totalDia - transaccion - gastosDia)
        : 0

      const payrollDeductions = payrollCuts.reduce((acc, p) => acc + p.amount, 0)
      const supplyDeductions = supplyRestocks.reduce((acc, s) => acc + s.amount, 0)
      runningCash += (efectivoDia - payrollDeductions - supplyDeductions)

      days.push({
        day: d,
        date: dayStr,
        totalDia,
        transaccion,
        gastosDia,
        gastosSinRegistrar,
        efectivoDia,
        efectivoReal: runningCash,
        payrollCuts,
        supplyRestocks,
        hasActivity: totalDia > 0 || transaccion > 0 || gastosDia > 0 || payrollCuts.length > 0 || supplyRestocks.length > 0
      })
    }

    const totalMesEstetica = days.reduce((acc, d) => acc + d.totalDia, 0)
    const totalMesTransacciones = days.reduce((acc, d) => acc + d.transaccion, 0)
    const totalMesGastos = days.reduce((acc, d) => acc + d.gastosDia, 0)
    const totalMesEfectivo = days.reduce((acc, d) => acc + d.efectivoDia, 0)

    return {
      year: selectedYear,
      month: selectedMonth,
      days,
      totals: {
        totalMesEstetica,
        totalMesTransacciones,
        totalMesGastos,
        totalMesEfectivo,
        finalCashBalance: runningCash
      }
    }
  }, [selectedYear, selectedMonth, appointments, transactions])

  const activeData = ledgerData || fallbackLedger
  const days = activeData.days || []
  const totals = activeData.totals || {}

  return (
    <div className={styles.container}>
      {/* SELECTOR DE MES Y AÑO */}
      <div className={styles.topControls}>
        <div className={styles.monthSelectBox}>
          <BookOpen size={18} style={{ color: '#D4AF37' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#A3A3A3' }}>Periodo Contable:</span>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
            className={styles.selectInput}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            className={styles.selectInput}
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
          <span>Imprimir Libro Mensual</span>
        </button>
      </div>

      {/* KPIS MENSUALES */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Total Estética Mes</span>
          <span className={`${styles.kpiValue} ${styles.kpiGold}`}>{formatCOP(totals.totalMesEstetica || 0)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Total Transacciones Banco</span>
          <span className={`${styles.kpiValue} ${styles.kpiBlue}`}>{formatCOP(totals.totalMesTransacciones || 0)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Gastos del Mes</span>
          <span className={`${styles.kpiValue} ${styles.kpiRed}`}>{formatCOP(totals.totalMesGastos || 0)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Efectivo del Mes</span>
          <span className={`${styles.kpiValue} ${(totals.totalMesEfectivo || 0) < 0 ? styles.kpiRed : styles.kpiGreen}`}>
            {formatCOP(totals.totalMesEfectivo || 0)}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Saldo Efectivo Real Acumulado</span>
          <span className={`${styles.kpiValue} ${(totals.finalCashBalance || 0) < 0 ? styles.kpiRed : styles.kpiGreen}`}>
            {formatCOP(totals.finalCashBalance || 0)}
          </span>
        </div>
      </div>

      {/* TABLA MAYOR MENSUAL (IDÉNTICA A SEPTIEMBRE) */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <h3>
            <BookOpen size={18} style={{ color: '#D4AF37' }} />
            <span>Libro Mayor de Caja • {MONTH_NAMES[selectedMonth - 1].toUpperCase()} {selectedYear}</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#A3A3A3' }}>
            Consolidado diario de tesorería y arqueo de efectivo real
          </span>
        </div>

        <div className={styles.tableScrollWrapper}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th style={{ width: '110px' }}>FECHA</th>
                <th style={{ textAlign: 'right' }}>TOTAL DÍA (ESTÉTICA)</th>
                <th style={{ textAlign: 'right' }}>TRANSACCIÓN (BANCOS)</th>
                <th style={{ textAlign: 'right' }}>GASTOS DEL DÍA</th>
                <th style={{ textAlign: 'right' }}>GASTOS SIN REGISTRAR</th>
                <th style={{ textAlign: 'right' }}>EFECTIVO DEL DÍA</th>
                <th style={{ textAlign: 'right' }}>EFECTIVO REAL</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <React.Fragment key={d.day}>
                  <tr className={d.hasActivity ? styles.ledgerRowActive : styles.ledgerRowEmpty}>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td style={{ textAlign: 'right', fontWeight: d.totalDia > 0 ? 700 : 400 }}>
                      {d.totalDia > 0 ? formatCOP(d.totalDia) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: d.transaccion > 0 ? '#60A5FA' : 'inherit' }}>
                      {d.transaccion > 0 ? formatCOP(d.transaccion) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: d.gastosDia > 0 ? '#F87171' : 'inherit' }}>
                      {d.gastosDia > 0 ? formatCOP(d.gastosDia) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: d.gastosSinRegistrar > 0 ? '#F59E0B' : 'inherit' }}>
                      {d.gastosSinRegistrar > 0 ? formatCOP(d.gastosSinRegistrar) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} className={d.efectivoDia < 0 ? styles.negVal : (d.efectivoDia > 0 ? styles.posVal : '')}>
                      {d.efectivoDia !== 0 ? formatCOP(d.efectivoDia) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }} className={d.efectivoReal < 0 ? styles.negVal : styles.posVal}>
                      {formatCOP(d.efectivoReal)}
                    </td>
                  </tr>

                  {/* FILAS DORADAS DE CORTE Y LIQUIDACIONES (PAYROLL CUTS & SUPPLY RESTOCKS) */}
                  {d.payrollCuts.map((p, idx) => (
                    <tr key={`p-${d.day}-${idx}`} className={styles.cutRow}>
                      <td colSpan={2} style={{ paddingLeft: '24px' }}>
                        ✂️ PAGO: {p.specialistName}
                      </td>
                      <td colSpan={4} style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                        {p.description}
                      </td>
                      <td style={{ textAlign: 'right', color: '#F0D78C' }}>
                        - {formatCOP(p.amount)}
                      </td>
                    </tr>
                  ))}

                  {d.supplyRestocks.map((s, idx) => (
                    <tr key={`s-${d.day}-${idx}`} className={styles.cutRow}>
                      <td colSpan={2} style={{ paddingLeft: '24px' }}>
                        💅 INSUMOS: REPOSICIÓN
                      </td>
                      <td colSpan={4} style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                        {s.description}
                      </td>
                      <td style={{ textAlign: 'right', color: '#F0D78C' }}>
                        - {formatCOP(s.amount)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* TOTALES DEL MES */}
              <tr className={styles.totalsRow}>
                <td>TOTALES MES:</td>
                <td style={{ textAlign: 'right' }}>{formatCOP(totals.totalMesEstetica || 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatCOP(totals.totalMesTransacciones || 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatCOP(totals.totalMesGastos || 0)}</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>{formatCOP(totals.totalMesEfectivo || 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatCOP(totals.finalCashBalance || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
