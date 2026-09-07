import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PageTransition from './components/layout/PageTransition'
import ScrollToTop from './components/layout/ScrollToTop'
import Home from './pages/Home' // Home se mantiene síncrono para renderizado inmediato
import AdManager from './components/ui/AdManager'
import CartDrawer from './components/ui/CartDrawer'
import { initGlobalErrorTelemetry } from './services/telemetry'

// Lazy Loading de páginas secundarias para aligerar en un 70% el bundle inicial en gama baja
const Shop = lazy(() => import('./pages/Shop'))
const Services = lazy(() => import('./pages/Services'))
const About = lazy(() => import('./pages/About'))
const Booking = lazy(() => import('./pages/Booking'))
const GiftCards = lazy(() => import('./pages/GiftCards'))
const Contact = lazy(() => import('./pages/Contact'))

// Lazy Loading de la Suite de Administración (evita cargar código administrativo en el cliente público)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminAgenda = lazy(() => import('./pages/admin/AdminAgenda'))
const AdminCaja = lazy(() => import('./pages/admin/AdminCaja'))
const AdminEquipo = lazy(() => import('./pages/admin/AdminEquipo'))
const AdminServicios = lazy(() => import('./pages/admin/AdminServicios'))
const AdminNotificaciones = lazy(() => import('./pages/admin/AdminNotificaciones'))
const AdminHistorial = lazy(() => import('./pages/admin/AdminHistorial'))
const AdminClientes = lazy(() => import('./pages/admin/AdminClientes'))
const AdminProductos = lazy(() => import('./pages/admin/AdminProductos'))
const AdminConfiguracion = lazy(() => import('./pages/admin/AdminConfiguracion'))
const AdminTelemetria = lazy(() => import('./pages/admin/AdminTelemetria'))

// Inicializar telemetría global de runtime en cliente
initGlobalErrorTelemetry()

const RouteFallback = () => (
  <div style={{ minHeight: '80vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '32px', height: '32px', border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

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
    <>
      <ScrollToTop />
      {showNavbar && <Navbar />}
      <Suspense fallback={<RouteFallback />}>
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
              <Route path="configuracion" element={<AdminConfiguracion />} />
              <Route path="telemetria" element={<AdminTelemetria />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
      {!isPatrocinador && !isBooking && !isAdmin && <Footer />}
      {!isPatrocinador && !isBooking && !isAdmin && <AdManager />}
      {!isAdmin && <CartDrawer />}
    </>
  )
}

export default App
