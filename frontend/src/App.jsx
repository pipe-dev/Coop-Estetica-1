import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PageTransition from './components/layout/PageTransition'
import ScrollToTop from './components/layout/ScrollToTop'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Booking from './pages/Booking'
import GiftCards from './pages/GiftCards'
import Contact from './pages/Contact'
import Shop from './pages/Shop'
import AdManager from './components/ui/AdManager'
import CartDrawer from './components/ui/CartDrawer'

import { AdminProvider } from './context/AdminContext'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAgenda from './pages/admin/AdminAgenda'
import AdminCaja from './pages/admin/AdminCaja'
import AdminEquipo from './pages/admin/AdminEquipo'
import AdminServicios from './pages/admin/AdminServicios'
import AdminNotificaciones from './pages/admin/AdminNotificaciones'

import AdminHistorial from './pages/admin/AdminHistorial'
import AdminClientes from './pages/admin/AdminClientes'
import AdminProductos from './pages/admin/AdminProductos'

function App() {
  const location = useLocation()
  const isPatrocinador = location.pathname === '/patrocinador'
  const isBooking = location.pathname === '/reservar'
  const isAdmin = location.pathname.startsWith('/admin')
  const [showDelayedNav, setShowDelayedNav] = useState(false)

  useEffect(() => {
    if (location.pathname === '/' || isAdmin) {
      document.body.style.backgroundColor = 'var(--color-black)'
    } else if (location.pathname === '/patrocinador') {
      document.body.style.backgroundColor = '#070D1E'
    } else {
      document.body.style.backgroundColor = 'var(--color-cream)'
    }
  }, [location.pathname, isAdmin])

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

  const showNavbar = (!isPatrocinador || showDelayedNav) && !isAdmin

  return (
    <AdminProvider>
      <ScrollToTop />
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

          {/* ADMIN SUITE ROUTES */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="caja" element={<AdminCaja />} />
            <Route path="historial" element={<AdminHistorial />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="equipo" element={<AdminEquipo />} />
            <Route path="servicios" element={<AdminServicios />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="notificaciones" element={<AdminNotificaciones />} />
          </Route>
        </Routes>
      </AnimatePresence>
      {!isPatrocinador && !isBooking && !isAdmin && <Footer />}
      {!isPatrocinador && !isBooking && !isAdmin && <AdManager />}
      {!isAdmin && <CartDrawer />}
    </AdminProvider>
  )
}

export default App
