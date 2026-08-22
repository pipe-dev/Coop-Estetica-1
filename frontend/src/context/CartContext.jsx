import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('spa_cart_items')
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    }
    return []
  })

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem('spa_cart_items', JSON.stringify(cartItems))
    } catch (e) {
      console.error('Error saving cart:', e)
    }
  }, [cartItems])

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        }
        return updated
      } else {
        return [...prevItems, { ...product, quantity }]
      }
    })

    showToast(`¡"${product.name}" añadido al carrito!`)
  }

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, delta) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : item
        }
        return item
      })
    })
  }

  const clearCart = () => {
    setCartItems([])
  }

  const toggleCart = () => setIsCartOpen(prev => !prev)
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        toastMessage,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        totalCount,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
