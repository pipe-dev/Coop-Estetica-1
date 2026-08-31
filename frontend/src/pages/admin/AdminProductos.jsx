import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff, Package, DollarSign, CheckCircle2, AlertTriangle, Image as ImageIcon, ShoppingCart, CreditCard, Download } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { formatCOP, formatCOPInput, parseCOPInput } from '../../utils/currencyUtils'
import { exportProductsInventory } from '../../utils/exportUtils'
import ImageUploader from '../../components/admin/ImageUploader'
import styles from './AdminProductos.module.css'

const PRESET_IMAGES = [
  { name: 'Sérum / Elixir', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop' },
  { name: 'Crema Facial', url: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop' },
  { name: 'Exfoliante / Spa', url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop' },
  { name: 'Aceite Corporal', url: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop' },
  { name: 'Kit / Cuidado Uñas', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop' }
]

export default function AdminProductos() {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductAvailability, addTransaction } = useAdmin()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Product Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Sale Modal State
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleProductId, setSaleProductId] = useState('')
  const [saleQty, setSaleQty] = useState(1)
  const [salePaymentMethod, setSalePaymentMethod] = useState('Efectivo')
  const [saleClientName, setSaleClientName] = useState('')

  // Form Fields (Product)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('facial')
  const [brand, setBrand] = useState('ÁUREA LUXURY')
  const [priceInput, setPriceInput] = useState('')
  const [stock, setStock] = useState(10)
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(PRESET_IMAGES[0].url)

  const handleOpenSaleModal = (prod = null) => {
    if (prod) {
      setSaleProductId(prod.id)
    } else if (products.length > 0) {
      setSaleProductId(products[0].id)
    }
    setSaleQty(1)
    setSalePaymentMethod('Efectivo')
    setSaleClientName('')
    setShowSaleModal(true)
  }

  const handleSaleSubmit = (e) => {
    e.preventDefault()
    const targetProduct = products.find(p => p.id === saleProductId)
    if (!targetProduct) return

    const qty = parseInt(saleQty, 10) || 1
    const totalAmount = targetProduct.price * qty

    // 1. Discount stock in product
    const newStock = Math.max(0, (targetProduct.stock || 0) - qty)
    updateProduct(targetProduct.id, {
      stock: newStock,
      status: newStock > 0 ? 'Disponible' : 'Agotado'
    })

    // 2. Log income transaction in caja
    addTransaction({
      id: `tx-prod-${Date.now()}`,
      type: 'Ingreso',
      amount: totalAmount,
      description: `Venta de Producto: ${targetProduct.name} (x${qty})${saleClientName ? ` - Cliente: ${saleClientName}` : ''}`,
      category: 'Venta de Productos',
      paymentMethod: salePaymentMethod,
      date: new Date().toISOString().split('T')[0]
    })

    setShowSaleModal(false)
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setName('')
    setCategory('facial')
    setBrand('ÁUREA LUXURY')
    setPriceInput('')
    setStock(10)
    setDescription('')
    setImage(PRESET_IMAGES[0].url)
    setShowModal(true)
  }

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod)
    setName(prod.name || '')
    setCategory(prod.category || 'facial')
    setBrand(prod.brand || 'ÁUREA LUXURY')
    setPriceInput(formatCOP(prod.price || 0))
    setStock(prod.stock !== undefined ? prod.stock : 10)
    setDescription(prod.description || '')
    setImage(prod.image || PRESET_IMAGES[0].url)
    setShowModal(true)
  }

  const handleSubmitForm = (e) => {
    e.preventDefault()
    const numericPrice = parseCOPInput(priceInput)
    if (!name || !numericPrice) return

    const productPayload = {
      name,
      category,
      brand,
      price: numericPrice,
      stock: parseInt(stock, 10) || 0,
      description,
      image,
      status: parseInt(stock, 10) > 0 ? 'Disponible' : 'Agotado'
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload)
    } else {
      addProduct(productPayload)
    }

    setShowModal(false)
  }

  const handleDelete = (prod) => {
    if (window.confirm(`¿Estás seguro de eliminar "${prod.name}" de la tienda?`)) {
      deleteProduct(prod.id)
    }
  }

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchCat && matchSearch
  })

  // Metrics
  const totalItems = products.length
  const availableItems = products.filter(p => p.status === 'Disponible' && p.stock > 0).length
  const outOfStockItems = products.filter(p => p.status === 'Agotado' || p.stock === 0).length
  const inventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0)

  return (
    <div className={styles.container}>
      
      {/* METRICS HEADER CARDS */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Productos</span>
            <div className={`${styles.iconBadge} ${styles.goldBadge}`}>
              <Package size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{totalItems} <span className={styles.unit}>Ítems</span></div>
          <span className={styles.metricSubtext}>Catálogo activo de la tienda</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Disponibles</span>
            <div className={`${styles.iconBadge} ${styles.greenBadge}`}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{availableItems} <span className={styles.unit}>En Stock</span></div>
          <span className={styles.metricSubtext}>Visibles para compra de clientes</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Agotados</span>
            <div className={`${styles.iconBadge} ${styles.redBadge}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{outOfStockItems} <span className={styles.unit}>Sin Stock</span></div>
          <span className={styles.metricSubtext}>Requieren reabastecimiento</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Valor de Inventario</span>
            <div className={`${styles.iconBadge} ${styles.goldBadge}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>${inventoryValue.toLocaleString()} <span className={styles.unit}>COP</span></div>
          <span className={styles.metricSubtext}>Valor total en almacén</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbarRow}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar producto o línea..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterBox}>
            <Filter size={16} className={styles.filterIcon} />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las Categorías</option>
              <option value="facial">Cuidado Facial</option>
              <option value="corporal">Cuidado Corporal</option>
              <option value="sueros">Sueros & Elixires</option>
              <option value="kits">Kits de Regalo</option>
            </select>
          </div>
        </div>

        <div className={styles.actionBtnsGroup}>
          <button
            type="button"
            className={styles.exportInventoryBtn}
            onClick={() => exportProductsInventory(products)}
            title="Descargar inventario completo en Excel / CSV"
          >
            <Download size={15} />
            <span>Exportar Inventario</span>
          </button>

          <button className={styles.saleActionBtn} onClick={() => handleOpenSaleModal()}>
            <CreditCard size={16} />
            <span>Registrar Venta</span>
          </button>

          <button className={styles.addProductBtn} onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className={styles.productsGrid}>
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={42} className={styles.emptyIcon} />
            <h3>No se encontraron productos</h3>
            <p>Agrega un nuevo producto a la tienda pulsando "Nuevo Producto".</p>
          </div>
        ) : (
          filteredProducts.map(prod => {
            const isAvailable = prod.status === 'Disponible' && prod.stock > 0

            return (
              <div key={prod.id} className={`${styles.productCard} ${!isAvailable ? styles.disabledCard : ''}`}>
                <div className={styles.imageHeader}>
                  <img src={prod.image} alt={prod.name} className={styles.productImg} />
                  
                  <div className={styles.badgeTopLeft}>
                    <span className={styles.categoryBadge}>{prod.category || 'Cosmética'}</span>
                  </div>

                  <div className={styles.badgeTopRight}>
                    {isAvailable ? (
                      <span className={styles.stockBadge}>Stock: {prod.stock} u.</span>
                    ) : (
                      <span className={styles.outOfStockBadge}>AGOTADO</span>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <span className={styles.brandName}>{prod.brand || 'ÁUREA LUXURY'}</span>
                  <h4 className={styles.prodTitle}>{prod.name}</h4>
                  <p className={styles.prodDesc}>{prod.description}</p>
                  
                  <div className={styles.priceRow}>
                    <span className={styles.priceVal}>${prod.price.toLocaleString()} <small>COP</small></span>
                  </div>
                </div>

                <div className={styles.cardFooterActions}>
                  <button 
                    type="button" 
                    className={`${styles.toggleBtn} ${isAvailable ? styles.toggleBtnActive : styles.toggleBtnInactive}`}
                    onClick={() => toggleProductAvailability(prod.id)}
                    title={isAvailable ? 'Desactivar producto' : 'Activar producto'}
                  >
                    {isAvailable ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{isAvailable ? 'Desactivar' : 'Activar'}</span>
                  </button>

                  {isAvailable && (
                    <button
                      type="button"
                      className={styles.sellCardBtn}
                      onClick={() => handleOpenSaleModal(prod)}
                      title="Registrar venta directa de este producto"
                    >
                      <ShoppingCart size={14} />
                      <span>Vender</span>
                    </button>
                  )}

                  <button 
                    type="button" 
                    className={styles.editBtn}
                    onClick={() => handleOpenEditModal(prod)}
                    title="Editar producto"
                  >
                    <Edit2 size={15} />
                    <span>Editar</span>
                  </button>

                  <button 
                    type="button" 
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(prod)}
                    title="Eliminar producto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? 'Editar Producto de Tienda' : 'Agregar Nuevo Producto a Tienda'}</h3>
              <p>Este producto estará visible instantáneamente en la tienda online.</p>
            </div>

            <form onSubmit={handleSubmitForm} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nombre del Producto</label>
                <input
                  type="text"
                  placeholder="Ej. Sérum Facial Ácido Hialurónico & Oro 24K"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRowTwo}>
                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="facial">Cuidado Facial</option>
                    <option value="corporal">Cuidado Corporal</option>
                    <option value="sueros">Sueros & Elixires</option>
                    <option value="kits">Kits de Regalo</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Marca / Línea</label>
                  <input
                    type="text"
                    placeholder="Ej. ÁUREA LUXURY"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRowTwo}>
                <div className={styles.formGroup}>
                  <label>Precio ($ COP)</label>
                  <input
                    type="text"
                    placeholder="Ej. 145.000"
                    value={priceInput}
                    onChange={e => setPriceInput(formatCOPInput(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock (Unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción del Producto</label>
                <textarea
                  rows="3"
                  placeholder="Describe los beneficios y forma de uso..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <ImageUploader 
                  value={image} 
                  onChange={setImage} 
                  label="Foto del Producto (Subir a CDN ImgBB)" 
                />
              </div>

              <div className={styles.formGroup}>
                <label>O elegir una imagen predefinida</label>
                <div className={styles.presetsGrid}>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <div 
                      key={idx} 
                      className={`${styles.presetItem} ${image === preset.url ? styles.activePreset : ''}`}
                      onClick={() => setImage(preset.url)}
                    >
                      <img src={preset.url} alt={preset.name} />
                      <span>{preset.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER PRODUCT SALE MODAL */}
      {showSaleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaleModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>💳 Registrar Venta de Producto</h3>
              <p>Registra un ingreso en caja y descuenta automáticamente el stock del inventario.</p>
            </div>

            <form onSubmit={handleSaleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Seleccionar Producto</label>
                <select
                  value={saleProductId}
                  onChange={e => setSaleProductId(e.target.value)}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — ${p.price.toLocaleString()} COP ({p.stock > 0 ? `Stock: ${p.stock}` : 'AGOTADO'})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRowTwo}>
                <div className={styles.formGroup}>
                  <label>Cantidad a Vender</label>
                  <input
                    type="number"
                    min="1"
                    max={products.find(p => p.id === saleProductId)?.stock || 100}
                    value={saleQty}
                    onChange={e => setSaleQty(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Método de Pago</label>
                  <select
                    value={salePaymentMethod}
                    onChange={e => setSalePaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia Nequi/Bancolombia">Transferencia Nequi/Bancolombia</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Nombre de la Clienta (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. María Fernanda"
                  value={saleClientName}
                  onChange={e => setSaleClientName(e.target.value)}
                />
              </div>

              {/* TOTAL COP DISPLAY */}
              {(() => {
                const targetP = products.find(p => p.id === saleProductId)
                const unitPrice = targetP ? targetP.price : 0
                const calculatedTotal = unitPrice * (parseInt(saleQty, 10) || 1)

                return (
                  <div className={styles.totalDisplayRow}>
                    <span className={styles.totalLabel}>Total Venta Directa:</span>
                    <span className={styles.totalAmount}>${calculatedTotal.toLocaleString()} COP</span>
                  </div>
                )
              })()}

              <div className={styles.modalBtnGroup}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowSaleModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Confirmar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
