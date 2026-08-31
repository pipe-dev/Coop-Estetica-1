import React, { createContext, useContext, useState, useEffect } from 'react'
import { getLocalDateString, getLocalDateTimeString } from '../utils/currencyUtils'
import { products as initialProductsData } from '../data/products'
import { serviceCategories as initialServiceCategoriesData } from '../data/services'
import { team as initialTeamData } from '../data/team'
import { memberships as initialMembershipsData } from '../data/memberships'
import { api } from '../services/api'
import { mutationQueue } from '../utils/securityService'
import { runSilentAutoBackup } from '../utils/autoBackupService'

const AdminContext = createContext()

const todayStr = getLocalDateString()

const initialClosedDates = [
  { id: 'close-1', date: '2026-12-25', reason: 'Navidad (Festivo Nacional)', type: 'Festivo' },
  { id: 'close-2', date: '2027-01-01', reason: 'Año Nuevo (Festivo Nacional)', type: 'Festivo' }
]

const initialBusinessConfig = {
  businessName: 'Catheryne Ríos Estética',
  whatsappNumber: '3006269056',
  phone: '3006269056',
  address: 'Calle 123 #45-67, Barrio El Prado',
  openingHours: 'Lunes a Sábado: 8:00 AM - 7:00 PM',
  instagramUrl: 'https://instagram.com',
  tiktokUrl: 'https://tiktok.com',
  facebookUrl: 'https://facebook.com',
  promoBanner: 'Reserva tu experiencia de lujo este mes y recibe asesoría facial personalizada.',
  masterPin: '2026'
}

const initialTeam = [
  { id: '1', name: 'Catheryne Ríos', role: 'Directora & Esteticista Máster', phone: '3006269056', active: true, color: '#D4AF37', commissionRate: 50, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop', experience: '10 años', bio: 'Especialista en dermocosmética y estética avanzada con más de 10 años de experiencia.' },
  { id: '2', name: 'Valentina Silva', role: 'Especialista en Uñas & Manicura Rusa', phone: '3012345678', active: true, color: '#EC4899', commissionRate: 40, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop', experience: '6 años', bio: 'Máster en técnicas rusas, nivelación con rubber y diseño de autor.' },
  { id: '3', name: 'Camila Torres', role: 'Cosmiatra & Masajista Spa', phone: '3029876543', active: true, color: '#8B5CF6', commissionRate: 45, avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=400&auto=format&fit=crop', experience: '5 años', bio: 'Experta en masajes relajantes, drenaje linfático y aparatología estética.' }
]

const tomorrowObj = new Date()
tomorrowObj.setDate(tomorrowObj.getDate() + 1)
const tomorrowStr = getLocalDateString(tomorrowObj)

const inTwoDaysObj = new Date()
inTwoDaysObj.setDate(inTwoDaysObj.getDate() + 2)
const inTwoDaysStr = getLocalDateString(inTwoDaysObj)

const inThreeDaysObj = new Date()
inThreeDaysObj.setDate(inThreeDaysObj.getDate() + 3)
const inThreeDaysStr = getLocalDateString(inThreeDaysObj)

const initialAppointments = [
  { id: 'app-1', clientName: 'Sofía Martínez', clientPhone: '3001234567', serviceId: 'manicura-rusa', serviceName: 'Manicura Rusa VIP', specialistId: '2', specialistName: 'Valentina Silva', date: todayStr, time: '10:00 AM', price: 120000, commissionAmount: 48000, status: 'Reservada' },
  { id: 'app-2', clientName: 'Lucía Gómez', clientPhone: '3109876543', serviceId: 'limpieza-profunda', serviceName: 'Limpieza Facial Profunda', specialistId: '3', specialistName: 'Camila Torres', date: todayStr, time: '02:00 PM', price: 180000, commissionAmount: 81000, status: 'Pagada' },
  { id: 'app-3', clientName: 'Mariana López', clientPhone: '3205554433', serviceId: 'masaje-relajante', serviceName: 'Masaje Relajante de Spa', specialistId: '1', specialistName: 'Catheryne Ríos', date: todayStr, time: '04:30 PM', price: 220000, commissionAmount: 110000, status: 'En Atención' },
  { id: 'app-4', clientName: 'Andrea Benítez', clientPhone: '3009871234', serviceId: 'maquillaje-social', serviceName: 'Maquillaje Profesional Social', specialistId: '1', specialistName: 'Catheryne Ríos', date: tomorrowStr, time: '09:00 AM', price: 150000, commissionAmount: 75000, status: 'Reservada' },
  { id: 'app-5', clientName: '🚫 Espacio Bloqueado (Almuerzo)', clientPhone: '', serviceId: 'block', serviceName: '[Almuerzo] Bloqueo de Horario', specialistId: '2', specialistName: 'Valentina Silva', date: tomorrowStr, time: '01:00 PM - 02:00 PM', price: 0, commissionAmount: 0, status: 'Reservada' },
  { id: 'app-6', clientName: 'Carolina Mendoza', clientPhone: '3157778899', serviceId: 'botox-capilar', serviceName: 'Tratamiento Capilar Botox', specialistId: '3', specialistName: 'Camila Torres', date: tomorrowStr, time: '03:30 PM', price: 250000, commissionAmount: 112500, status: 'Reservada' },
  { id: 'app-7', clientName: 'Daniela Ospina', clientPhone: '3124445566', serviceId: 'manicura-rusa', serviceName: 'Manicura Rusa VIP', specialistId: '2', specialistName: 'Valentina Silva', date: inTwoDaysStr, time: '11:00 AM', price: 120000, commissionAmount: 48000, status: 'Reservada' },
  { id: 'app-8', clientName: 'Gabriela Vargas', clientPhone: '3189990011', serviceId: 'limpieza-profunda', serviceName: 'Limpieza Facial Profunda', specialistId: '1', specialistName: 'Catheryne Ríos', date: inTwoDaysStr, time: '02:30 PM', price: 180000, commissionAmount: 90000, status: 'Reservada' },
  { id: 'app-9', clientName: 'Paula Andrea Jaramillo', clientPhone: '3016667788', serviceId: 'masaje-relajante', serviceName: 'Masaje Relajante de Spa', specialistId: '3', specialistName: 'Camila Torres', date: inThreeDaysStr, time: '10:00 AM', price: 220000, commissionAmount: 99000, status: 'Reservada' }
]

const initialTransactions = [
  { id: 'tx-1', type: 'Ingreso', amount: 180000, description: 'Pago Limpieza Facial - Lucía Gómez', category: 'Servicios', paymentMethod: 'Nequi', date: todayStr },
  { id: 'tx-2', type: 'Egreso', amount: 45000, description: 'Compra de Insumos de Uñas', category: 'Insumos', paymentMethod: 'Efectivo', date: todayStr }
]

const initialNotifications = [
  { id: 'notif-1', title: 'Promoción 2x1 en Limpieza Facial', description: 'Por este mes de Agosto, agendando tu cita recibes hidratación gratis.', active: true, date: '2026-08-10' },
  { id: 'notif-2', title: 'Nuevos Tonos de Esmaltes Rusos', description: 'Llegó la colección Primavera a Catheryne Ríos Estética', active: true, date: '2026-08-08' }
]

const initialCashSessions = [
  {
    id: 'session-1',
    responsibleId: '1',
    responsibleName: 'Catheryne Ríos',
    initialBase: 100000,
    openedAt: `${todayStr} 08:30 AM`,
    closedAt: null,
    status: 'Abierta',
    notes: 'Apertura de turno de la mañana'
  }
]

const initialClients = [
  { id: 'client-1', name: 'Sofía Martínez', phone: '3001234567', email: 'sofia.martinez@email.com', notes: 'Prefiere tonos pastel para uñas. Alérgica al látex.', registeredAt: '2026-07-15' },
  { id: 'client-2', name: 'Lucía Gómez', phone: '3109876543', email: 'lucia.gomez@email.com', notes: 'Piel sensible. Recomendada masoterapia facial.', registeredAt: '2026-06-20' },
  { id: 'client-3', name: 'Mariana López', phone: '3205554433', email: 'mariana.lopez@email.com', notes: 'Cliente VIP. Asiste cada 15 días.', registeredAt: '2026-05-10' },
  { id: 'client-4', name: 'Andrea Benítez', phone: '3009871234', email: 'andrea.b@email.com', notes: 'Tratamiento Botox Capilar realizado.', registeredAt: '2026-08-01' }
]

export function AdminProvider({ children }) {
  // 1. Configuración del Negocio
  const [businessConfig, setBusinessConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_business_config')
      return saved ? JSON.parse(saved) : initialBusinessConfig
    } catch (e) { return initialBusinessConfig }
  })

  // 2. Roles del Sistema: 'OWNER' (Dueña) | 'ADMIN' (Administradora) | 'SPECIALIST' (Especialista)
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_current_role')
      return saved || 'OWNER'
    } catch (e) { return 'OWNER' }
  })

  const [currentSpecialistId, setCurrentSpecialistId] = useState('2') // Valentina Silva por defecto

  // 3. Categorías y Servicios
  const [serviceCategories, setServiceCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_categories')
      return saved ? JSON.parse(saved) : initialServiceCategoriesData
    } catch (e) { return initialServiceCategoriesData }
  })

  // 4. Equipo
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_team')
      return saved ? JSON.parse(saved) : initialTeam
    } catch (e) { return initialTeam }
  })

  // 5. Citas
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_appointments')
      if (!saved) return initialAppointments
      const parsed = JSON.parse(saved)
      const existingIds = new Set(parsed.map(a => a.id))
      const missingInitial = initialAppointments.filter(a => !existingIds.has(a.id))
      return [...parsed, ...missingInitial]
    } catch (e) { return initialAppointments }
  })

  // 6. Transacciones & Finanzas
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_transactions')
      return saved ? JSON.parse(saved) : initialTransactions
    } catch (e) { return initialTransactions }
  })

  // 7. Notificaciones / Banners
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_notifications')
      return saved ? JSON.parse(saved) : initialNotifications
    } catch (e) { return initialNotifications }
  })

  // 8. Sesiones de Caja & Reconciliaciones
  const [cashSessions, setCashSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_cash_sessions')
      return saved ? JSON.parse(saved) : initialCashSessions
    } catch (e) { return initialCashSessions }
  })

  const [reconciliations, setReconciliations] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_reconciliations')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })

  // 9. Clientes CRM
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_clients')
      return saved ? JSON.parse(saved) : initialClients
    } catch (e) { return initialClients }
  })

  // 10. Productos de la Tienda
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_products')
      return saved ? JSON.parse(saved) : initialProductsData
    } catch (e) { return initialProductsData }
  })

  // 11. Planes de Membresía VIP (CMS Autónomo)
  const [memberships, setMemberships] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_memberships')
      return saved ? JSON.parse(saved) : initialMembershipsData
    } catch (e) { return initialMembershipsData }
  })

  // 12. Días de Cierre, Festivos y Vacaciones (Bloqueo de Calendario)
  const [closedDates, setClosedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_closed_dates')
      return saved ? JSON.parse(saved) : initialClosedDates
    } catch (e) { return initialClosedDates }
  })

  // Sincronización Viva con PostgreSQL en Supabase al cargar la aplicación
  useEffect(() => {
    let isMounted = true
    async function loadLiveDatabase() {
      try {
        const [
          liveConfig, 
          liveMemberships, 
          liveClosedDates, 
          liveCategories, 
          liveProducts, 
          liveTeam,
          liveClients,
          liveSessions,
          liveTxs,
          liveApps
        ] = await Promise.all([
          api.getConfig(),
          api.getMemberships(),
          api.getClosedDates(),
          api.getCategories(),
          api.getProducts(),
          api.getTeam(),
          api.getClients(),
          api.getCashSessions(),
          api.getCashTransactions(),
          api.getAppointments()
        ])

        if (!isMounted) return

        if (liveConfig) setBusinessConfig(prev => ({ ...prev, ...liveConfig }))
        if (liveMemberships && liveMemberships.length > 0) setMemberships(liveMemberships)
        if (liveClosedDates && liveClosedDates.length > 0) setClosedDates(liveClosedDates)
        if (liveCategories && liveCategories.length > 0) setServiceCategories(liveCategories)
        if (liveProducts && liveProducts.length > 0) setProducts(liveProducts)
        if (liveTeam && liveTeam.length > 0) setTeamMembers(liveTeam)
        if (liveClients && liveClients.length > 0) setClients(liveClients)
        if (liveSessions && liveSessions.length > 0) setCashSessions(liveSessions)
        if (liveTxs && liveTxs.length > 0) setTransactions(liveTxs)
        if (liveApps && liveApps.appointments && liveApps.appointments.length > 0) setAppointments(liveApps.appointments)

        // S.H.I.E.L.D. Pillar 20: Auto-Backup silencioso
        runSilentAutoBackup({
          businessConfig: liveConfig || businessConfig,
          serviceCategories: liveCategories || serviceCategories,
          memberships: liveMemberships || memberships,
          closedDates: liveClosedDates || closedDates,
          teamMembers: liveTeam || teamMembers,
          products: liveProducts || products,
          clients: liveClients || clients,
          appointments: (liveApps && liveApps.appointments) || appointments,
          cashSessions: liveSessions || cashSessions,
          transactions: liveTxs || transactions,
        })
      } catch (e) {
        console.warn('Conexión a PostgreSQL en segundo plano:', e)
      }
    }
    loadLiveDatabase()
    return () => { isMounted = false }
  }, [])

  // Sincronización automática con localStorage
  useEffect(() => {
    try { localStorage.setItem('spa_admin_business_config', JSON.stringify(businessConfig)) } catch (e) {}
  }, [businessConfig])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_memberships', JSON.stringify(memberships)) } catch (e) {}
  }, [memberships])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_closed_dates', JSON.stringify(closedDates)) } catch (e) {}
  }, [closedDates])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_current_role', currentUserRole) } catch (e) {}
  }, [currentUserRole])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_categories', JSON.stringify(serviceCategories)) } catch (e) {}
  }, [serviceCategories])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_team', JSON.stringify(teamMembers)) } catch (e) {}
  }, [teamMembers])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_products', JSON.stringify(products)) } catch (e) {}
  }, [products])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_appointments', JSON.stringify(appointments)) } catch (e) {}
  }, [appointments])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_transactions', JSON.stringify(transactions)) } catch (e) {}
  }, [transactions])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_notifications', JSON.stringify(notifications)) } catch (e) {}
  }, [notifications])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_cash_sessions', JSON.stringify(cashSessions)) } catch (e) {}
  }, [cashSessions])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_clients', JSON.stringify(clients)) } catch (e) {}
  }, [clients])

  useEffect(() => {
    try { localStorage.setItem('spa_admin_reconciliations', JSON.stringify(reconciliations)) } catch (e) {}
  }, [reconciliations])

  // ----------------------------------------------------
  // GESTIÓN DE CONFIGURACIÓN & PIN MAESTRO
  // ----------------------------------------------------
  const updateBusinessConfig = (newConfig) => {
    setBusinessConfig(prev => {
      const merged = { ...prev, ...newConfig }
      api.updateConfig(merged)
      return merged
    })
  }

  const verifyMasterPin = (pin) => {
    return String(pin).trim() === String(businessConfig.masterPin || '2026').trim()
  }

  const changeMasterPin = (newPin) => {
    setBusinessConfig(prev => ({ ...prev, masterPin: String(newPin).trim() }))
  }

  // ----------------------------------------------------
  // GESTIÓN DE CATEGORÍAS & SERVICIOS (CMS)
  // ----------------------------------------------------
  const addCategory = (categoryData) => {
    const newCat = {
      id: categoryData.id || `cat-${Date.now()}`,
      services: [],
      active: true,
      ...categoryData
    }
    setServiceCategories(prev => [...prev, newCat])
    api.createCategory(categoryData)
  }

  const updateCategory = (id, updatedData) => {
    setServiceCategories(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c))
    api.updateCategory(id, updatedData)
  }

  const deleteCategory = (id) => {
    setServiceCategories(prev => prev.filter(c => c.id !== id))
    api.deleteCategory(id)
  }

  const addService = (categoryId, serviceData) => {
    const newService = {
      id: serviceData.id || `srv-${Date.now()}`,
      active: true,
      ...serviceData
    }

    setServiceCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          services: [...(cat.services || []), newService]
        }
      }
      return cat
    }))
    api.createService({ categoryId, ...serviceData })
  }

  const updateService = (serviceId, updatedData) => {
    setServiceCategories(prev => prev.map(cat => ({
      ...cat,
      services: (cat.services || []).map(s => s.id === serviceId ? { ...s, ...updatedData } : s)
    })))
    api.updateService(serviceId, updatedData)
  }

  const toggleServiceActive = (serviceId) => {
    setServiceCategories(prev => prev.map(cat => ({
      ...cat,
      services: (cat.services || []).map(s => {
        if (s.id === serviceId) {
          const nextActive = s.active !== false ? false : true
          api.updateService(serviceId, { active: nextActive })
          return { ...s, active: nextActive }
        }
        return s
      })
    })))
  }

  const deleteService = (serviceId) => {
    setServiceCategories(prev => prev.map(cat => ({
      ...cat,
      services: (cat.services || []).filter(s => s.id !== serviceId)
    })))
    api.deleteService(serviceId)
  }

  // Array aplanado de todos los servicios para vistas que lo requieran
  const servicesList = serviceCategories.flatMap(cat => 
    (cat.services || []).map(s => ({ ...s, categoryId: cat.id, categoryName: cat.name }))
  )

  // ----------------------------------------------------
  // GESTIÓN DE PRODUCTOS & STOCK
  // ----------------------------------------------------
  const addProduct = (productData) => {
    const newProduct = {
      id: `prod-${Date.now()}`,
      stock: 10,
      status: 'Disponible',
      rating: 5,
      reviews: 0,
      active: true,
      ...productData
    }
    setProducts(prev => [newProduct, ...prev])
    api.createProduct(productData)
  }

  const updateProduct = (id, updatedData) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p))
    api.updateProduct(id, updatedData)
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    api.deleteProduct(id)
  }

  const toggleProductAvailability = (id) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const isAvailable = p.status === 'Disponible' || p.stock > 0
        const nextStatus = isAvailable ? 'Agotado' : 'Disponible'
        const nextStock = isAvailable ? 0 : 10
        api.updateProduct(id, { status: nextStatus, stock: nextStock })
        return {
          ...p,
          status: nextStatus,
          stock: nextStock
        }
      }
      return p
    }))
  }

  // ----------------------------------------------------
  // GESTIÓN DE EQUIPO
  // ----------------------------------------------------
  const addTeamMember = (member) => {
    const newMember = {
      id: `team-${Date.now()}`,
      active: true,
      commissionRate: 45,
      ...member
    }
    setTeamMembers(prev => [...prev, newMember])
    api.createTeamMember(member)
  }

  const updateTeamMember = (id, updated) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
    api.updateTeamMember(id, updated)
  }

  const deleteTeamMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
    api.deleteTeamMember(id)
  }

  // ----------------------------------------------------
  // CAJA & ARQUEO CIEGO
  // ----------------------------------------------------
  const activeCashSession = cashSessions.find(s => s.status === 'Abierta')

  const openCashSession = ({ responsibleId, responsibleName, initialBase, notes }) => {
    const nowStr = getLocalDateTimeString()
    const newSession = {
      id: `session-${Date.now()}`,
      responsibleId: responsibleId || '1',
      responsibleName: responsibleName || 'Catheryne Ríos',
      initialBase: parseFloat(initialBase) || 0,
      openedAt: nowStr,
      closedAt: null,
      status: 'Abierta',
      notes: notes || 'Apertura de Turno de Caja'
    }
    setCashSessions(prev => [newSession, ...prev])
    api.openCashSession(newSession)
  }

  const closeCashSession = ({ actualCash, notes }) => {
    if (!activeCashSession) return
    const nowStr = getLocalDateTimeString()
    
    const cashInflows = transactions
      .filter(t => t.type === 'Ingreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((acc, t) => acc + t.amount, 0)

    const cashOutflows = transactions
      .filter(t => t.type === 'Egreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((acc, t) => acc + t.amount, 0)

    const expectedCash = activeCashSession.initialBase + cashInflows - cashOutflows
    const realCash = parseFloat(actualCash) || 0
    const difference = realCash - expectedCash

    setCashSessions(prev => prev.map(s => {
      if (s.id === activeCashSession.id) {
        return {
          ...s,
          actualCash: realCash,
          closedAt: nowStr,
          status: 'Cerrada',
          difference,
          isReconciled: difference === 0,
          reconciliationStatus: difference === 0 ? 'Cuadrada Perfecta' : 'Pendiente Reconciliación',
          closingNotes: notes || ''
        }
      }
      return s
    }))
    api.closeCashSession({ actualCash: realCash, closingNotes: notes || '' })
  }

  const reconcileCashSession = ({ sessionId, resolutionType, amount, reason, resolvedBy }) => {
    const nowStr = getLocalDateTimeString()
    const recId = `rec-${Date.now()}`

    const newRec = {
      id: recId,
      sessionId,
      resolutionType,
      amount: parseFloat(amount) || 0,
      reason,
      resolvedBy,
      resolvedAt: nowStr
    }

    setReconciliations(prev => [newRec, ...prev])

    setCashSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          isReconciled: true,
          reconciliationId: recId,
          reconciliationStatus: 'Reconciliada & Cuadrada',
          resolutionType,
          resolutionReason: reason
        }
      }
      return s
    }))

    addTransaction({
      id: `tx-${Date.now()}`,
      type: resolutionType === 'Reposición Responsable' || resolutionType === 'Ajuste de Sobrante' || resolutionType === 'Pago Olvidado' ? 'Ingreso' : 'Egreso',
      amount: parseFloat(amount) || 0,
      description: `[Reconciliación de Caja] ${resolutionType}: ${reason}`,
      category: 'Ajuste de Caja',
      paymentMethod: 'Efectivo',
      date: getLocalDateString()
    })

    api.reconcileCashSession(sessionId, { resolutionType, amount, reason, resolvedBy })
  }

  // ----------------------------------------------------
  // CITAS & AGENDAMIENTO
  // ----------------------------------------------------
  const addAppointment = (app) => {
    const specialist = teamMembers.find(t => t.id === app.specialistId)
    const rate = specialist?.commissionRate || 45
    const netCommission = ((app.price || 0) * rate) / 100

    setAppointments(prev => [{ ...app, commissionAmount: netCommission }, ...prev])
  }

  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    api.updateAppointmentStatus(id, newStatus)
  }

  const updateAppointment = (id, updatedData) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a))
  }

  const cancelAppointment = (id, { reason, details, responsibleName }) => {
    const targetApp = appointments.find(a => a.id === id)
    if (!targetApp) return

    const nowStr = getLocalDateTimeString()

    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Cancelada',
          cancelReason: reason || 'Cancelación de Cita',
          cancelDetails: details || '',
          canceledBy: responsibleName || 'Administración',
          canceledAt: nowStr
        }
      }
      return a
    }))

    setTransactions(prev => prev.filter(t => !t.description.includes(targetApp.clientName) || !t.description.includes(targetApp.serviceName)))

    const auditRecord = {
      id: `rec-cancel-${Date.now()}`,
      sessionId: 'appointment-audit',
      resolutionType: 'Anulación de Cita',
      amount: targetApp.price || 0,
      reason: `Cita anulada: ${targetApp.serviceName} ($${(targetApp.price || 0).toLocaleString()} COP) de ${targetApp.clientName}. Motivo: ${reason}${details ? ` - Detalle: ${details}` : ''}`,
      resolvedBy: responsibleName || 'Administración',
      resolvedAt: nowStr
    }
    setReconciliations(prev => [auditRecord, ...prev])
    api.cancelAppointment(id, { reason, details, canceledBy: responsibleName })
  }

  const deleteAppointment = (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  const addTransaction = (tx) => {
    setTransactions(prev => [{ paymentMethod: 'Efectivo', ...tx }, ...prev])
    api.createCashTransaction(tx)
  }

  const addNotification = (notif) => setNotifications(prev => [notif, ...prev])
  const toggleNotificationActive = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, active: !n.active } : n))
  }
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const addClient = (clientData) => {
    setClients(prev => [clientData, ...prev])
    api.createClient(clientData)
  }

  const updateClient = (id, updatedData) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c))
    api.updateClient(id, updatedData)
  }

  // 11. Handlers de Membresías VIP
  const updateMembership = (id, updatedFields) => {
    setMemberships(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updatedFields } : m)
      api.updateMembership(id, updatedFields)
      return updated
    })
  }

  const addMembership = (newPlan) => {
    const planId = newPlan.id || `plan-${Date.now()}`
    setMemberships(prev => [...prev, { ...newPlan, id: planId }])
  }

  const deleteMembership = (id) => {
    setMemberships(prev => prev.filter(m => m.id !== id))
  }

  // 12. Handlers de Días de Cierre, Festivos y Vacaciones
  const addClosedDate = (data) => {
    const newClose = {
      id: `close-${Date.now()}`,
      date: data.date,
      reason: data.reason || 'Cierre de Sede',
      type: data.type || 'Festivo'
    }
    setClosedDates(prev => [newClose, ...prev])
    api.createClosedDate(data)
  }

  const deleteClosedDate = (id) => {
    setClosedDates(prev => prev.filter(c => c.id !== id))
    api.deleteClosedDate(id)
  }

  const isDateClosed = (dateStr) => {
    return closedDates.find(c => c.date === dateStr) || null
  }

  return (
    <AdminContext.Provider value={{
      // Configuración & Roles
      businessConfig,
      updateBusinessConfig,
      currentUserRole,
      setCurrentUserRole,
      currentSpecialistId,
      setCurrentSpecialistId,
      verifyMasterPin,
      changeMasterPin,

      // CMS Categorías & Servicios
      serviceCategories,
      servicesList,
      addCategory,
      updateCategory,
      deleteCategory,
      addService,
      updateService,
      deleteService,
      toggleServiceActive,

      // Tienda & Productos
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductAvailability,

      // Equipo
      teamMembers,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,

      // Membresías VIP
      memberships,
      updateMembership,
      addMembership,
      deleteMembership,

      // Días de Cierre & Festivos
      closedDates,
      addClosedDate,
      deleteClosedDate,
      isDateClosed,

      // Citas & Agenda
      appointments,
      addAppointment,
      updateAppointmentStatus,
      updateAppointment,
      deleteAppointment,
      cancelAppointment,

      // Caja & Finanzas
      transactions,
      addTransaction,
      cashSessions,
      activeCashSession,
      openCashSession,
      closeCashSession,
      reconcileCashSession,
      reconciliations,

      // Notificaciones & Clientes
      notifications,
      addNotification,
      toggleNotificationActive,
      deleteNotification,
      clients,
      addClient,
      updateClient
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
