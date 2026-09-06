import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  ShieldCheck, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  UserCheck,
  Sparkles,
  Crown,
  Scissors,
  CalendarX,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react'
import { FaWhatsapp, FaInstagram, FaTiktok, FaFacebookF } from 'react-icons/fa6'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput, getLocalDateString } from '../../utils/currencyUtils'
import styles from './AdminConfiguracion.module.css'

export default function AdminConfiguracion() {
  const { 
    businessConfig, 
    updateBusinessConfig, 
    currentUserRole, 
    setCurrentUserRole,
    verifyMasterPin,
    changeMasterPin,
    updateRolePin,
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

  // PIN Change Modal State (Dueña, Administradora, Especialistas)
  const [pinModalRole, setPinModalRole] = useState(null) // 'OWNER' | 'ADMIN' | 'SPECIALIST' | null
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')

  // Closed Dates Form State
  const [newCloseDate, setNewCloseDate] = useState('')
  const [newCloseReason, setNewCloseReason] = useState('')
  const [newCloseType, setNewCloseType] = useState('Festivo') // 'Festivo' | 'Vacaciones' | 'Mantenimiento' | 'Evento' | 'Otro'
  const [customCloseType, setCustomCloseType] = useState('')
  const [closeSuccessMsg, setCloseSuccessMsg] = useState('')

  // Big Gold Calendar Modal for Closed Dates
  const [showClosedCalModal, setShowClosedCalModal] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  // Membership Modal State
  const [editingPlan, setEditingPlan] = useState(null)
  const [planName, setPlanName] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planPopular, setPlanPopular] = useState(false)
  const [planColor, setPlanColor] = useState('#D4AF37')
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
  // ROLE PIN CHANGE HANDLERS (EXCLUSIVO DUEÑA)
  // ----------------------------------------------------
  const handleOpenPinModal = (role) => {
    setPinModalRole(role)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setPinSuccess('')
  }

  const handleClosePinModal = () => {
    setPinModalRole(null)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setPinSuccess('')
  }

  const handleChangePinSubmit = async (e) => {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')

    // Si es PROPIETARIA (CEO), exige confirmar el PIN actual
    if (pinModalRole === 'OWNER') {
      if (!currentPin) {
        setPinError('Debes ingresar tu PIN actual de Propietaria.')
        return
      }
      const isMasterValid = await verifyMasterPin(currentPin)
      if (!isMasterValid) {
        setPinError('El PIN actual de Propietaria es incorrecto.')
        return
      }
    }

    if (!newPin || !/^\d{6}$/.test(newPin.trim())) {
      setPinError('La nueva clave debe tener exactamente 6 dígitos numéricos.')
      return
    }

    if (newPin !== confirmPin) {
      setPinError('La nueva clave y su confirmación no coinciden.')
      return
    }

    await updateRolePin(pinModalRole, newPin)

    const roleLabels = {
      OWNER: 'de la Propietaria (PIN Maestro)',
      ADMIN: 'de la Administradora',
      SPECIALIST: 'de las Especialistas'
    }

    setPinSuccess(`Clave ${roleLabels[pinModalRole] || ''} actualizada exitosamente.`)
    setTimeout(() => {
      handleClosePinModal()
    }, 1600)
  }

  // ----------------------------------------------------
  // CLOSED DATES HANDLER & BIG CALENDAR (Feature E)
  // ----------------------------------------------------
  const calMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const calWeekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(prev => prev - 1)
    } else {
      setCalMonth(prev => prev - 1)
    }
  }

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(prev => prev + 1)
    } else {
      setCalMonth(prev => prev + 1)
    }
  }

  const calFirstDayOfWeek = new Date(calYear, calMonth, 1).getDay()
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const handleSelectClosedDay = (dayNum) => {
    const formattedM = String(calMonth + 1).padStart(2, '0')
    const formattedD = String(dayNum).padStart(2, '0')
    const dateStr = `${calYear}-${formattedM}-${formattedD}`
    setNewCloseDate(dateStr)
    setShowClosedCalModal(false)
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      const d = new Date(year, month - 1, day)
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return `${dayNames[d.getDay()]}, ${day} de ${monthNames[month - 1]} ${year}`
    } catch (e) {
      return dateStr
    }
  }

  const handleAddClosedDate = (e) => {
    e.preventDefault()
    if (!newCloseDate) {
      alert('Por favor selecciona una fecha en el calendario.')
      return
    }

    const resolvedType = newCloseType === 'Otro' 
      ? (customCloseType.trim() || 'Otro') 
      : newCloseType

    addClosedDate({
      date: newCloseDate,
      reason: newCloseReason.trim() || `Cierre por ${resolvedType}`,
      type: resolvedType
    })

    setCloseSuccessMsg(`Fecha ${newCloseDate} bloqueada para reservas (${resolvedType}).`)
    setNewCloseDate('')
    setNewCloseReason('')
    setCustomCloseType('')
    setNewCloseType('Festivo')
    setTimeout(() => setCloseSuccessMsg(''), 3500)
  }

  // ----------------------------------------------------
  // MEMBERSHIP HANDLERS (Feature B)
  // ----------------------------------------------------
  const handleOpenCreatePlan = () => {
    setEditingPlan(null)
    setPlanName('')
    setPlanPrice('')
    setPlanPopular(false)
    setPlanColor('#D4AF37')
    setPlanFeaturesText('')
    setShowPlanModal(true)
  }

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanName(plan.name)
    setPlanPrice(formatCOPInput(plan.price))
    setPlanPopular(Boolean(plan.popular))
    setPlanColor(plan.color || '#D4AF37')
    setPlanFeaturesText((plan.features || []).join('\n'))
    setShowPlanModal(true)
  }

  const handleDeletePlan = (id, name) => {
    if (window.confirm(`¿Estás segura de eliminar el plan de membresía "${name}"?`)) {
      deleteMembership(id)
    }
  }

  const handleLoadDefaultPlans = async () => {
    const defaultPlans = [
      {
        name: 'Silver Glow',
        price: 120000,
        popular: false,
        color: '#C0C0C0',
        features: [
          '1 Sesión de Manicure & Pedicure Spa al mes',
          '10% de descuento en tratamientos faciales',
          'Bebida de cortesía en cada visita',
          'Atención preferencial en agenda'
        ]
      },
      {
        name: 'Gold VIP',
        price: 220000,
        popular: true,
        color: '#D4AF37',
        features: [
          '2 Sesiones completas de Uñas y Pedicure Spa',
          '1 Limpieza Facial Profunda al mes',
          '15% de descuento en todos los servicios adicionales',
          'Acceso a agenda prioritaria en fines de semana',
          'Bebida de cortesía premium durante tus citas'
        ]
      },
      {
        name: 'Platinum Deluxe',
        price: 360000,
        popular: false,
        color: '#A78BFA',
        features: [
          'Mantenimientos de uñas y pestañas ilimitados',
          '2 Tratamientos faciales o masajes relajantes al mes',
          '20% de descuento en productos de la tienda',
          'Acompañante con 15% de descuento mensual',
          'Obsequio exclusivo en el mes de tu cumpleaños'
        ]
      }
    ]

    for (const plan of defaultPlans) {
      await addMembership(plan)
    }
  }

  const handleSavePlanSubmit = async (e) => {
    e.preventDefault()
    if (!planName.trim()) {
      alert('Por favor escribe el nombre del plan.')
      return
    }

    const numericPrice = parseCOPInput(planPrice)
    const featuresArray = planFeaturesText.split('\n').map(f => f.trim()).filter(Boolean)

    if (editingPlan) {
      updateMembership(editingPlan.id, {
        name: planName.trim(),
        price: numericPrice,
        popular: planPopular,
        color: planColor,
        features: featuresArray
      })
    } else {
      await addMembership({
        name: planName.trim(),
        price: numericPrice,
        popular: planPopular,
        color: planColor,
        features: featuresArray,
        active: true
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
                  <FaWhatsapp size={16} />
                  <input 
                    type="text" 
                    value={whatsappNumber} 
                    onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))} 
                    placeholder="Ej: 3001234567"
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
                    placeholder="Ej: 3001234567" 
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
                <label>Correo de la Propietaria (Notificaciones)</label>
                <div className={styles.inputWithIcon}>
                  <Mail size={16} />
                  <input 
                    type="email" 
                    value={ownerEmail} 
                    onChange={e => setOwnerEmail(e.target.value)} 
                    placeholder="Ej: ceo@catherynerios.com" 
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
                <FaInstagram size={16} />
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
                  <FaTiktok size={16} />
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
                  <FaFacebookF size={16} />
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

          {/* CARD 3: SEGURIDAD & GESTIÓN DE CLAVES POR ROLES (EXCLUSIVO PROPIETARIA) */}
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.goldIconCircle}`}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3>Control de Claves de Acceso por Roles (Exclusivo Propietaria)</h3>
                <p>Como Propietaria, tienes el control total para consultar y actualizar las claves de cada nivel de autorización del sistema.</p>
              </div>
            </div>

            <div className={styles.rolesPinGrid}>
              {/* ROL 1: PROPIETARIA / CEO */}
              <div className={styles.rolePinCard}>
                <div className={styles.rolePinHeader}>
                  <div className={styles.roleBadgeOwner}>
                    <Crown size={15} />
                    <span>Propietaria (CEO)</span>
                  </div>
                  <span className={styles.roleScopeTag}>Acceso Total</span>
                </div>
                <div className={styles.rolePinValueRow}>
                  <span className={styles.rolePinLabel}>PIN Maestro:</span>
                  <code className={styles.rolePinCode}>•••••• (Protegido por Hash)</code>
                </div>
                <p className={styles.rolePinDesc}>
                  Autoriza cambios de precios, comisiones de especialistas, cierres de caja y configuración maestra.
                </p>
                {currentUserRole === 'OWNER' && (
                  <button 
                    type="button" 
                    className={styles.changeRolePinBtn}
                    onClick={() => handleOpenPinModal('OWNER')}
                  >
                    <Lock size={13} />
                    <span>Cambiar Mi Clave</span>
                  </button>
                )}
              </div>

              {/* ROL 2: ADMINISTRADORA */}
              <div className={styles.rolePinCard}>
                <div className={styles.rolePinHeader}>
                  <div className={styles.roleBadgeAdmin}>
                    <UserCheck size={15} />
                    <span>Administradora (Recepción)</span>
                  </div>
                  <span className={styles.roleScopeTag}>Operativo</span>
                </div>
                <div className={styles.rolePinValueRow}>
                  <span className={styles.rolePinLabel}>Clave de Acceso:</span>
                  <code className={styles.rolePinCode}>•••••• (Protegido por Hash)</code>
                </div>
                <p className={styles.rolePinDesc}>
                  Manejo de agenda global, apertura/cierre de caja con arqueo ciego, cobros y registro de clientas.
                </p>
                {currentUserRole === 'OWNER' && (
                  <button 
                    type="button" 
                    className={styles.changeRolePinBtn}
                    onClick={() => handleOpenPinModal('ADMIN')}
                  >
                    <Lock size={13} />
                    <span>Cambiar Clave de Admin</span>
                  </button>
                )}
              </div>

              {/* ROL 3: ESPECIALISTAS */}
              <div className={styles.rolePinCard}>
                <div className={styles.rolePinHeader}>
                  <div className={styles.roleBadgeSpecialist}>
                    <Scissors size={15} />
                    <span>Especialistas (Equipo)</span>
                  </div>
                  <span className={styles.roleScopeTag}>Restringido</span>
                </div>
                <div className={styles.rolePinValueRow}>
                  <span className={styles.rolePinLabel}>Clave de Acceso:</span>
                  <code className={styles.rolePinCode}>•••••• (Protegido por Hash)</code>
                </div>
                <p className={styles.rolePinDesc}>
                  Visualización exclusiva de su propia agenda asignada y cálculo diario en monto neto de comisiones.
                </p>
                {currentUserRole === 'OWNER' && (
                  <button 
                    type="button" 
                    className={styles.changeRolePinBtn}
                    onClick={() => handleOpenPinModal('SPECIALIST')}
                  >
                    <Lock size={13} />
                    <span>Cambiar Clave de Especialistas</span>
                  </button>
                )}
              </div>
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
          <div className={styles.sectionHeaderRow}>
            <div>
              <h3>Planes de Membresía VIP Mostrados en la Web</h3>
              <p className={styles.sectionHelpText}>Modifica los precios mensuales en COP y beneficios de cada nivel para tus clientas recurrentes.</p>
            </div>
            <button
              type="button"
              className={styles.addPlanBtn}
              onClick={handleOpenCreatePlan}
            >
              <Plus size={16} />
              <span>+ Nuevo Plan VIP</span>
            </button>
          </div>

          {(!memberships || memberships.length === 0) ? (
            <div className={styles.emptyMembershipsBox}>
              <Crown size={48} className={styles.emptyCrownIcon} />
              <h4>No hay planes de membresía configurados aún</h4>
              <p>Crea planes mensuales con beneficios y privilegios exclusivos para fidelizar a tus clientas habituales y generar ingresos recurrentes predecibles.</p>
              <div className={styles.emptyActionsRow}>
                <button
                  type="button"
                  className={styles.createFirstPlanBtn}
                  onClick={handleOpenCreatePlan}
                >
                  <Plus size={16} />
                  <span>Crear Primer Plan VIP</span>
                </button>
                <button
                  type="button"
                  className={styles.loadDefaultPlansBtn}
                  onClick={handleLoadDefaultPlans}
                >
                  <Sparkles size={16} />
                  <span>Cargar 3 Planes Recomendados</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.membershipsGrid}>
              {memberships.map((plan) => (
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
                          <CheckCircle2 size={14} className={styles.featureCheck} style={{ color: plan.color || '#D4AF37' }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.planActionsRow}>
                    <button
                      type="button"
                      className={styles.editPlanBtn}
                      onClick={() => handleOpenEditPlan(plan)}
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className={styles.deletePlanBtn}
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      title="Eliminar este plan"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <div className={`${styles.formRowThree} ${newCloseType === 'Otro' ? styles.formRowFour : ''}`}>
                <div className={styles.formGroup}>
                  <label>Fecha de Cierre</label>
                  <div
                    className={styles.datePickerTrigger}
                    onClick={() => {
                      if (newCloseDate) {
                        const [y, m] = newCloseDate.split('-').map(Number)
                        if (y && m) {
                          setCalYear(y)
                          setCalMonth(m - 1)
                        }
                      }
                      setShowClosedCalModal(true)
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <CalendarIcon size={18} className={styles.goldDateIcon} />
                    <span className={newCloseDate ? styles.dateTriggerTextSelected : styles.dateTriggerTextPlaceholder}>
                      {newCloseDate ? formatDisplayDate(newCloseDate) : 'Elegir fecha en el calendario...'}
                    </span>
                    {newCloseDate && (
                      <span className={styles.dateChipBadge}>{newCloseDate}</span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Cierre</label>
                  <select
                    value={newCloseType}
                    onChange={e => {
                      setNewCloseType(e.target.value)
                      if (e.target.value !== 'Otro') {
                        setCustomCloseType('')
                      }
                    }}
                    className={styles.selectInput}
                  >
                    <option value="Festivo">Día Festivo Nacional</option>
                    <option value="Vacaciones">Vacaciones Colectivas</option>
                    <option value="Mantenimiento">Mantenimiento de Sede</option>
                    <option value="Evento">Evento Privado / Capacitación</option>
                    <option value="Otro">Otro (Especificar)</option>
                  </select>
                </div>

                {newCloseType === 'Otro' && (
                  <div className={styles.formGroup}>
                    <label>Nombre del Cierre Personalizado</label>
                    <input
                      type="text"
                      placeholder="Ej. Remodelación, Asunto Personal..."
                      value={customCloseType}
                      onChange={e => setCustomCloseType(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Motivo o Nota Explicativa</label>
                  <input
                    type="text"
                    placeholder="Ej. Día de la Independencia / Mantenimiento de la Estética"
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
          MODAL: GESTIÓN DE CLAVES POR ROLES (EXCLUSIVO DUEÑA)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pinModalRole && (
          <div className={styles.modalOverlay} onClick={handleClosePinModal}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <ShieldCheck size={28} className={styles.modalShieldIcon} />
                <h3>
                  {pinModalRole === 'OWNER' && 'Cambiar Clave de la Propietaria (PIN Maestro)'}
                  {pinModalRole === 'ADMIN' && 'Actualizar Clave de Administradora'}
                  {pinModalRole === 'SPECIALIST' && 'Actualizar Clave de Especialistas'}
                </h3>
                <p>
                  {pinModalRole === 'OWNER' && 'Ingresa tu clave actual de propietaria y define la nueva clave de 6 dígitos.'}
                  {pinModalRole === 'ADMIN' && 'Como propietaria, define la nueva clave de 6 dígitos para la recepción y administración.'}
                  {pinModalRole === 'SPECIALIST' && 'Como propietaria, define la nueva clave de 6 dígitos para el equipo de especialistas.'}
                </p>
              </div>

              <form onSubmit={handleChangePinSubmit} className={styles.modalForm}>
                {pinModalRole === 'OWNER' && (
                  <div className={styles.formGroup}>
                    <label>PIN Maestro Actual (Propietaria)</label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Ingresa tu clave actual de 6 dígitos"
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      autoFocus
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>
                    {pinModalRole === 'OWNER' ? 'Nuevo PIN Maestro' : 'Nueva Clave de Acceso'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Exactamente 6 dígitos numéricos"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus={pinModalRole !== 'OWNER'}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirmar Nueva Clave</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Repite los 6 dígitos"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                  <button type="button" className={styles.cancelBtn} onClick={handleClosePinModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.savePinSubmitBtn}>
                    Guardar Clave
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREAR O EDITAR PLAN DE MEMBRESÍA VIP (Feature B)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPlanModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <Crown size={32} style={{ color: planColor || '#D4AF37' }} />
                <h3>{editingPlan ? `Editar Membresía ${editingPlan.name}` : 'Nuevo Plan de Membresía VIP'}</h3>
                <p>{editingPlan ? 'Ajusta el precio mensual en COP y la lista de privilegios.' : 'Configura el nivel, tarifa mensual en COP y beneficios de fidelización.'}</p>
              </div>

              <form onSubmit={handleSavePlanSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Nombre del Plan</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    placeholder="Ej. Silver Glow, Gold VIP, Platinum Deluxe"
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

                <div className={styles.formGroup}>
                  <label>Color Distintivo del Nivel</label>
                  <div className={styles.colorPickerContainer}>
                    {[
                      { hex: '#D4AF37', label: 'Oro VIP' },
                      { hex: '#C0C0C0', label: 'Plata' },
                      { hex: '#A78BFA', label: 'Púrpura' },
                      { hex: '#F472B6', label: 'Rosa' },
                      { hex: '#34D399', label: 'Esmeralda' },
                      { hex: '#38BDF8', label: 'Zafiro' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`${styles.colorChip} ${planColor === c.hex ? styles.colorChipActive : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setPlanColor(c.hex)}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={planColor}
                      onChange={e => setPlanColor(e.target.value)}
                      className={styles.colorInputNative}
                      title="Elegir color personalizado"
                    />
                  </div>
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
                    {editingPlan ? 'Guardar Cambios de Membresía' : 'Crear y Publicar Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CALENDARIO GRANDE PARA DÍAS DE CIERRE (Feature E)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showClosedCalModal && (
          <div className={styles.modalOverlay} onClick={() => setShowClosedCalModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={styles.bigCalendarModalCard}
              onClick={e => e.stopPropagation()}
            >
              {/* CALENDAR HEADER */}
              <div className={styles.calNavHeader}>
                <button type="button" className={styles.calNavBtn} onClick={handlePrevCalMonth}>
                  <ChevronLeft size={22} />
                </button>

                <div className={styles.calMonthYearTitle}>
                  <h3>{calMonths[calMonth]} {calYear}</h3>
                </div>

                <button type="button" className={styles.calNavBtn} onClick={handleNextCalMonth}>
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* WEEKDAY HEADERS */}
              <div className={styles.calWeekGrid}>
                {calWeekDays.map((wd, i) => (
                  <div key={i} className={styles.calWeekDayHeader}>{wd}</div>
                ))}
              </div>

              {/* DAYS GRID */}
              <div className={styles.calDaysGrid}>
                {/* Empty padding cells for first day of week */}
                {Array.from({ length: calFirstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className={styles.calDayEmpty} />
                ))}

                {/* Days of month */}
                {Array.from({ length: calDaysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1
                  const formattedM = String(calMonth + 1).padStart(2, '0')
                  const formattedD = String(dayNum).padStart(2, '0')
                  const dateKey = `${calYear}-${formattedM}-${formattedD}`
                  const isSelected = newCloseDate === dateKey
                  const todayStr = getLocalDateString()
                  const isToday = todayStr === dateKey

                  // Count closed dates on this day
                  const isClosed = (closedDates || []).some(c => c.date === dateKey)

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      className={`${styles.calDayCell} ${isSelected ? styles.calDaySelected : ''} ${isToday ? styles.calDayToday : ''} ${isClosed ? styles.calDayAlreadyClosed : ''}`}
                      onClick={() => handleSelectClosedDay(dayNum)}
                      title={isClosed ? 'Esta fecha ya está bloqueada' : `Seleccionar ${dateKey}`}
                    >
                      <span className={styles.calDayNumber}>{dayNum}</span>
                      {isClosed && <span className={styles.calClosedDot} />}
                    </button>
                  )
                })}
              </div>

              {/* FOOTER ACTIONS */}
              <div className={styles.calFooterActions}>
                <button
                  type="button"
                  className={styles.todayQuickBtn}
                  onClick={() => {
                    const todayStr = getLocalDateString()
                    setNewCloseDate(todayStr)
                    const tObj = new Date(todayStr + 'T00:00:00')
                    setCalYear(tObj.getFullYear())
                    setCalMonth(tObj.getMonth())
                    setShowClosedCalModal(false)
                  }}
                >
                  Seleccionar Hoy
                </button>

                <button
                  type="button"
                  className={styles.closeCalBtn}
                  onClick={() => setShowClosedCalModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
