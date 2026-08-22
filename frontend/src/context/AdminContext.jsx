import React, { createContext, useContext, useState, useEffect } from 'react'
import { getLocalDateString, getLocalDateTimeString } from '../utils/currencyUtils'
import { products as initialProductsData } from '../data/products'

const AdminContext = createContext()

const todayStr = getLocalDateString()

const initialTeam = [
  { id: '1', name: 'Catheryne Ríos', role: 'Directora & Esteticista', phone: '3006269056', active: true, color: '#D4AF37', commissionRate: 50 },
  { id: '2', name: 'Valentina Silva', role: 'Especialista en Uñas', phone: '3012345678', active: true, color: '#EC4899', commissionRate: 40 },
  { id: '3', name: 'Camila Torres', role: 'Cosmiatra & Masajista', phone: '3029876543', active: true, color: '#8B5CF6', commissionRate: 45 }
]

const initialServices = [
  { id: '1', name: 'Manicura Rusa VIP', category: 'unas', price: 120000, duration: 60, active: true },
  { id: '2', name: 'Limpieza Facial Profunda', category: 'facial', price: 180000, duration: 90, active: true },
  { id: '3', name: 'Masaje Relajante de Spa', category: 'corporal', price: 220000, duration: 60, active: true },
  { id: '4', name: 'Maquillaje Profesional Social', category: 'maquillaje', price: 150000, duration: 60, active: true },
  { id: '5', name: 'Tratamiento Capilar Botox', category: 'cabello', price: 250000, duration: 90, active: true }
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
  { id: 'app-1', clientName: 'Sofía Martínez', clientPhone: '3001234567', serviceId: '1', serviceName: 'Manicura Rusa VIP', specialistId: '2', specialistName: 'Valentina Silva', date: todayStr, time: '10:00 AM', price: 120000, status: 'Reservada' },
  { id: 'app-2', clientName: 'Lucía Gómez', clientPhone: '3109876543', serviceId: '2', serviceName: 'Limpieza Facial Profunda', specialistId: '3', specialistName: 'Camila Torres', date: todayStr, time: '02:00 PM', price: 180000, status: 'Pagada' },
  { id: 'app-3', clientName: 'Mariana López', clientPhone: '3205554433', serviceId: '3', serviceName: 'Masaje Relajante de Spa', specialistId: '1', specialistName: 'Catheryne Ríos', date: todayStr, time: '04:30 PM', price: 220000, status: 'En Atención' },
  
  // MAÑANA (Tomorrow)
  { id: 'app-4', clientName: 'Andrea Benítez', clientPhone: '3009871234', serviceId: '4', serviceName: 'Maquillaje Profesional Social', specialistId: '1', specialistName: 'Catheryne Ríos', date: tomorrowStr, time: '09:00 AM', price: 150000, status: 'Reservada' },
  { id: 'app-5', clientName: '🚫 Espacio Bloqueado (Almuerzo)', clientPhone: '', serviceId: 'block', serviceName: '[Almuerzo] Bloqueo de Horario', specialistId: '2', specialistName: 'Valentina Silva', date: tomorrowStr, time: '01:00 PM - 02:00 PM', price: 0, status: 'Reservada' },
  { id: 'app-6', clientName: 'Carolina Mendoza', clientPhone: '3157778899', serviceId: '5', serviceName: 'Tratamiento Capilar Botox', specialistId: '3', specialistName: 'Camila Torres', date: tomorrowStr, time: '03:30 PM', price: 250000, status: 'Reservada' },

  // EN 2 DÍAS
  { id: 'app-7', clientName: 'Daniela Ospina', clientPhone: '3124445566', serviceId: '1', serviceName: 'Manicura Rusa VIP', specialistId: '2', specialistName: 'Valentina Silva', date: inTwoDaysStr, time: '11:00 AM', price: 120000, status: 'Reservada' },
  { id: 'app-8', clientName: 'Gabriela Vargas', clientPhone: '3189990011', serviceId: '2', serviceName: 'Limpieza Facial Profunda', specialistId: '1', specialistName: 'Catheryne Ríos', date: inTwoDaysStr, time: '02:30 PM', price: 180000, status: 'Reservada' },

  // EN 3 DÍAS
  { id: 'app-9', clientName: 'Paula Andrea Jaramillo', clientPhone: '3016667788', serviceId: '3', serviceName: 'Masaje Relajante de Spa', specialistId: '3', specialistName: 'Camila Torres', date: inThreeDaysStr, time: '10:00 AM', price: 220000, status: 'Reservada' }
]

const initialTransactions = [
  { id: 'tx-1', type: 'Ingreso', amount: 180000, description: 'Pago Limpieza Facial - Lucía Gómez', category: 'Servicios', paymentMethod: 'Nequi', date: todayStr },
  { id: 'tx-2', type: 'Egreso', amount: 45000, description: 'Compra de Insumos de Uñas', category: 'Insumos', paymentMethod: 'Efectivo', date: todayStr }
]

const initialNotifications = [
  { id: 'notif-1', title: '✨ Promoción 2x1 en Limpieza Facial', description: 'Por este mes de Agosto, agendando tu cita recibes hidratación gratis.', active: true, date: '2026-08-10' },
  { id: 'notif-2', title: '💅 Nuevos Tonos de Esmaltes Rusos', description: '¡Llegó la colección Primavera a Catheryne Ríos Estética!', active: true, date: '2026-08-08' }
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
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_team')
      return saved ? JSON.parse(saved) : initialTeam
    } catch (e) { return initialTeam }
  })

  const [servicesList, setServicesList] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_services')
      return saved ? JSON.parse(saved) : initialServices
    } catch (e) { return initialServices }
  })

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

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_transactions')
      return saved ? JSON.parse(saved) : initialTransactions
    } catch (e) { return initialTransactions }
  })

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_notifications')
      return saved ? JSON.parse(saved) : initialNotifications
    } catch (e) { return initialNotifications }
  })

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

  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_clients')
      return saved ? JSON.parse(saved) : initialClients
    } catch (e) { return initialClients }
  })

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('spa_admin_products')
      return saved ? JSON.parse(saved) : initialProductsData
    } catch (e) { return initialProductsData }
  })

  useEffect(() => {
    try {
      localStorage.setItem('spa_admin_products', JSON.stringify(products))
    } catch (e) {}
  }, [products])

  const addProduct = (productData) => {
    const newProduct = {
      id: `prod-${Date.now()}`,
      stock: 10,
      status: 'Disponible',
      rating: 4.8,
      reviews: 0,
      ...productData
    }
    setProducts(prev => [newProduct, ...prev])
  }

  const updateProduct = (id, updatedData) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p))
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const toggleProductAvailability = (id) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const isAvailable = p.status === 'Disponible' || p.stock > 0
        return {
          ...p,
          status: isAvailable ? 'Agotado' : 'Disponible',
          stock: isAvailable ? 0 : 10
        }
      }
      return p
    }))
  }



  useEffect(() => {
    localStorage.setItem('spa_admin_appointments', JSON.stringify(appointments))
  }, [appointments])

  useEffect(() => {
    localStorage.setItem('spa_admin_transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('spa_admin_team', JSON.stringify(teamMembers))
  }, [teamMembers])

  useEffect(() => {
    localStorage.setItem('spa_admin_services', JSON.stringify(servicesList))
  }, [servicesList])

  useEffect(() => {
    localStorage.setItem('spa_admin_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('spa_admin_cash_sessions', JSON.stringify(cashSessions))
  }, [cashSessions])

  useEffect(() => {
    localStorage.setItem('spa_admin_clients', JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem('spa_admin_reconciliations', JSON.stringify(reconciliations))
  }, [reconciliations])

  const activeCashSession = cashSessions.find(s => s.status === 'Abierta')

  const openCashSession = ({ responsibleId, responsibleName, initialBase, notes }) => {
    const nowStr = getLocalDateTimeString()
    const newSession = {
      id: `session-${Date.now()}`,
      responsibleId,
      responsibleName,
      initialBase: parseFloat(initialBase) || 0,
      openedAt: nowStr,
      closedAt: null,
      status: 'Abierta',
      notes: notes || 'Apertura de Turno de Caja'
    }
    setCashSessions(prev => [newSession, ...prev])
  }

  const closeCashSession = ({ actualCash, notes }) => {
    if (!activeCashSession) return

    const nowStr = getLocalDateTimeString()
    
    // Calculate cash generated during this session
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
          status: 'Cerrada',
          closedAt: nowStr,
          cashInflows,
          cashOutflows,
          expectedCash,
          realCash,
          difference,
          isReconciled: difference === 0,
          reconciliationStatus: difference === 0 ? 'Cuadrada Perfecta' : 'Pendiente Reconciliación',
          closingNotes: notes || ''
        }
      }
      return s
    }))
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

    // Automatically log adjustment transaction to balance books
    addTransaction({
      id: `tx-${Date.now()}`,
      type: resolutionType === 'Reposición Responsable' || resolutionType === 'Ajuste de Sobrante' || resolutionType === 'Pago Olvidado' ? 'Ingreso' : 'Egreso',
      amount: parseFloat(amount) || 0,
      description: `[Reconciliación de Caja] ${resolutionType}: ${reason}`,
      category: 'Ajuste de Caja',
      paymentMethod: 'Efectivo',
      date: getLocalDateString()
    })
  }

  const addAppointment = (app) => setAppointments(prev => [app, ...prev])
  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const updateAppointment = (id, updatedData) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a))
  }

  const cancelAppointment = (id, { reason, details, responsibleName }) => {
    const targetApp = appointments.find(a => a.id === id)
    if (!targetApp) return

    const nowStr = getLocalDateTimeString()

    // 1. Mark appointment as Cancelada with audit metadata
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

    // 2. If appointment had a registered sale transaction, remove it to keep balance true
    setTransactions(prev => prev.filter(t => !t.description.includes(targetApp.clientName) || !t.description.includes(targetApp.serviceName)))

    // 3. Log immutable cancellation event in reconciliations/audit log
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
  }

  const reactivateAppointment = (id) => {
    const targetApp = appointments.find(a => a.id === id)
    if (!targetApp) return

    // Revert status to Reservada
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Reservada', cancelReason: undefined, cancelDetails: undefined } : a))

    // Remove associated sale transaction if it was logged
    setTransactions(prev => prev.filter(t => !t.description.includes(targetApp.clientName) || !t.description.includes(targetApp.serviceName)))
  }

  const deleteAppointment = (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  const addTransaction = (tx) => setTransactions(prev => [{ paymentMethod: 'Efectivo', ...tx }, ...prev])
  
  const addTeamMember = (member) => setTeamMembers(prev => [...prev, member])
  const updateTeamMember = (id, updated) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
  }

  const addService = (service) => setServicesList(prev => [...prev, service])
  const updateService = (id, updated) => {
    setServicesList(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
  }

  const addNotification = (notif) => setNotifications(prev => [notif, ...prev])
  const toggleNotificationActive = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, active: !n.active } : n))
  }
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const addClient = (clientData) => setClients(prev => [clientData, ...prev])
  const updateClient = (id, updatedData) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c))
  }

  return (
    <AdminContext.Provider value={{
      teamMembers,
      servicesList,
      appointments,
      transactions,
      notifications,
      cashSessions,
      reconciliations,
      clients,
      products,
      activeCashSession,
      openCashSession,
      closeCashSession,
      reconcileCashSession,
      addAppointment,
      updateAppointmentStatus,
      updateAppointment,
      deleteAppointment,
      cancelAppointment,
      reactivateAppointment,
      addTransaction,
      addTeamMember,
      updateTeamMember,
      addService,
      updateService,
      addNotification,
      toggleNotificationActive,
      deleteNotification,
      addClient,
      updateClient,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductAvailability
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
