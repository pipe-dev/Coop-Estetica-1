// Cliente de conexión HTTP y sincronización viva con PostgreSQL para Catheryne Ríos Estética
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

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

  async updateConfig(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al actualizar configuración en DB')
      return await res.json()
    } catch (e) {
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
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al crear categoría en DB:', e)
      return null
    }
  },

  async updateCategory(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar categoría en DB:', e)
      return null
    }
  },

  async deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
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
      const res = await fetch(`${API_BASE_URL}/admin/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al crear servicio en DB:', e)
      return null
    }
  },

  async updateService(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar servicio en DB:', e)
      return null
    }
  },

  async deleteService(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
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
      const res = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al crear producto en DB:', e)
      return null
    }
  },

  async updateProduct(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar producto en DB:', e)
      return null
    }
  },

  async deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
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
      const res = await fetch(`${API_BASE_URL}/admin/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al crear especialista en DB:', e)
      return null
    }
  },

  async updateTeamMember(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar especialista en DB:', e)
      return null
    }
  },

  async deleteTeamMember(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/team/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
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

  async updateMembership(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/memberships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar membresía en DB:', e)
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
      const res = await fetch(`${API_BASE_URL}/admin/closed-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al guardar fecha de cierre en DB:', e)
      return null
    }
  },

  async deleteClosedDate(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/closed-dates/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al eliminar fecha de cierre en DB:', e)
      return null
    }
  },

  // ----------------------------------------------------
  // 7. CLIENTES (CRM)
  // ----------------------------------------------------
  async getClients() {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando clientes locales', e)
      return null
    }
  },

  async createClient(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al guardar cliente en DB:', e)
      return null
    }
  },

  async updateClient(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar cliente en DB:', e)
      return null
    }
  },

  async deleteClient(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
      })
      return await res.json()
    } catch (e) {
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
      
      const res = await fetch(`${API_BASE_URL}/appointments?${params.toString()}`)
      if (!res.ok) throw new Error('Error al obtener agenda')
      return await res.json()
    } catch (e) {
      console.warn('API offline: usando citas locales', e)
      return null
    }
  },

  async updateAppointmentStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al actualizar estado de cita en DB:', e)
      return null
    }
  },

  async cancelAppointment(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al cancelar cita en DB:', e)
      return null
    }
  },

  async bookAppointment(data) {
    let res
    try {
      res = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/cash/active`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      return null
    }
  },

  async getCashSessions() {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/sessions`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      return null
    }
  },

  async openCashSession(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al abrir caja en DB:', e)
      return null
    }
  },

  async closeCashSession(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al cerrar caja en DB:', e)
      return null
    }
  },

  async reconcileCashSession(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/reconcile/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
      console.warn('Fallo al reconciliar caja en DB:', e)
      return null
    }
  },

  async getCashTransactions() {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/transactions`)
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      return null
    }
  },

  async createCashTransaction(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/cash/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (e) {
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
  }
}
