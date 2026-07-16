import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PageTransition from './components/layout/PageTransition'
import Home from './pages/Home'
import Services from './pages/Services'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Booking from './pages/Booking'
import GiftCards from './pages/GiftCards'
import Contact from './pages/Contact'

function App() {
  const location = useLocation()

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/servicios" element={<PageTransition><Services /></PageTransition>} />
          <Route path="/equipo" element={<PageTransition><Team /></PageTransition>} />
          <Route path="/galeria" element={<PageTransition><Gallery /></PageTransition>} />
          <Route path="/reservar" element={<PageTransition><Booking /></PageTransition>} />
          <Route path="/gift-cards" element={<PageTransition><GiftCards /></PageTransition>} />
          <Route path="/contacto" element={<PageTransition><Contact /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  )
}

export default App
