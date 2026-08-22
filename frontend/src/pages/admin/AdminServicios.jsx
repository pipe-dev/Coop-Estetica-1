import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Plus, Clock, DollarSign, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOPInput, parseCOPInput } from '../../utils/currencyUtils'
import styles from './AdminServicios.module.css'

export default function AdminServicios() {
  const { servicesList, addService, updateService } = useAdmin()

  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('unas')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState(60)

  const handleToggleActive = (service) => {
    updateService(service.id, { active: !service.active })
  }

  const openAddModal = () => {
    setEditingService(null)
    setName('')
    setCategory('unas')
    setPrice('')
    setDuration(60)
    setShowModal(true)
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setName(service.name || '')
    setCategory(service.category || 'unas')
    setPrice(formatCOPInput(service.price || ''))
    setDuration(service.duration || 60)
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const numericPrice = parseCOPInput(price)
    if (!name || !numericPrice) return

    const payload = {
      name,
      category,
      price: numericPrice,
      duration: parseInt(duration, 10) || 60
    }

    if (editingService) {
      updateService(editingService.id, payload)
    } else {
      addService({
        id: `service-${Date.now()}`,
        ...payload,
        active: true
      })
    }

    setShowModal(false)
  }

  return (
    <div className={styles.serviciosContainer}>
      
      {/* TOP HEADER */}
      <div className={styles.topRow}>
        <div>
          <h3>Catálogo & Precios de Servicios</h3>
          <p className={styles.subtext}>Administra los tratamientos ofrecidos, sus precios ($ COP) y tiempo estimado.</p>
        </div>

        <button className={styles.addBtn} onClick={openAddModal}>
          <Plus size={16} />
          <span>Agregar Servicio</span>
        </button>
      </div>

      {/* SERVICES GRID */}
      <div className={styles.servicesGrid}>
        {servicesList.map(s => (
          <div key={s.id} className={`${styles.serviceCard} ${!s.active ? styles.cardInactive : ''}`}>
            <div className={styles.cardHeader}>
              <span className={styles.categoryBadge}>{s.category.toUpperCase()}</span>
              <div className={styles.cardHeaderActions}>
                <button
                  className={styles.editCardBtn}
                  onClick={() => openEditModal(s)}
                  title="Editar servicio"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className={styles.toggleBtn}
                  onClick={() => handleToggleActive(s)}
                  aria-label="Activar/Desactivar"
                >
                  {s.active ? (
                    <ToggleRight size={24} className={styles.toggleActiveIcon} />
                  ) : (
                    <ToggleLeft size={24} className={styles.toggleInactiveIcon} />
                  )}
                </button>
              </div>
            </div>

            <h4 className={styles.serviceName}>{s.name}</h4>

            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <Clock size={14} />
                <span>{s.duration} min</span>
              </div>
              <span className={styles.priceTag}>${s.price.toLocaleString()} COP</span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>{editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</h3>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre del Servicio</label>
                <input
                  type="text"
                  placeholder="Ej. Peinado & Brushing de Gala"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="unas">Uñas</option>
                    <option value="cabello">Cabello</option>
                    <option value="rostro">Faciales & Rostro</option>
                    <option value="maquillaje">Maquillaje</option>
                    <option value="cuerpo">Corporales & Masajes</option>
                    <option value="spa">Experiencia Spa</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Duración (Minutos)</label>
                  <input
                    type="number"
                    placeholder="Ej. 60"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Precio ($ COP)</label>
                <input
                  type="text"
                  placeholder="Ej. 150.000"
                  value={price}
                  onChange={e => setPrice(formatCOPInput(e.target.value))}
                  required
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {editingService ? 'Guardar Cambios' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
