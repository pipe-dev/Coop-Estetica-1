import React, { createContext, useContext, useState, useEffect } from 'react'
import { getLocalDateString, getLocalDateTimeString } from '../utils/currencyUtils'
import { products as initialProductsData } from '../data/products'
import { serviceCategories as initialServiceCategoriesData } from '../data/services'
import { team as initialTeamData } from '../data/team'
import { memberships as initialMembershipsData } from '../data/memberships'
import { api } from '../services/api'
import { mutationQueue } from '../utils/securityService'
import { runSilentAutoBackup } from '../utils/autoBackupService'
import { clearCopilotCache } from '../services/aiCopilotService'

const AdminContext = createContext()

const CURRENT_STORAGE_VERSION = '2026_VIRGIN_PURE_V1'
try {
  if (typeof window !== 'undefined' && localStorage.getItem('spa_storage_version') !== CURRENT_STORAGE_VERSION) {
    const keysToPurge = [
      'spa_admin_categories',
      'spa_admin_team',
      'spa_admin_appointments',
      'spa_admin_transactions',
      'spa_admin_notifications',
      'spa_admin_cash_sessions',
      'spa_admin_reconciliations',
      'spa_admin_clients',
      'spa_admin_products',
      'spa_admin_memberships',
      'spa_admin_closed_dates',
      'spa_admin_business_config',
      'spa_groq_api_key'
    ]
    keysToPurge.forEach(k => localStorage.removeItem(k))
    localStorage.setItem('spa_storage_version', CURRENT_STORAGE_VERSION)
  }
} catch (e) {}

const todayStr = getLocalDateString()

const initialClosedDates = []

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

const initialTeam = []
const initialAppointments = []
const initialTransactions = []
const initialNotifications = []
const initialCashSessions = []
const initialClients = []

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

  const [currentSpecialistId, setCurrentSpecialistId] = useState('')

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
      return saved ? JSON.parse(saved) : initialAppointments
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

        setBusinessConfig(liveConfig || initialBusinessConfig)
        setServiceCategories(liveCategories || [])
        setMemberships(liveMemberships || [])
        setClosedDates(liveClosedDates || [])
        setProducts(liveProducts || [])
        setTeamMembers(liveTeam || [])
        setClients(liveClients || [])
        setCashSessions(liveSessions || [])
        setTransactions(liveTxs || [])
        setAppointments((liveApps && liveApps.appointments) || [])

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

  // S.H.I.E.L.D. Copilot Real-Time Cache Invalidation
  useEffect(() => {
    clearCopilotCache()
  }, [appointments, transactions, cashSessions, products, clients, serviceCategories, teamMembers, businessConfig, closedDates])

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
