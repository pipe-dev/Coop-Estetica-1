import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Globe, 
  Share2, 
  Camera,
  ShieldCheck, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  UserCheck,
  Sparkles,
  Crown,
  CalendarX,
  Plus,
  Trash2,
  Edit2,
  Mail
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput } from '../../utils/currencyUtils'
import styles from './AdminConfiguracion.module.css'

export default function AdminConfiguracion() {
  const { 
    businessConfig, 
    updateBusinessConfig, 
    currentUserRole, 
    setCurrentUserRole,
    verifyMasterPin,
    changeMasterPin,
    memberships,
    updateMembership,
    addMembership,
    deleteMembership,
    closedDates,
    addClosedDate,
    deleteClosedDate
  } = useAdmin()

  const [activeTab, setActiveTab] = useState('general') // 'general' | 'membresias' | 'cierres'

  // General Form State
  const [businessName, setBusinessName] = useState(businessConfig?.businessName || '')
  const [whatsappNumber, setWhatsappNumber] = useState(businessConfig?.whatsappNumber || '')
  const [phone, setPhone] = useState(businessConfig?.phone || '')
  const [ownerEmail, setOwnerEmail] = useState(businessConfig?.ownerEmail || '')
  const [adminEmail, setAdminEmail] = useState(businessConfig?.adminEmail || '')
  const [address, setAddress] = useState(businessConfig?.address || '')
  const [openingHours, setOpeningHours] = useState(businessConfig?.openingHours || '')
  const [instagramUrl, setInstagramUrl] = useState(businessConfig?.instagramUrl || '')
  const [tiktokUrl, setTiktokUrl] = useState(businessConfig?.tiktokUrl || '')
  const [facebookUrl, setFacebookUrl] = useState(businessConfig?.facebookUrl || '')
  const [promoBanner, setPromoBanner] = useState(businessConfig?.promoBanner || '')

  // Sync form state when businessConfig loads or updates
  React.useEffect(() => {
    if (businessConfig) {
      setBusinessName(businessConfig.businessName || '')
      setWhatsappNumber(businessConfig.whatsappNumber || '')
      setPhone(businessConfig.phone || '')
      setOwnerEmail(businessConfig.ownerEmail || '')
      setAdminEmail(businessConfig.adminEmail || '')
      setAddress(businessConfig.address || '')
      setOpeningHours(businessConfig.openingHours || '')
      setInstagramUrl(businessConfig.instagramUrl || '')
      setTiktokUrl(businessConfig.tiktokUrl || '')
      setFacebookUrl(businessConfig.facebookUrl || '')
      setPromoBanner(businessConfig.promoBanner || '')
    }
  }, [businessConfig])
  
  // Status message
  const [savedSuccess, setSavedSuccess] = useState(false)

  // PIN Change Modal State
  const [showPinModal, setShowPinModal] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')

  // Closed Dates Form State
  const [newCloseDate, setNewCloseDate] = useState('')
  const [newCloseReason, setNewCloseReason] = useState('')
  const [newCloseType, setNewCloseType] = useState('Festivo') // 'Festivo' | 'Vacaciones' | 'Mantenimiento' | 'Evento'
  const [closeSuccessMsg, setCloseSuccessMsg] = useState('')

  // Membership Modal State
  const [editingPlan, setEditingPlan] = useState(null)
  const [planName, setPlanName] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planPopular, setPlanPopular] = useState(false)
  const [planFeaturesText, setPlanFeaturesText] = useState('')
  const [showPlanModal, setShowPlanModal] = useState(false)

  // ----------------------------------------------------
  // GENERAL CONFIG HANDLER
  // ----------------------------------------------------
  const handleSaveConfig = (e) => {
    e.preventDefault()
    updateBusinessConfig({
      businessName,
      whatsappNumber,
      phone,
      ownerEmail,
      adminEmail,
      address,
      openingHours,
      instagramUrl,
      tiktokUrl,
      facebookUrl,
      promoBanner
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  // ----------------------------------------------------
  // PIN CHANGE HANDLER
  // ----------------------------------------------------
  const handleChangePinSubmit = (e) => {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')

    if (!currentPin) {
      setPinError('Debes ingresar el PIN actual.')
      return
    }

    if (!verifyMasterPin(currentPin)) {
      setPinError('El PIN actual es incorrecto.')
      return
    }

    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      setPinError('El nuevo PIN debe tener entre 4 y 8 dígitos.')
      return
    }

    if (newPin !== confirmPin) {
      setPinError('El nuevo PIN y su confirmación no coinciden.')
      return
    }

    changeMasterPin(newPin)
    setPinSuccess('PIN Maestro actualizado exitosamente.')
    setTimeout(() => {
      setShowPinModal(false)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setPinSuccess('')
    }, 1800)
  }

  // ----------------------------------------------------
  // CLOSED DATES HANDLER (Feature E)
  // ----------------------------------------------------
  const handleAddClosedDate = (e) => {
    e.preventDefault()
    if (!newCloseDate) {
      alert('Por favor selecciona una fecha.')
      return
    }

    addClosedDate({
      date: newCloseDate,
      reason: newCloseReason.trim() || `Cierre por ${newCloseType}`,
      type: newCloseType
    })

    setCloseSuccessMsg(`Fecha ${newCloseDate} bloqueada para reservas.`)
    setNewCloseDate('')
    setNewCloseReason('')
    setTimeout(() => setCloseSuccessMsg(''), 3500)
  }

  // ----------------------------------------------------
  // MEMBERSHIP HANDLERS (Feature B)
  // ----------------------------------------------------
  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanName(plan.name)
    setPlanPrice(formatCOPInput(plan.price))
    setPlanPopular(Boolean(plan.popular))
    setPlanFeaturesText((plan.features || []).join('\n'))
    setShowPlanModal(true)
  }

  const handleSavePlanSubmit = (e) => {
    e.preventDefault()
    const numericPrice = parseCOPInput(planPrice)
    const featuresArray = planFeaturesText.split('\n').map(f => f.trim()).filter(Boolean)

    if (editingPlan) {
      updateMembership(editingPlan.id, {
        name: planName,
        price: numericPrice,
        popular: planPopular,
        features: featuresArray
      })
    }

    setShowPlanModal(false)
    setEditingPlan(null)
  }

  return (
    <div className={styles.container}>
      {/* HEADER WITH TABS */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Configuración y Control Total del Negocio</h2>
          <p className={styles.subtitle}>
            Administra la información pública, canales de contacto, planes de membresía, festivos y seguridad.
          </p>
        </div>

        {savedSuccess && (
          <motion.div 
            className={styles.successBadge}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 size={16} />
            <span>Configuración guardada correctamente</span>
          </motion.div>
        )}
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className={styles.configTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={16} />
          <span>General & Redes</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'membresias' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('membresias')}
        >
          <Crown size={16} />
          <span>Planes de Membresía VIP</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'cierres' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cierres')}
        >
          <CalendarX size={16} />
          <span>Festivos, Vacaciones & Cierres</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: GENERAL & REDES & PIN
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveConfig} className={styles.configGrid}>
          {/* CARD 1: INFORMACIÓN GENERAL & CONTACTO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <Phone size={18} />
              </div>
              <div>
                <h3>Información y Canales de Contacto</h3>
                <p>Datos oficiales mostrados en la web, mensajes de WhatsApp y comprobantes.</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nombre Oficial de la Estética</label>
              <input 
                type="text" 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                placeholder="Ej: Catheryne Ríos Estética"
                required 
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Número de WhatsApp (Sin signos ni espacios)</label>
                <div className={styles.inputWithIcon}>
                  <MessageSquare size={16} />
                  <input 
                    type="text" 
                    value={whatsappNumber} 
                    onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))} 
                    placeholder="Ej: 3006269056"
                    required 
                  />
                </div>
                <small className={styles.hint}>Usado para el agendamiento y pedidos de la tienda.</small>
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono de Llamadas / Recepción</label>
                <div className={styles.inputWithIcon}>
                  <Phone size={16} />
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="Ej: 3006269056" 
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Dirección Física del Local</label>
              <div className={styles.inputWithIcon}>
                <MapPin size={16} />
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Ej: Calle 123 #45-67, Barrio El Prado" 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Horarios de Atención al Público</label>
              <div className={styles.inputWithIcon}>
                <Clock size={16} />
                <input 
                  type="text" 
                  value={openingHours} 
                  onChange={e => setOpeningHours(e.target.value)} 
                  placeholder="Ej: Lunes a Sábado: 8:00 AM - 7:00 PM" 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Correo de la Dueña (Notificaciones)</label>
                <div className={styles.inputWithIcon}>
                  <Mail size={16} />
                  <input 
                    type="email" 
                    value={ownerEmail} 
                    onChange={e => setOwnerEmail(e.target.value)} 
                    placeholder="Ej: duena@catherynerios.com" 
                  />
                </div>
                <small className={styles.hint}>Recibe el resumen ejecutivo de cada nueva cita.</small>
              </div>

              <div className={styles.formGroup}>
                <label>Correo de Recepción / Administradora</label>
                <div className={styles.inputWithIcon}>
                  <Mail size={16} />
                  <input 
                    type="email" 
                    value={adminEmail} 
                    onChange={e => setAdminEmail(e.target.value)} 
                    placeholder="Ej: admin@catherynerios.com" 
                  />
                </div>
                <small className={styles.hint}>Recibe la alerta para preparar cabina e insumos.</small>
              </div>
            </div>
          </div>

          {/* CARD 2: REDES SOCIALES & ANUNCIOS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <Globe size={18} />
              </div>
              <div>
                <h3>Redes Sociales & Banner Promocional</h3>
                <p>Enlaces directos a tus perfiles y texto del anuncio superior de la web.</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Instagram URL</label>
              <div className={styles.inputWithIcon}>
                <Camera size={16} />
                <input 
                  type="url" 
                  value={instagramUrl} 
                  onChange={e => setInstagramUrl(e.target.value)} 
                  placeholder="Ej: https://instagram.com/tu_estetica" 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>TikTok URL</label>
                <div className={styles.inputWithIcon}>
                  <Share2 size={16} />
                  <input 
                    type="url" 
                    value={tiktokUrl} 
                    onChange={e => setTiktokUrl(e.target.value)} 
                    placeholder="Ej: https://tiktok.com/@tu_estetica" 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Facebook URL</label>
                <div className={styles.inputWithIcon}>
                  <Share2 size={16} />
                  <input 
                    type="url" 
                    value={facebookUrl} 
                    onChange={e => setFacebookUrl(e.target.value)} 
                    placeholder="Ej: https://facebook.com/tu_estetica" 
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Banner Promocional Superior (Página de Inicio)</label>
              <textarea 
                rows={3} 
                value={promoBanner} 
                onChange={e => setPromoBanner(e.target.value)} 
                placeholder="Escribe el texto de la promoción o aviso especial que verán todos los clientes al entrar a la web..."
              />
              <small className={styles.hint}>Se actualiza en tiempo real en la barra superior de la página web.</small>
            </div>
          </div>

          {/* CARD 3: SEGURIDAD, PIN MAESTRO & ROLES */}
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.goldIconCircle}`}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3>Seguridad y PIN Maestro de la Propietaria</h3>
                <p>El PIN Maestro autoriza cambios de precios, comisiones y liquidación de caja.</p>
              </div>
            </div>

            <div className={styles.securityBody}>
              <div className={styles.securityInfo}>
                <div className={styles.pinStatusPill}>
                  <KeyRound size={16} />
                  <span>PIN Maestro Activo y Protegido con Encriptación</span>
                </div>
                <p>Tu clave actual de dueña es <code>{businessConfig?.masterPin || '2026'}</code>. Puedes modificarla en cualquier momento.</p>
              </div>

              {currentUserRole === 'OWNER' && (
                <button 
                  type="button" 
                  className={styles.changePinBtn}
                  onClick={() => setShowPinModal(true)}
                >
                  <Lock size={15} />
                  <span>Cambiar PIN Maestro</span>
                </button>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className={styles.submitRow}>
            <button type="submit" className={styles.saveMainBtn}>
              <Save size={16} />
              <span>Guardar Configuración General</span>
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PLANES DE MEMBRESÍA VIP (Feature B)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'membresias' && (
        <div className={styles.membershipsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Planes de Membresía VIP Mostrados en la Web</h3>
              <p>Modifica los precios mensuales en COP y beneficios de cada nivel para tus clientas recurrentes.</p>
            </div>
          </div>

          <div className={styles.membershipsGrid}>
            {(memberships || []).map((plan) => (
              <div key={plan.id} className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ''}`}>
                {plan.popular && (
                  <div className={styles.popularBadge}>
                    <Sparkles size={13} />
                    <span>Más Elegido por Clientas</span>
                  </div>
                )}

                <div className={styles.planHeader}>
                  <h4 className={styles.planName} style={{ color: plan.color || '#D4AF37' }}>
                    Membresía {plan.name}
                  </h4>
                  <div className={styles.planPriceGroup}>
                    <span className={styles.planPrice}>${(plan.price || 0).toLocaleString()}</span>
                    <span className={styles.planPeriod}>COP / mes</span>
                  </div>
                </div>

                <div className={styles.planFeaturesList}>
                  <strong>Beneficios incluidos:</strong>
                  <ul>
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} className={styles.featureCheck} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={styles.editPlanBtn}
                  onClick={() => handleOpenEditPlan(plan)}
                >
                  <Edit2 size={14} />
                  <span>Editar Precio y Beneficios</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: DÍAS DE CIERRE, FESTIVOS & VACACIONES (Feature E)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cierres' && (
        <div className={styles.closedDatesSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.dangerIconCircle}`}>
                <CalendarX size={18} />
              </div>
              <div>
                <h3>Bloqueador de Días de Cierre y Festivos</h3>
                <p>Selecciona las fechas en las que la sede estará cerrada para bloquear el agendamiento en la web pública.</p>
              </div>
            </div>

            {closeSuccessMsg && (
              <div className={styles.successBanner}>
                <CheckCircle2 size={16} />
                <span>{closeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddClosedDate} className={styles.closeDateForm}>
              <div className={styles.formRowThree}>
                <div className={styles.formGroup}>
                  <label>Fecha de Cierre</label>
                  <input
                    type="date"
                    value={newCloseDate}
                    onChange={e => setNewCloseDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Cierre</label>
                  <select
                    value={newCloseType}
                    onChange={e => setNewCloseType(e.target.value)}
                  >
                    <option value="Festivo">Día Festivo Nacional</option>
                    <option value="Vacaciones">Vacaciones Colectivas</option>
                    <option value="Mantenimiento">Mantenimiento de Sede</option>
                    <option value="Evento">Evento Privado / Capacitación</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo o Nota Explicativa</label>
                  <input
                    type="text"
                    placeholder="Ej. Día de la Independencia / Mantenimiento de Spa"
                    value={newCloseReason}
                    onChange={e => setNewCloseReason(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className={styles.addCloseBtn}>
                <Plus size={16} />
                <span>Bloquear Esta Fecha</span>
              </button>
            </form>
          </div>

          {/* LIST OF BLOCKED DATES */}
          <div className={styles.blockedListCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <Clock size={18} />
              </div>
              <div>
                <h3>Fechas Bloqueadas para Reservas ({(closedDates || []).length})</h3>
                <p>En estos días los clientes verán el calendario deshabilitado con el motivo del cierre.</p>
              </div>
            </div>

            <div className={styles.blockedGrid}>
              {(closedDates || []).length === 0 ? (
                <p className={styles.noClosedDates}>No hay fechas bloqueadas actualmente. La sede opera todos los días según el horario general.</p>
              ) : (
                closedDates.map((item) => (
                  <div key={item.id} className={styles.blockedDateItem}>
                    <div className={styles.blockedDateBadge}>
                      <span className={styles.blockedDateText}>{item.date}</span>
                      <span className={styles.blockedTypeTag}>{item.type}</span>
                    </div>

                    <div className={styles.blockedInfo}>
                      <strong>{item.reason}</strong>
                      <span>Agendamiento deshabilitado en la web</span>
                    </div>

                    <button
                      type="button"
                      className={styles.deleteCloseBtn}
                      onClick={() => deleteClosedDate(item.id)}
                      title="Desbloquear fecha"
                    >
                      <Trash2 size={15} />
                      <span>Desbloquear</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CAMBIAR PIN MAESTRO
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPinModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPinModal(false)}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <ShieldCheck size={28} className={styles.modalShieldIcon} />
                <h3>Cambiar PIN Maestro</h3>
                <p>Ingresa tu clave actual y define una nueva clave de 4 a 8 dígitos.</p>
              </div>

              <form onSubmit={handleChangePinSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>PIN Maestro Actual</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Ingresa PIN actual (2026)"
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nuevo PIN Maestro</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="De 4 a 8 dígitos"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirmar Nuevo PIN</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Repite el nuevo PIN"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    required
                  />
                </div>

                {pinError && (
                  <div className={styles.errorBanner}>
                    <AlertTriangle size={15} />
                    <span>{pinError}</span>
                  </div>
                )}

                {pinSuccess && (
                  <div className={styles.successBanner}>
                    <CheckCircle2 size={15} />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                <div className={styles.modalButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowPinModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.savePinSubmitBtn}>
                    Guardar Nuevo PIN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDITAR PLAN DE MEMBRESÍA VIP (Feature B)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPlanModal && editingPlan && (
          <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <Crown size={28} style={{ color: editingPlan.color || '#D4AF37' }} />
                <h3>Editar Membresía {editingPlan.name}</h3>
                <p>Ajusta el precio mensual en COP y la lista de privilegios.</p>
              </div>

              <form onSubmit={handleSavePlanSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Nombre del Plan</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Precio Mensual ($ COP)</label>
                  <input
                    type="text"
                    value={planPrice}
                    onChange={e => setPlanPrice(formatCOPInput(e.target.value))}
                    placeholder="Ej. 199.900"
                    required
                  />
                </div>

                <div className={styles.formCheckboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={planPopular}
                      onChange={e => setPlanPopular(e.target.checked)}
                    />
                    <span>Destacar como plan "Más Elegido por Clientas"</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Beneficios Incluidos (1 por línea)</label>
                  <textarea
                    rows={6}
                    value={planFeaturesText}
                    onChange={e => setPlanFeaturesText(e.target.value)}
                    placeholder="1 servicio básico al mes&#10;10% de descuento en adicionales&#10;Bebida de cortesía"
                    required
                  />
                </div>

                <div className={styles.modalButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowPlanModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.savePinSubmitBtn}>
                    Guardar Cambios de Membresía
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
