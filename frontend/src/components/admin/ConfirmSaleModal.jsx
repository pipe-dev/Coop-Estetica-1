import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, DollarSign, Calculator, AlertTriangle, CreditCard, Banknote, Smartphone, Share2, Printer, Check, ArrowRight } from 'lucide-react'
import { formatCOPInput, parseCOPInput, getLocalDateString } from '../../utils/currencyUtils'
import styles from './ConfirmSaleModal.module.css'

export default function ConfirmSaleModal({ appointment, onClose, onConfirm }) {
  if (!appointment) return null

  const totalPrice = appointment.price || 0
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [cashReceived, setCashReceived] = useState(formatCOPInput(totalPrice))
  const [notes, setNotes] = useState('')
  const [saleCompletedData, setSaleCompletedData] = useState(null)

  const receivedVal = parseCOPInput(cashReceived)
  const changeToGive = receivedVal - totalPrice

  const handleQuickAddCash = (amountToAdd) => {
    if (amountToAdd === 'exact') {
      setCashReceived(formatCOPInput(totalPrice))
    } else {
      const curr = parseCOPInput(cashReceived)
      setCashReceived(formatCOPInput(curr + amountToAdd))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (paymentMethod === 'Efectivo' && receivedVal < totalPrice) {
      alert(`Monto recibido insuficiente. Faltan $${(totalPrice - receivedVal).toLocaleString()} COP para completar el pago.`)
      return
    }

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`

    // Execute state & transaction update in parent/context
    onConfirm({
      appointmentId: appointment.id,
      paymentMethod,
      totalPrice,
      cashReceived: paymentMethod === 'Efectivo' ? receivedVal : totalPrice,
      changeToGive: paymentMethod === 'Efectivo' ? Math.max(0, changeToGive) : 0,
      notes,
      receiptNo
    })

    // Advance to Step 2: Digital Receipt & WhatsApp Dispatch
    setSaleCompletedData({
      receiptNo,
      paymentMethod,
      totalPrice,
      notes,
      date: appointment.date || getLocalDateString(),
      time: appointment.time || '10:00 AM'
    })
  }

  // Generates clean WhatsApp formatted message link
  const getWhatsAppLink = () => {
    if (!saleCompletedData) return '#'
    const rawPhone = (appointment.clientPhone || '').replace(/\D/g, '')
    const fullPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone

    const message = `✨ *COMPROBANTE OFICIAL DE PAGO* ✨
🏢 *Catheryne Ríos Estética*
──────────────────────────
🧾 *Recibo N°:* ${saleCompletedData.receiptNo}
👤 *Clienta:* ${appointment.clientName}
💆 *Servicio:* ${appointment.serviceName}
👩‍⚕️ *Especialista:* ${appointment.specialistName}
💰 *Total Pagado:* $${saleCompletedData.totalPrice.toLocaleString()} COP
💳 *Medio de Pago:* ${saleCompletedData.paymentMethod}
🗓️ *Fecha:* ${saleCompletedData.date} • ${saleCompletedData.time}
──────────────────────────
¡Muchas gracias por tu visita y confianza! 💖
Esperamos verte pronto para seguir realzando tu belleza y bienestar.`

    const encoded = encodeURIComponent(message)
    return fullPhone ? `https://wa.me/${fullPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={styles.modalCard}
        onClick={e => e.stopPropagation()}
      >
        {/* STEP 1: PAYMENT FORM & CASH CALCULATOR */}
        {!saleCompletedData ? (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.iconCircle}>
                <Calculator size={20} />
              </div>
              <div>
                <h3>Confirmar Cobro de Venta</h3>
                <p className={styles.clientSub}>{appointment.clientName} • {appointment.serviceName}</p>
              </div>
            </div>

            <div className={styles.totalDisplayBox}>
              <span className={styles.totalLabel}>Total a cobrar</span>
              <span className={styles.totalAmount}>${totalPrice.toLocaleString()} <small>COP</small></span>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {/* PAYMENT METHOD */}
              <div className={styles.formGroup}>
                <label>Método de Pago</label>
                <div className={styles.paymentMethodGrid}>
                  <button
                    type="button"
                    className={`${styles.methodBtn} ${paymentMethod === 'Efectivo' ? styles.activeMethod : ''}`}
                    onClick={() => setPaymentMethod('Efectivo')}
                  >
                    <Banknote size={18} />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodBtn} ${paymentMethod === 'Nequi' ? styles.activeMethod : ''}`}
                    onClick={() => setPaymentMethod('Nequi')}
                  >
                    <Smartphone size={18} />
                    <span>Nequi / Daviplata</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodBtn} ${paymentMethod === 'Tarjeta' ? styles.activeMethod : ''}`}
                    onClick={() => setPaymentMethod('Tarjeta')}
                  >
                    <CreditCard size={18} />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>

              {/* CASH RECEIVED & CHANGE CALCULATOR */}
              {paymentMethod === 'Efectivo' && (
                <div className={styles.cashCalculatorSection}>
                  <div className={styles.formGroup}>
                    <label>Efectivo recibido ($ COP)</label>
                    <input
                      type="text"
                      className={styles.cashInput}
                      placeholder="0"
                      value={cashReceived}
                      onChange={e => setCashReceived(formatCOPInput(e.target.value))}
                      autoFocus
                      required
                    />
                  </div>

                  {/* QUICK CASH BUTTONS */}
                  <div className={styles.quickCashRow}>
                    <button type="button" onClick={() => handleQuickAddCash('exact')} className={styles.quickCashBtn}>
                      Exacto
                    </button>
                    <button type="button" onClick={() => handleQuickAddCash(50000)} className={styles.quickCashBtn}>
                      +$50.000
                    </button>
                    <button type="button" onClick={() => handleQuickAddCash(100000)} className={styles.quickCashBtn}>
                      +$100.000
                    </button>
                    <button type="button" onClick={() => handleQuickAddCash(200000)} className={styles.quickCashBtn}>
                      +$200.000
                    </button>
                  </div>

                  {/* LIVE CHANGE BANNER */}
                  <div className={`${styles.changeBanner} ${changeToGive >= 0 ? styles.changePositive : styles.changeNegative}`}>
                    {changeToGive >= 0 ? (
                      <>
                        <CheckCircle2 size={18} />
                        <div className={styles.changeInfoGroup}>
                          <span className={styles.changeTitle}>Vueltos a entregar:</span>
                          <span className={styles.changeAmount}>${changeToGive.toLocaleString()} COP</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} />
                        <div className={styles.changeInfoGroup}>
                          <span className={styles.changeTitle}>Faltan:</span>
                          <span className={styles.changeAmount}>${Math.abs(changeToGive).toLocaleString()} COP</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Descuento aplicado, propina, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.confirmBtn}
                  disabled={paymentMethod === 'Efectivo' && changeToGive < 0}
                >
                  <CheckCircle2 size={16} />
                  <span>Cobrar & Generar Recibo</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* STEP 2: DIGITAL RECEIPT & WHATSAPP SEND */
          <div className={styles.receiptContainer}>
            <div className={styles.modalHeader}>
              <div className={styles.iconCircleSuccess}>
                <Check size={24} />
              </div>
              <div>
                <h3>¡Cobro Registrado con Éxito!</h3>
                <p className={styles.successSub}>Acreditado en caja • Cita marcada como pagada</p>
              </div>
            </div>

            {/* DIGITAL RECEIPT TICKET */}
            <div className={styles.receiptCard}>
              <div className={styles.receiptBrandHeader}>
                <h4 className={styles.receiptBrandName}>Catheryne Ríos Estética</h4>
                <span className={styles.receiptBrandSub}>Belleza, Cuidado & Bienestar Integral</span>
                <span className={styles.receiptNumberBadge}>{saleCompletedData.receiptNo}</span>
              </div>

              <div className={styles.receiptDetailsList}>
                <div className={styles.receiptDetailRow}>
                  <span>Clienta:</span>
                  <strong>{appointment.clientName}</strong>
                </div>

                <div className={styles.receiptDetailRow}>
                  <span>Teléfono:</span>
                  <span>{appointment.clientPhone || 'No registrado'}</span>
                </div>

                <div className={styles.receiptDetailRow}>
                  <span>Servicio:</span>
                  <strong>{appointment.serviceName}</strong>
                </div>

                <div className={styles.receiptDetailRow}>
                  <span>Especialista:</span>
                  <span>{appointment.specialistName}</span>
                </div>

                <div className={styles.receiptDetailRow}>
                  <span>Medio de Pago:</span>
                  <span>{saleCompletedData.paymentMethod}</span>
                </div>

                <div className={styles.receiptTotalRow}>
                  <span className={styles.receiptTotalLabel}>Total Pagado:</span>
                  <span className={styles.receiptTotalValue}>${saleCompletedData.totalPrice.toLocaleString()} COP</span>
                </div>
              </div>
            </div>

            {/* WHATSAPP ACTION BUTTON */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappActionBtn}
            >
              <span>📲 Enviar Recibo Oficial por WhatsApp</span>
            </a>

            {/* SECONDARY ACTIONS */}
            <div className={styles.receiptSecondaryActions}>
              <button
                type="button"
                className={styles.printBtn}
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                className={styles.doneBtn}
                onClick={onClose}
              >
                <span>Listo / Finalizar</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
