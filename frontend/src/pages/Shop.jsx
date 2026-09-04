import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ShoppingBag, Sparkles, MessageCircle } from 'lucide-react'
import { products as defaultProducts, categories } from '../data/products'
import styles from './Shop.module.css'
import LiquidGlassIos26 from '../components/ui/LiquidGlassIos26'
import ProgressiveImage from '../components/ui/ProgressiveImage'
import InteractiveBackground from '../components/ui/InteractiveBackground'
import DetailModal from '../components/ui/DetailModal'
import { useCart } from '../context/CartContext'
import { useAdmin } from '../context/AdminContext'

const getPlaceholderUrl = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  return url.replace('w=600', 'w=20').replace('q=80', 'q=10');
}

function Shop() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [hideUi, setHideUi] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const { addToCart, openCart, totalCount } = useCart()
  const adminCtx = useAdmin()
  const liveProducts = adminCtx?.products && adminCtx.products.length > 0 ? adminCtx.products : defaultProducts

  // Make the entire browser body black for this page
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000000'
    return () => {
      document.body.style.backgroundColor = originalBackground
    }
  }, [])

  // Auto-hide Filter Bar & Navbar on scroll down, re-reveal on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideUi(true)
        window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: true } }))
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setHideUi(false)
        window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.dispatchEvent(new CustomEvent('toggleNavbarModal', { detail: { hide: false } }))
    }
  }, [])

  const filteredProducts = activeCategory === 'all' 
    ? liveProducts 
    : liveProducts.filter(p => p.category === activeCategory)

  return (
    <motion.div 
      className={styles.shopContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <InteractiveBackground />
      <div className={styles.shopOverlay} />

      {/* FLOATING CART BUTTON TRIGGER */}
      <button className={styles.floatingCartTrigger} onClick={openCart} aria-label="Abrir carrito">
        <ShoppingBag size={22} />
        {totalCount > 0 && <span className={styles.cartBadge}>{totalCount}</span>}
      </button>
      
      {/* HORIZONTAL PILL FILTERS - SMART AUTO HIDE */}
      <motion.nav 
        className={styles.filterContainer}
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: hideUi ? 0 : 1, 
          y: hideUi ? -90 : 0 
        }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ pointerEvents: hideUi ? 'none' : 'auto' }}
      >
        <ul className={styles.filterList}>
          <li onClick={() => setActiveCategory('all')}>
            <LiquidGlassIos26 
              scale={0.03}
              baseFrequency={0.1}
              numOctaves={3}
              centerBlur={16}
              bevelBlur={32}
              bevelWidth={16}
              saturate={150}
              brightness={1.5}
              glassTintOpacity={0.3}
              tint="light"
              borderRadius={9999}
              disableContentFilter={true}
              className={`${styles.filterPill} ${activeCategory === 'all' ? styles.active : ''}`}
            >
              {activeCategory === 'all' && <span className={styles.activeDot}>•</span>}
              <span>Todos</span>
            </LiquidGlassIos26>
          </li>
          {categories.map(cat => (
            <li key={cat.id} onClick={() => setActiveCategory(cat.id)}>
              <LiquidGlassIos26 
                scale={0.03}
                baseFrequency={0.1}
                numOctaves={3}
                centerBlur={16}
                bevelBlur={32}
                bevelWidth={16}
                saturate={150}
                brightness={1.5}
                glassTintOpacity={0.3}
                tint="light"
                borderRadius={9999}
                disableContentFilter={true}
                className={`${styles.filterPill} ${activeCategory === cat.id ? styles.active : ''}`}
              >
                {activeCategory === cat.id && <span className={styles.activeDot}>•</span>}
                <span>{cat.name}</span>
              </LiquidGlassIos26>
            </li>
          ))}
        </ul>
      </motion.nav>

      {/* EDITORIAL PRODUCT GRID */}
      <main className={styles.mainContent}>
        {filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: 680,
              margin: '60px auto',
              textAlign: 'center',
              padding: '40px 24px'
            }}
          >
            <LiquidGlassIos26
              tint="dark"
              disableContentFilter={true}
              centerBlur={24}
              contentPadding={32}
              borderRadius={20}
              glassBg="rgba(17, 17, 17, 0.8)"
            >
              <div style={{ color: '#D4AF37', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <Sparkles size={36} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#FEFEFE', marginBottom: 12 }}>
                Boutique en Renovación
              </h3>
              <p style={{ color: '#A3A3A3', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Nuestra selecta línea de cosmética premium, aceites esenciales y kits de cuidado estético para el hogar estará disponible muy pronto en la tienda online.
              </p>
              <a
                href="https://wa.me/573006269056"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: '#0D0D0D',
                  padding: '12px 24px',
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} />
                <span>Consultar Disponibilidad</span>
              </a>
            </LiquidGlassIos26>
          </motion.div>
        ) : (
          <motion.div layout className={styles.productGrid}>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => (
                <motion.article
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: i * 0.1, 
                    ease: [0.25, 0.46, 0.45, 0.94] 
                  }}
                  className={styles.productCardWrapper}
                  onClick={() => setSelectedProduct(product)}
                  style={{ cursor: 'pointer' }}
                >
                  <LiquidGlassIos26 
                    className={styles.productCardGlass} 
                    tint="dark" 
                    disableContentFilter={true}
                    contentPadding={0}
                    centerBlur={24}
                    bevelBlur={32}
                    bevelWidth={16}
                    saturate={120}
                    brightness={0.8}
                    glassBg="rgba(0, 0, 0, 0.7)"
                  >
                    {product.image && (
                      <div className={styles.imageContainer}>
                        <ProgressiveImage 
                          src={product.image}
                          placeholderSrc={getPlaceholderUrl(product.image)}
                          alt={product.name} 
                          className={styles.productImage}
                        />
                      </div>
                    )}
                    
                    <div className={styles.productInfo}>
                      <span className={styles.productBrand}>{product.brand}</span>
                      <h4 className={styles.productName}>{product.name}</h4>
                      <span className={styles.productPrice}>${(product.price || 0).toLocaleString()} COP</span>
                      
                      <button 
                        className={styles.addToCartBtn} 
                        aria-label="Añadir al carrito"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(product)
                        }}
                      >
                        <span className={styles.btnLabel}>Añadir</span>
                        <div className={styles.btnIconWrapper}>
                           <ArrowRight size={16} strokeWidth={1} />
                        </div>
                      </button>
                    </div>
                  </LiquidGlassIos26>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* DETAILED QUICK VIEW MODAL */}
      {selectedProduct && (
        <DetailModal
          item={selectedProduct}
          type="product"
          onClose={() => setSelectedProduct(null)}
          onAction={(prod) => {
            addToCart(prod)
            setSelectedProduct(null)
          }}
        />
      )}
    </motion.div>
  )
}

export default Shop
