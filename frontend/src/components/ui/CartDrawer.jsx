import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { useCart } from '../../context/CartContext'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalCount,
    totalAmount,
    toastMessage
  } = useCart()

  const freeShippingThreshold = 250000
  const shippingProgress = Math.min(100, (totalAmount / freeShippingThreshold) * 100)
  const remainingForFreeShipping = freeShippingThreshold - totalAmount

  const handleCheckoutWhatsApp = () => {
    if (cartItems.length === 0) return

    const sponsorPhone = '573006269056'
    const itemsList = cartItems
      .map((item, index) => `${index + 1}. *${item.name}* (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}`)
      .join('\n')

    const messageLines = [
      '🛍️ *NUEVO PEDIDO DE PRODUCTOS - TIENDA ONLINE* 🛍️',
      '════════════════════════════',
      '',
      '*PRODUCTOS EN EL CARRITO:*',
      itemsList,
      '',
      '════════════════════════════',
      `*TOTAL:* $${totalAmount.toLocaleString()} COP`,
      shippingProgress >= 100 ? '🚚 *Envío:* ¡GRATUITO!' : '🚚 *Envío:* A convenir',
      '',
      '✦ _Enviado desde la tienda de Catheryne Ríos Estética_'
    ].join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${sponsorPhone}&text=${encodeURIComponent(messageLines)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={styles.toastContainer}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle2 size={18} className={styles.toastIcon} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER BACKDROP & SLIDE-OVER */}
      <AnimatePresence>
        {isCartOpen && (
          <div className={styles.drawerOverlay} onClick={closeCart}>
            <motion.aside
              className={styles.drawerCard}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* DRAWER HEADER */}
              <div className={styles.drawerHeader}>
                <div className={styles.headerTitleGroup}>
                  <ShoppingBag size={20} className={styles.goldIcon} />
                  <h3>Tu Carrito</h3>
                  <span className={styles.itemCountBadge}>{totalCount}</span>
                </div>
                <button className={styles.closeBtn} onClick={closeCart} aria-label="Cerrar carrito">
                  <X size={20} />
                </button>
              </div>

              {/* FREE SHIPPING PROGRESS BAR */}
              <div className={styles.shippingBox}>
                <div className={styles.shippingText}>
                  {shippingProgress >= 100 ? (
                    <span className={styles.freeShippingSuccess}>¡Felicidades! Tienes **Envío GRATIS**</span>
                  ) : (
                    <span>Te faltan **${remainingForFreeShipping.toLocaleString()}** para **Envío GRATIS**</span>
                  )}
                </div>
                <div className={styles.progressBarTrack}>
                  <motion.div
                    className={styles.progressBarFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* ITEMS LIST */}
              <div className={styles.itemsList}>
                {cartItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <ShoppingBag size={48} className={styles.emptyIcon} />
                    <h4>Tu carrito está vacío</h4>
                    <p>Explora nuestra tienda y añade tus cosméticos y productos favoritos.</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <img src={item.image} alt={item.name} className={styles.itemImage} />
                      
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemPrice}>${item.price.toLocaleString()}</span>
                        
                        <div className={styles.quantityRow}>
                          <div className={styles.quantityControls}>
                            <button onClick={() => updateQuantity(item.id, -1)} aria-label="Reducir">
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} aria-label="Aumentar">
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            className={styles.removeBtn}
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Eliminar producto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* DRAWER FOOTER */}
              {cartItems.length > 0 && (
                <div className={styles.drawerFooter}>
                  <div className={styles.subtotalRow}>
                    <span>Subtotal</span>
                    <span className={styles.totalPrice}>${totalAmount.toLocaleString()} COP</span>
                  </div>

                  <button className={styles.checkoutBtn} onClick={handleCheckoutWhatsApp}>
                    <FaWhatsapp size={18} />
                    <span>Finalizar Pedido por WhatsApp</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
