// Cliente de conexión HTTP y sincronización viva con PostgreSQL para Catheryne Ríos Estética
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://coop-estetica-1-backe.onrender.com/api'
    }
  }
  return 'http://localhost:4000/api'
}
const API_BASE_URL = getApiBaseUrl()

export const purgeAdminAuth = (reason = 'Sesión no válida o expirada') => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('spa_admin_token')
      sessionStorage.removeItem('spa_admin_authed')
      sessionStorage.removeItem('spa_admin_role')
      localStorage.removeItem('spa_admin_token')
      localStorage.removeItem('spa_admin_authed')
      localStorage.removeItem('spa_admin_current_role')
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('spa_auth_ejected', { detail: { reason } }))
  }
}

export const getAdminHeaders = () => {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('spa_admin_token') || localStorage.getItem('spa_admin_token')) : null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export const authFetch = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('spa_admin_token') || localStorage.getItem('spa_admin_token')) : null
  
  // Si no hay token de autenticación, evitar llamadas protegidas y no expulsar sesión
  if (!token) {
    return new Response(JSON.stringify({ unauthenticated: true }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // En modo contingencia local (token local-...), responder localmente sin llamar a servidor remoto
  if (token.startsWith('local-')) {
    console.warn('[authFetch] Modo contingencia local activo para:', url)
    return new Response(JSON.stringify({ offline: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const adminHeaders = getAdminHeaders()
  const headers = {
    ...adminHeaders,
    ...(options.headers || {})
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401 || res.status === 403) {
    // Solo expulsar si el usuario tenía un token real que expiró o fue revocado
    purgeAdminAuth('Acceso denegado: Token no válido, manipulado o expirado. Se ha cerrado la sesión por seguridad.')
    throw new Error('401 Unauthorized: Sesión expulsada')
  }
  return res
}

export const api = {
  // ----------------------------------------------------
  // 1. CONFIGURACIÓN DEL NEGOCIO
  // ----------------------------------------------------
  async getConfig() {
    try {
      const res = await fetch(`${API_BASE_URL}/config`)
      if (!res.ok) throw new Error('Error al obtener configuración')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando configuración local', e)
      return null
    }
  },

  async getAdminConfig() {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config`)
      if (!res.ok) throw new Error('Error al obtener configuración administrativa')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al obtener configuración administrativa, intentando fallback público:', e)
      return this.getConfig()
    }
  },

  async verifyPin(pin) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: String(pin).trim() }),
      })
      if (res.status === 429) {
        return { valid: false, rateLimited: true, error: 'Demasiados intentos. Espera 30 segundos antes de reintentar.' }
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        return { valid: false, error: errData.message || 'PIN no válido' }
      }
      return await res.json()
    } catch (e) {
      console.error('Fallo al validar PIN con el servidor:', e)
      return { valid: false, error: 'Servidor no disponible', networkError: true }
    }
  },

  async updateConfig(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/config`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al actualizar configuración en DB')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al sincronizar con PostgreSQL en backend:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 2. CATEGORÍAS & SERVICIOS
  // ----------------------------------------------------
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`)
      if (!res.ok) throw new Error('Error al obtener categorías')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando categorías locales', e)
      return null
    }
  },

  async createCategory(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al crear categoría en DB:', e)
      return null
    }
  },

  async updateCategory(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar categoría en DB:', e)
      return null
    }
  },

  async deleteCategory(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar categoría en DB:', e)
      return null
    }
  },

  async getServices() {
    try {
      const res = await fetch(`${API_BASE_URL}/services`)
      if (!res.ok) throw new Error('Error al obtener servicios')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando servicios locales', e)
      return null
    }
  },

  async createService(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/services`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al crear servicio en DB:', e)
      return null
    }
  },

  async updateService(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar servicio en DB:', e)
      return null
    }
  },

  async deleteService(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar servicio en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 3. PRODUCTOS DE LA TIENDA
  // ----------------------------------------------------
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`)
      if (!res.ok) throw new Error('Error al obtener productos')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando productos locales', e)
      return null
    }
  },

  async createProduct(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al crear producto en DB:', e)
      return null
    }
  },

  async updateProduct(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar producto en DB:', e)
      return null
    }
  },

  async deleteProduct(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar producto en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 4. EQUIPO DE ESPECIALISTAS
  // ----------------------------------------------------
  async getTeam() {
    try {
      const res = await fetch(`${API_BASE_URL}/team`)
      if (!res.ok) throw new Error('Error al obtener equipo')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando equipo local', e)
      return null
    }
  },

  async createTeamMember(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/team`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al crear especialista en DB:', e)
      return null
    }
  },

  async updateTeamMember(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/team/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar especialista en DB:', e)
      return null
    }
  },

  async deleteTeamMember(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/team/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar especialista en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 5. MEMBRESÍAS VIP
  // ----------------------------------------------------
  async getMemberships() {
    try {
      const res = await fetch(`${API_BASE_URL}/memberships`)
      if (!res.ok) throw new Error('Error al obtener membresías')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando membresías locales', e)
      return null
    }
  },

  async createMembership(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/memberships`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al crear membresía en DB:', e)
      return null
    }
  },

  async updateMembership(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/memberships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar membresía en DB:', e)
      return null
    }
  },

  async deleteMembership(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/memberships/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar membresía en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 6. DÍAS DE CIERRE, FESTIVOS & VACACIONES
  // ----------------------------------------------------
  async getClosedDates() {
    try {
      const res = await fetch(`${API_BASE_URL}/closed-dates`)
      if (!res.ok) throw new Error('Error al obtener fechas de cierre')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando fechas de cierre locales', e)
      return null
    }
  },

  async createClosedDate(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/closed-dates`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al guardar fecha de cierre en DB:', e)
      return null
    }
  },

  async deleteClosedDate(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/closed-dates/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar fecha de cierre en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 7. CLIENTES (CRM)
  // ----------------------------------------------------
  async getClients() {
    try {
      const res = await authFetch(`${API_BASE_URL}/clients`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('API offline: usando clientes locales', e)
      return null
    }
  },

  async createClient(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al guardar cliente en DB:', e)
      return null
    }
  },

  async updateClient(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar cliente en DB:', e)
      return null
    }
  },

  async deleteClient(id) {
    try {
      const res = await authFetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al eliminar cliente en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 8. CITAS & AGENDA
  // ----------------------------------------------------
  async getAppointments(dateStr, role, specialistId) {
    try {
      const params = new URLSearchParams()
      if (dateStr) params.append('date', dateStr)
      if (role) params.append('role', role)
      if (specialistId) params.append('specialistId', specialistId)
      
      const res = await authFetch(`${API_BASE_URL}/appointments?${params.toString()}`)
      if (!res.ok) throw new Error('Error al obtener agenda')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('API offline: usando citas locales', e)
      return null
    }
  },

  async updateAppointmentStatus(id, status) {
    try {
      const res = await authFetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al actualizar estado de cita en DB:', e)
      return null
    }
  },

  async cancelAppointment(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al cancelar cita en DB:', e)
      return null
    }
  },

  async bookAppointment(data) {
    let res
    try {
      res = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(data),
      })
    } catch (networkError) {
      throw new Error('No pudimos conectar con el sistema. Por favor revisa tu conexión a internet y vuelve a intentar.')
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'El horario que elegiste ya fue tomado por otra persona. Por favor selecciona otra hora.')
    }

    return await res.json()
  },

  // ----------------------------------------------------
  // 9. CAJA, SESIONES & TRANSACCIONES
  // ----------------------------------------------------
  async getActiveCashSession() {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/active`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      return null
    }
  },

  async getCashSessions() {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/sessions`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      return null
    }
  },

  async openCashSession(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/open`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al abrir caja en DB:', e)
      return null
    }
  },

  async closeCashSession(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/close`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al cerrar caja en DB:', e)
      return null
    }
  },

  async reconcileCashSession(id, data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/reconcile/${id}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al reconciliar caja en DB:', e)
      return null
    }
  },

  async getCashTransactions() {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/transactions`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      return null
    }
  },

  async createCashTransaction(data) {
    try {
      const res = await authFetch(`${API_BASE_URL}/cash/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Fallo al registrar transacción en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 10. AUTENTICACIÓN
  // ----------------------------------------------------
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass: password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Credenciales inválidas')
    }
    return await res.json()
  },

  // ----------------------------------------------------
  // 11. TELEMETRÍA Y LOGS DEL SISTEMA
  // ----------------------------------------------------
  async getSystemLogs({ level, source, search, page = 1, limit = 25 } = {}) {
    try {
      const params = new URLSearchParams()
      if (level && level !== 'ALL') params.append('level', level)
      if (source && source !== 'ALL') params.append('source', source)
      if (search) params.append('search', search)
      params.append('page', String(page))
      params.append('limit', String(limit))

      const res = await authFetch(`${API_BASE_URL}/system-logs?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar logs del sistema')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('API offline o error al consultar telemetría:', e)
      return { logs: [], total: 0, page: 1, limit, totalPages: 1 }
    }
  },

  async getAllSystemLogs(limit = 1000) {
    try {
      const res = await authFetch(`${API_BASE_URL}/system-logs/all?limit=${limit}`)
      if (!res.ok) throw new Error('Error al obtener todos los logs')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Error al obtener todos los logs:', e)
      return { logs: [], count: 0 }
    }
  },

  async getTelemetryStats() {
    try {
      const res = await authFetch(`${API_BASE_URL}/system-logs/stats`)
      if (!res.ok) throw new Error('Error al obtener estadísticas de telemetría')
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Error al obtener stats:', e)
      return {
        totalCount: 0,
        criticalCount: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        recentErrors24h: 0,
        systemHealth: 'OPTIMO',
        appVersion: 'Versión 2.0',
        gitCommit: 'main-prod',
        timestamp: new Date().toISOString(),
      }
    }
  },

  async verifyTelemetryPin(pin) {
    try {
      const res = await fetch(`${API_BASE_URL}/system-logs/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: String(pin).trim() }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.accessToken) {
        try {
          sessionStorage.setItem('spa_admin_token', data.accessToken)
        } catch (e) {}
      }
      return !!data?.valid
    } catch (e) {
      console.error('Error al validar PIN de telemetría con backend:', e)
      return false
    }
  },

  async createTestLog(data = {}) {
    try {
      const res = await authFetch(`${API_BASE_URL}/system-logs/test-event`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Error al crear log de prueba:', e)
      return null
    }
  },

  async purgeSystemLogs({ days = 30, all = false } = {}) {
    try {
      const params = new URLSearchParams()
      if (all) params.append('all', 'true')
      else params.append('days', String(days))

      const res = await authFetch(`${API_BASE_URL}/system-logs/purge?${params.toString()}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      if (e.message?.includes('401')) throw e
      console.warn('Error al purgar logs:', e)
      return { success: false }
    }
  }
}
