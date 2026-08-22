import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart as PieIcon, ShieldCheck, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { formatCOP, getLocalDateString } from '../../utils/currencyUtils'
import styles from './ExecutiveAnalyticsModal.module.css'

export default function ExecutiveAnalyticsModal({ cardType, onClose, transactions = [], appointments = [] }) {
  if (!cardType) return null

  // Determine initial mode and period
  const rawType = typeof cardType === 'string' ? cardType : cardType?.type || 'ingresos'
  let initialPeriod = 'all'
  let mainType = 'ingresos'

  if (rawType === 'ingresos_hoy') {
    mainType = 'ingresos'
    initialPeriod = 'hoy'
  } else if (rawType === 'ingresos_semana') {
    mainType = 'ingresos'
    initialPeriod = 'semana'
  } else if (rawType === 'ingresos_mes') {
    mainType = 'ingresos'
    initialPeriod = 'mes'
  } else if (rawType === 'egresos') {
    mainType = 'egresos'
    initialPeriod = 'all'
  } else if (rawType === 'balance') {
    mainType = 'balance'
    initialPeriod = 'all'
  }

  const [activePeriod, setActivePeriod] = useState(initialPeriod)

  // Dates calculation
  const todayStr = getLocalDateString()
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const daysFromMonday = (currentDayOfWeek + 6) % 7
  const mondayObj = new Date(now)
  mondayObj.setDate(now.getDate() - daysFromMonday)
  const mondayStr = getLocalDateString(mondayObj)
  const currentYearMonth = todayStr.substring(0, 7)

  // Filter transactions according to activePeriod
  const periodFilteredTx = transactions.filter(t => {
    if (activePeriod === 'hoy') return t.date === todayStr
    if (activePeriod === 'semana') return t.date >= mondayStr && t.date <= todayStr
    if (activePeriod === 'mes') return t.date && t.date.startsWith(currentYearMonth)
    return true
  })

  // Live financial metrics for selected period
  const periodIngresos = periodFilteredTx
    .filter(t => t.type === 'Ingreso')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const periodEgresos = periodFilteredTx
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const periodBalance = periodIngresos - periodEgresos

  // Breakdown payment methods for Ingresos in this period
  const ingresosByMethod = periodFilteredTx
    .filter(t => t.type === 'Ingreso')
    .reduce((acc, t) => {
      const method = t.paymentMethod || 'Otros'
      acc[method] = (acc[method] || 0) + Number(t.amount)
      return acc
    }, { Nequi: 0, Efectivo: 0, Tarjeta: 0 })

  // Breakdown expenses by category
  const egresosByCategory = periodFilteredTx
    .filter(t => t.type === 'Egreso')
    .reduce((acc, t) => {
      const cat = t.category || 'Varios'
      acc[cat] = (acc[cat] || 0) + Number(t.amount)
      return acc
    }, {})

  const profitMargin = periodIngresos > 0 ? Math.round((periodBalance / periodIngresos) * 100) : 100

  const periodLabelMap = {
    hoy: 'Hoy',
    semana: 'Esta Semana',
    mes: 'Este Mes',
    all: 'Todo el Historial'
  }

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={styles.modalCard}
          onClick={e => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className={styles.modalHeader}>
            <div className={styles.headerTitleGroup}>
              {mainType === 'ingresos' && (
                <>
                  <div className={`${styles.iconBadge} ${styles.ingresosBadge}`}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h2 className={styles.modalTitle}>Análisis de Ingresos — {periodLabelMap[activePeriod]}</h2>
                    <p className={styles.modalSubtitle}>Desglose detallado de ventas y canales de cobro</p>
                  </div>
                </>
              )}

              {mainType === 'egresos' && (
                <>
                  <div className={`${styles.iconBadge} ${styles.egresosBadge}`}>
                    <TrendingDown size={22} />
                  </div>
                  <div>
                    <h2 className={styles.modalTitle}>Control de Egresos — {periodLabelMap[activePeriod]}</h2>
                    <p className={styles.modalSubtitle}>Distribución de insumos, costos y pagos operativos</p>
                  </div>
                </>
              )}

              {mainType === 'balance' && (
                <>
                  <div className={`${styles.iconBadge} ${styles.balanceBadge}`}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h2 className={styles.modalTitle}>Salud Financiera & Balance — {periodLabelMap[activePeriod]}</h2>
                    <p className={styles.modalSubtitle}>Indicadores de liquidez, rentabilidad y flujo neto</p>
                  </div>
                </>
              )}
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* PERIOD FILTER TABS */}
          <div className={styles.periodTabGroup}>
            <button
              type="button"
              className={`${styles.periodTabBtn} ${activePeriod === 'hoy' ? styles.activePeriodTab : ''}`}
              onClick={() => setActivePeriod('hoy')}
            >
              ☀️ Hoy
            </button>
            <button
              type="button"
              className={`${styles.periodTabBtn} ${activePeriod === 'semana' ? styles.activePeriodTab : ''}`}
              onClick={() => setActivePeriod('semana')}
            >
              🗓️ Esta Semana
            </button>
            <button
              type="button"
              className={`${styles.periodTabBtn} ${activePeriod === 'mes' ? styles.activePeriodTab : ''}`}
              onClick={() => setActivePeriod('mes')}
            >
              📈 Este Mes
            </button>
            <button
              type="button"
              className={`${styles.periodTabBtn} ${activePeriod === 'all' ? styles.activePeriodTab : ''}`}
              onClick={() => setActivePeriod('all')}
            >
              🌐 Todo el Historial
            </button>
          </div>

          {/* MAIN MODAL BODY */}
          <div className={styles.modalBody}>
            {/* VIEW 1: INGRESOS */}
            {mainType === 'ingresos' && (
              <div className={styles.contentGrid}>
                {/* METRIC HERO CARD */}
                <div className={styles.metricHeroCard}>
                  <span className={styles.heroLabel}>Total Recaudado ({periodLabelMap[activePeriod]})</span>
                  <div className={styles.heroValueGroup}>
                    <span className={styles.heroValue}>${periodIngresos.toLocaleString()}</span>
                    <span className={styles.currencyBadge}>COP</span>
                  </div>
                  <div className={styles.heroMetaRow}>
                    <span className={styles.heroMetaPositive}>
                      Ganancia Neta: ${periodBalance.toLocaleString()} COP ({profitMargin}%)
                    </span>
                    <span className={styles.heroMetaCount}>{periodFilteredTx.filter(t => t.type === 'Ingreso').length} Ventas registradas</span>
                  </div>
                </div>

                {/* BREAKDOWN BY PAYMENT METHODS */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <PieIcon size={16} className={styles.sectionIcon} />
                    <h4>Distribución por Medio de Pago ({periodLabelMap[activePeriod]})</h4>
                  </div>

                  <div className={styles.channelList}>
                    <div className={styles.channelItem}>
                      <div className={styles.channelLabelGroup}>
                        <span className={styles.channelDot} style={{ background: '#10B981' }} />
                        <span>💵 Efectivo</span>
                      </div>
                      <span className={styles.channelValue}>${(ingresosByMethod['Efectivo'] || 0).toLocaleString()} COP</span>
                    </div>

                    <div className={styles.channelItem}>
                      <div className={styles.channelLabelGroup}>
                        <span className={styles.channelDot} style={{ background: '#3B82F6' }} />
                        <span>📱 Nequi / Daviplata</span>
                      </div>
                      <span className={styles.channelValue}>${((ingresosByMethod['Nequi'] || 0) + (ingresosByMethod['Daviplata'] || 0)).toLocaleString()} COP</span>
                    </div>

                    <div className={styles.channelItem}>
                      <div className={styles.channelLabelGroup}>
                        <span className={styles.channelDot} style={{ background: '#F59E0B' }} />
                        <span>💳 Tarjetas / Datáfono</span>
                      </div>
                      <span className={styles.channelValue}>${((ingresosByMethod['Tarjeta / Datáfono'] || 0) + (ingresosByMethod['Tarjeta'] || 0)).toLocaleString()} COP</span>
                    </div>
                  </div>
                </div>

                {/* TRANSACTIONS LIST FOR THIS PERIOD */}
                <div className={styles.txListSection}>
                  <span className={styles.txListTitle}>Movimientos Registrados ({periodLabelMap[activePeriod]})</span>
                  {periodFilteredTx.filter(t => t.type === 'Ingreso').length === 0 ? (
                    <p className={styles.emptyText}>No hay ventas registradas en este período.</p>
                  ) : (
                    periodFilteredTx.filter(t => t.type === 'Ingreso').map(t => (
                      <div key={t.id} className={styles.txItemRow}>
                        <div>
                          <div className={styles.txItemDesc}>{t.description}</div>
                          <div className={styles.txItemMeta}>{t.date} • {t.paymentMethod || 'Efectivo'}</div>
                        </div>
                        <div className={styles.txItemAmount}>+${Number(t.amount || 0).toLocaleString()} COP</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: EGRESOS */}
            {mainType === 'egresos' && (
              <div className={styles.contentGrid}>
                <div className={styles.metricHeroCard}>
                  <span className={styles.heroLabel}>Total Egresos ({periodLabelMap[activePeriod]})</span>
                  <div className={styles.heroValueGroup}>
                    <span className={styles.heroValue}>${periodEgresos.toLocaleString()}</span>
                    <span className={styles.currencyBadge}>COP</span>
                  </div>
                  <div className={styles.heroMetaRow}>
                    <span className={styles.heroMetaNegative}>Deducciones Operativas</span>
                    <span className={styles.heroMetaCount}>{periodFilteredTx.filter(t => t.type === 'Egreso').length} Gastos</span>
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <PieIcon size={16} className={styles.sectionIcon} />
                    <h4>Distribución por Rubro de Gasto</h4>
                  </div>

                  <div className={styles.channelList}>
                    {Object.keys(egresosByCategory).length === 0 ? (
                      <p className={styles.emptyText}>No hay egresos registrados en este período.</p>
                    ) : (
                      Object.entries(egresosByCategory).map(([cat, amount]) => (
                        <div key={cat} className={styles.channelItem}>
                          <div className={styles.channelLabelGroup}>
                            <span className={styles.channelDot} style={{ background: '#EF4444' }} />
                            <span>{cat}</span>
                          </div>
                          <span className={styles.channelValue}>${Number(amount).toLocaleString()} COP</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.txListSection}>
                  <span className={styles.txListTitle}>Detalle de Egresos ({periodLabelMap[activePeriod]})</span>
                  {periodFilteredTx.filter(t => t.type === 'Egreso').length === 0 ? (
                    <p className={styles.emptyText}>Sin egresos en este período.</p>
                  ) : (
                    periodFilteredTx.filter(t => t.type === 'Egreso').map(t => (
                      <div key={t.id} className={styles.txItemRow}>
                        <div>
                          <div className={styles.txItemDesc}>{t.description}</div>
                          <div className={styles.txItemMeta}>{t.date} • {t.category || 'General'}</div>
                        </div>
                        <div className={styles.txItemAmountExpense}>-${Number(t.amount || 0).toLocaleString()} COP</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: BALANCE NETO */}
            {mainType === 'balance' && (
              <div className={styles.contentGrid}>
                <div className={styles.metricHeroCard}>
                  <span className={styles.heroLabel}>Ganancia Neta / Balance ({periodLabelMap[activePeriod]})</span>
                  <div className={styles.heroValueGroup}>
                    <span className={styles.heroValue}>${periodBalance.toLocaleString()}</span>
                    <span className={styles.currencyBadge}>COP</span>
                  </div>
                  <div className={styles.heroMetaRow}>
                    <span className={periodBalance >= 0 ? styles.heroMetaPositive : styles.heroMetaNegative}>
                      {periodBalance >= 0 ? 'Rentabilidad Positiva' : 'Déficit Temporal'}
                    </span>
                    <span className={styles.heroMetaCount}>Margen Neto: {profitMargin}%</span>
                  </div>
                </div>

                <div className={styles.healthGrid}>
                  <div className={styles.healthCard}>
                    <div className={styles.healthCardIconBox} style={{ color: '#10B981' }}>
                      <TrendingUp size={20} />
                    </div>
                    <div className={styles.healthCardContent}>
                      <span className={styles.healthCardLabel}>Total Ingresos</span>
                      <span className={styles.healthCardStatus}>${periodIngresos.toLocaleString()} COP</span>
                    </div>
                  </div>

                  <div className={styles.healthCard}>
                    <div className={styles.healthCardIconBox} style={{ color: '#EF4444' }}>
                      <TrendingDown size={20} />
                    </div>
                    <div className={styles.healthCardContent}>
                      <span className={styles.healthCardLabel}>Total Egresos</span>
                      <span className={styles.healthCardStatus}>${periodEgresos.toLocaleString()} COP</span>
                    </div>
                  </div>
                </div>

                <div className={styles.txListSection}>
                  <span className={styles.txListTitle}>Todos los Movimientos ({periodLabelMap[activePeriod]})</span>
                  {periodFilteredTx.length === 0 ? (
                    <p className={styles.emptyText}>No hay movimientos registrados.</p>
                  ) : (
                    periodFilteredTx.map(t => {
                      const isInc = t.type === 'Ingreso'
                      return (
                        <div key={t.id} className={styles.txItemRow}>
                          <div>
                            <div className={styles.txItemDesc}>{t.description}</div>
                            <div className={styles.txItemMeta}>{t.date} • {t.category || t.paymentMethod}</div>
                          </div>
                          <div className={isInc ? styles.txItemAmount : styles.txItemAmountExpense}>
                            {isInc ? '+' : '-'}${Number(t.amount || 0).toLocaleString()} COP
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.confirmBtn} onClick={onClose}>
              Entendido / Cerrar Análisis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
