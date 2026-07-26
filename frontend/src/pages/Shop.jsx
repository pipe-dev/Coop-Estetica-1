import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { products, categories } from '../data/products'
import styles from './Shop.module.css'
import LiquidGlassIos26 from '../components/ui/LiquidGlassIos26'
import ProgressiveImage from '../components/ui/ProgressiveImage'
import InteractiveBackground from '../components/ui/InteractiveBackground'

const getPlaceholderUrl = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  // Replace w=600 with w=20 and q=80 with q=10 for a tiny payload
  return url.replace('w=600', 'w=20').replace('q=80', 'q=10');
}

function Shop() {
  const [activeCategory, setActiveCategory] = useState('all')

  // Make the entire browser body black for this page
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000000'
    return () => {
      document.body.style.backgroundColor = originalBackground
    }
  }, [])

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory)

  return (
    <motion.div 
      className={styles.shopContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <InteractiveBackground />
      
      {/* HORIZONTAL PILL FILTERS - GLASS DESIGN */}
      <nav className={styles.filterContainer}>
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
              All Products
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
                {cat.name}
              </LiquidGlassIos26>
            </li>
          ))}
        </ul>
      </nav>

      {/* EDITORIAL PRODUCT GRID */}
      <main className={styles.mainContent}>

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
                  <div className={styles.productCard}>
                    <div className={styles.imageContainer}>
                      <ProgressiveImage 
                        src={product.image}
                        placeholderSrc={getPlaceholderUrl(product.image)}
                        alt={product.name} 
                        className={styles.productImage}
                      />
                    </div>
                    
                    <div className={styles.productInfo}>
                      <span className={styles.productBrand}>{product.brand}</span>
                      <h4 className={styles.productName}>{product.name}</h4>
                      <span className={styles.productPrice}>${product.price.toLocaleString()}</span>
                      
                      <button className={styles.addToCartBtn} aria-label="Añadir al carrito">
                        <span className={styles.btnLabel}>Añadir</span>
                        <div className={styles.btnIconWrapper}>
                           <ArrowRight size={16} strokeWidth={1} />
                        </div>
                      </button>
                    </div>
                  </div>
                </LiquidGlassIos26>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>
    </motion.div>
  )
}

export default Shop
