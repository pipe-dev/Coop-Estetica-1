import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scissors, 
  Plus, 
  Clock, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight, 
  Edit2, 
  Trash2, 
  FolderPlus, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput } from '../../utils/currencyUtils'
import ImageUploader from '../../components/admin/ImageUploader'
import styles from './AdminServicios.module.css'

export default function AdminServicios() {
  const { 
    serviceCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    addService, 
    updateService, 
    deleteService, 
    toggleServiceActive 
  } = useAdmin()

  const [activeTab, setActiveTab] = useState('servicios') // 'servicios' | 'categorias'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [serviceCategoryId, setServiceCategoryId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState(60)
  const [serviceDescription, setServiceDescription] = useState('')
  const [serviceIncludes, setServiceIncludes] = useState('')
  const [serviceImage, setServiceImage] = useState('')

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDesc, setCategoryDesc] = useState('')
  const [categoryImage, setCategoryImage] = useState('')

  // ----------------------------------------------------
  // SERVICE MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenAddService = () => {
    setEditingService(null)
    setServiceCategoryId(serviceCategories[0]?.id || '')
    setServiceName('')
    setServicePrice('')
    setServiceDuration(60)
    setServiceDescription('')
    setServiceIncludes('')
    setServiceImage('')
    setShowServiceModal(true)
  }

  const handleOpenEditService = (service, categoryId) => {
    setEditingService(service)
    setServiceCategoryId(categoryId || serviceCategories[0]?.id || '')
    setServiceName(service.name || '')
    setServicePrice(formatCOPInput(service.price || ''))
    setServiceDuration(parseInt(service.duration, 10) || 60)
    setServiceDescription(service.description || '')
    setServiceIncludes(service.includes || '')
    setServiceImage(service.image || '')
    setShowServiceModal(true)
  }

  const handleServiceSubmit = (e) => {
    e.preventDefault()
    const numericPrice = parseCOPInput(servicePrice)
    if (!serviceName || !numericPrice || !serviceCategoryId) return

    const durationText = typeof serviceDuration === 'string' && serviceDuration.includes('min')
      ? serviceDuration
      : `${serviceDuration} min`

    const payload = {
      name: serviceName,
      price: numericPrice,
      duration: durationText,
      description: serviceDescription,
      includes: serviceIncludes,
      image: serviceImage
    }

    if (editingService) {
      updateService(editingService.id, payload)
    } else {
      addService(serviceCategoryId, payload)
    }

    setShowServiceModal(false)
  }

  // ----------------------------------------------------
  // CATEGORY MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDesc('')
    setCategoryImage('/images/service_nails.png')
    setShowCategoryModal(true)
  }

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryName(cat.name || '')
    setCategoryDesc(cat.description || '')
    setCategoryImage(cat.image || '')
    setShowCategoryModal(true)
  }

  const handleCategorySubmit = (e) => {
    e.preventDefault()
    if (!categoryName) return

    const payload = {
      name: categoryName,
      description: categoryDesc,
      image: categoryImage || '/images/service_nails.png'
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, payload)
    } else {
      addCategory(payload)
    }

    setShowCategoryModal(false)
  }

  // Flatten and filter services
  const displayedServices = serviceCategories
    .filter(cat => selectedCategoryFilter === 'all' || cat.id === selectedCategoryFilter)
    .flatMap(cat => (cat.services || []).map(s => ({ ...s, categoryId: cat.id, categoryName: cat.name })))

  return (
    <div className={styles.serviciosContainer}>
      
      {/* TOP HEADER */}
      <div className={styles.topRow}>
        <div>
          <h2>Gestión de Servicios & Categorías</h2>
          <p className={styles.subtext}>
            Control total del catálogo de tratamientos, descripciones, duraciones y tarifas oficiales en pesos colombianos.
          </p>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.addCategoryBtn} onClick={handleOpenAddCategory}>
            <FolderPlus size={16} />
            <span>Nueva Categoría</span>
          </button>

          <button className={styles.addBtn} onClick={handleOpenAddService}>
            <Plus size={16} />
            <span>Agregar Servicio</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className={styles.tabsRow}>
        <div className={styles.tabButtons}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'servicios' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('servicios')}
          >
            <Scissors size={15} />
            <span>Tratamientos ({displayedServices.length})</span>
          </button>

          <button 
            className={`${styles.tabBtn} ${activeTab === 'categorias' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('categorias')}
          >
            <Layers size={15} />
            <span>Categorías ({serviceCategories.length})</span>
          </button>
        </div>

        {activeTab === 'servicios' && (
          <div className={styles.filterGroup}>
            <label>Filtrar por Categoría:</label>
            <select 
              value={selectedCategoryFilter} 
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Todas las Categorías</option>
              {serviceCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: SERVICIOS GRID */}
      {activeTab === 'servicios' && (
        <div className={styles.servicesGrid}>
          {displayedServices.map(s => (
            <div key={s.id} className={`${styles.serviceCard} ${s.active === false ? styles.cardInactive : ''}`}>
              <div className={styles.cardHeader}>
                <span className={styles.categoryBadge}>{s.categoryName || 'Tratamiento'}</span>
                
                <div className={styles.cardHeaderActions}>
                  <button
                    className={styles.editCardBtn}
                    onClick={() => handleOpenEditService(s, s.categoryId)}
                    title="Editar tratamiento"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    className={styles.deleteCardBtn}
                    onClick={() => {
                      if (window.confirm(`¿Deseas eliminar el servicio "${s.name}"?`)) {
                        deleteService(s.id)
                      }
                    }}
                    title="Eliminar tratamiento"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    className={styles.toggleBtn}
                    onClick={() => toggleServiceActive(s.id)}
                    title={s.active !== false ? 'Desactivar servicio' : 'Activar servicio'}
                  >
                    {s.active !== false ? (
                      <ToggleRight size={24} className={styles.toggleActiveIcon} />
                    ) : (
                      <ToggleLeft size={24} className={styles.toggleInactiveIcon} />
                    )}
                  </button>
                </div>
              </div>

              <h4 className={styles.serviceName}>{s.name}</h4>
              <p className={styles.serviceDesc}>{s.description || 'Sin descripción detallada.'}</p>

              {s.includes && (
                <div className={styles.includesBox}>
                  <small><strong>Incluye:</strong> {s.includes}</small>
                </div>
              )}

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <Clock size={14} />
                  <span>{s.duration}</span>
                </div>
                <span className={styles.priceTag}>${(s.price || 0).toLocaleString()} COP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CATEGORÍAS GRID */}
      {activeTab === 'categorias' && (
        <div className={styles.categoriesGrid}>
          {serviceCategories.map(cat => (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.categoryImgWrapper}>
                <img src={cat.image || '/images/service_nails.png'} alt={cat.name} className={styles.categoryImg} />
                <div className={styles.categoryOverlay}>
                  <h4 className={styles.categoryCardName}>{cat.name}</h4>
                  <span className={styles.countBadge}>{(cat.services || []).length} servicios</span>
                </div>
              </div>

              <div className={styles.categoryCardBody}>
                <p className={styles.categoryDescText}>{cat.description || 'Sin descripción asignada.'}</p>
                
                <div className={styles.categoryCardFooter}>
                  <button 
                    className={styles.categoryActionBtn}
                    onClick={() => handleOpenEditCategory(cat)}
                  >
                    <Edit2 size={14} />
                    <span>Editar</span>
                  </button>

                  <button 
                    className={`${styles.categoryActionBtn} ${styles.btnDanger}`}
                    onClick={() => {
                      if (window.confirm(`¿Deseas eliminar la categoría "${cat.name}" y todos sus servicios asociados?`)) {
                        deleteCategory(cat.id)
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AGREGAR / EDITAR SERVICIO */}
      <AnimatePresence>
        {showServiceModal && (
          <div className={styles.modalOverlay} onClick={() => setShowServiceModal(false)}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>{editingService ? 'Editar Tratamiento' : 'Agregar Nuevo Tratamiento'}</h3>
              
              <form onSubmit={handleServiceSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Nombre del Servicio</label>
                  <input
                    type="text"
                    placeholder="Ej. Manicura Rusa VIP con Nivelación"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Categoría</label>
                    <select 
                      value={serviceCategoryId} 
                      onChange={e => setServiceCategoryId(e.target.value)}
                      required
                    >
                      {serviceCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Duración Estimada (minutos)</label>
                    <input
                      type="number"
                      placeholder="60"
                      value={serviceDuration}
                      onChange={e => setServiceDuration(e.target.value)}
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Precio Oficial ($ COP)</label>
                  <input
                    type="text"
                    placeholder="Ej. 120.000"
                    value={servicePrice}
                    onChange={e => setServicePrice(formatCOPInput(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción del Tratamiento</label>
                  <textarea
                    rows={3}
                    placeholder="Detalles sobre la técnica, beneficios y experiencia..."
                    value={serviceDescription}
                    onChange={e => setServiceDescription(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>¿Qué Incluye el Servicio? (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Exfoliación, hidratación profunda y masaje..."
                    value={serviceIncludes}
                    onChange={e => setServiceIncludes(e.target.value)}
                  />
                </div>

                <ImageUploader 
                  value={serviceImage} 
                  onChange={setServiceImage} 
                  label="Foto del Tratamiento (Subir a CDN ImgBB)" 
                />

                <div className={styles.modalButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowServiceModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.saveBtn}>
                    {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AGREGAR / EDITAR CATEGORÍA */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
            <motion.div 
              className={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Servicios'}</h3>
              
              <form onSubmit={handleCategorySubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Nombre de la Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej. Mirada & Pestañas"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción Corta</label>
                  <textarea
                    rows={2}
                    placeholder="Breve descripción del área de cuidado..."
                    value={categoryDesc}
                    onChange={e => setCategoryDesc(e.target.value)}
                  />
                </div>

                <ImageUploader 
                  value={categoryImage} 
                  onChange={setCategoryImage} 
                  label="Foto de Portada de la Categoría (Subir a CDN ImgBB)" 
                />

                <div className={styles.modalButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowCategoryModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.saveBtn}>
                    {editingCategory ? 'Guardar Categoría' : 'Crear Categoría'}
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
