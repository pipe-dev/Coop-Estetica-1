import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PageTransition from './components/layout/PageTransition'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Booking from './pages/Booking'
import GiftCards from './pages/GiftCards'
import Contact from './pages/Contact'
import Shop from './pages/Shop'
import AdManager from './components/ui/AdManager'

function App() {
  const location = useLocation()
  const isPatrocinador = location.pathname === '/patrocinador'
  const [showDelayedNav, setShowDelayedNav] = useState(false)

  useEffect(() => {
    if (location.pathname === '/') {
      document.body.style.backgroundColor = 'var(--color-black)'
    } else if (location.pathname === '/patrocinador') {
      document.body.style.backgroundColor = '#070D1E'
    } else {
      document.body.style.backgroundColor = 'var(--color-cream)'
    }
  }, [location.pathname])

  // Show navbar 5s after loading finishes (~3s load + 5s delay = 8s total)
  useEffect(() => {
    if (isPatrocinador) {
      setShowDelayedNav(false)
      const timer = setTimeout(() => setShowDelayedNav(true), 8000)
      return () => clearTimeout(timer)
    } else {
      setShowDelayedNav(false)
    }
  }, [isPatrocinador])

  const showNavbar = !isPatrocinador || showDelayedNav

  return (
    <>
      {showNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/tienda" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/servicios" element={<PageTransition><Services /></PageTransition>} />
          <Route path="/nosotros" element={<PageTransition><About /></PageTransition>} />
          <Route path="/reservar" element={<PageTransition><Booking /></PageTransition>} />
          <Route path="/gift-cards" element={<PageTransition><GiftCards /></PageTransition>} />
          <Route path="/patrocinador" element={<PageTransition><Contact /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {!isPatrocinador && <Footer />}
      {!isPatrocinador && <AdManager />}
    </>
  )
}

export default App
