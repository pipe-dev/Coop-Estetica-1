import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Calendar, 
  Wallet, 
  Users, 
  Scissors, 
  Bell, 
  ArrowLeft, 
  History, 
  UserCheck, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Crown,
  Menu,
  X,
  ChevronRight,
  Terminal
} from 'lucide-react'
import AdminSecurityGate from './AdminSecurityGate'
import AdminAiCopilot from './AdminAiCopilot'
import { useAdmin } from '../../context/AdminContext'
import styles from './AdminLayout.module.css'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/agenda', label: 'Agenda', icon: Calendar },
  { path: '/admin/caja', label: 'Caja', icon: Wallet },
  { path: '/admin/historial', label: 'Historial', icon: History },
  { path: '/admin/clientes', label: 'Clientas', fullLabel: 'Directorio & Ficha', icon: UserCheck },
  { path: '/admin/equipo', label: 'Equipo', fullLabel: 'Equipo & Nómina', icon: Users },
  { path: '/admin/servicios', label: 'Servicios', fullLabel: 'Catálogo de Servicios', icon: Scissors },
  { path: '/admin/productos', label: 'Productos', fullLabel: 'Inventario & Tienda', icon: ShoppingBag },
  { path: '/admin/notificaciones', label: 'Anuncios', fullLabel: 'Gestión de Anuncios', icon: Bell },
  { path: '/admin/configuracion', label: 'Configuración', fullLabel: 'Configuración General', icon: Settings },
  { path: '/admin/telemetria', label: 'Telemetría', fullLabel: 'Telemetría & Logs', icon: Terminal, ownerOnly: true }
]

const getTitleForRoute = (pathname) => {
  if (pathname === '/admin/agenda') return 'Agenda & Calendario'
  if (pathname === '/admin/caja') return 'Flujo de Caja & Finanzas'
  if (pathname === '/admin/historial') return 'Historial & Auditoría'
  if (pathname === '/admin/clientes') return 'Directorio de Clientas'
  if (pathname === '/admin/equipo') return 'Equipo & Nómina'
  if (pathname === '/admin/servicios') return 'Catálogo de Servicios'
  if (pathname === '/admin/productos') return 'Inventario & Tienda'
  if (pathname === '/admin/notificaciones') return 'Gestión de Anuncios'
  if (pathname === '/admin/configuracion') return 'Configuración General'
  if (pathname === '/admin/telemetria') return 'Telemetría & Logs del Sistema'
  return 'Dashboard General'
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const mainContentRef = useRef(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const { activeCashSession, currentUserRole } = useAdmin()

  // Reset scroll to top on route change & close mobile more sheet
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      mainContentRef.current.scrollTop = 0
    }
    setIsMoreOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('spa_admin_authed')
      sessionStorage.removeItem('spa_admin_role')
      sessionStorage.removeItem('spa_admin_token')
      localStorage.removeItem('spa_admin_token')
    } catch (e) {}
    window.location.reload()
  }

  // Filtrado estricto de navegación según el rol autenticado
  const visibleNavItems = navItems.filter(item => {
    if (currentUserRole === 'SPECIALIST') {
      return item.path === '/admin/agenda' || item.path === '/admin/servicios' || item.path === '/admin/historial'
    }
    if (currentUserRole === 'ADMIN') {
      return item.path !== '/admin/configuracion' && item.path !== '/admin/telemetria'
    }
    return true
  })

  // Para Especialistas mostramos sus rutas directas; para Dueña/Admin usamos 4 principales + Más
  const isSpecialist = currentUserRole === 'SPECIALIST'
  
  const primaryMobilePaths = isSpecialist 
    ? ['/admin/agenda', '/admin/servicios', '/admin/historial']
    : ['/admin', '/admin/agenda', '/admin/caja', '/admin/clientes']

  const primaryMobileItems = visibleNavItems.filter(item => primaryMobilePaths.includes(item.path))
  const moreMobileItems = visibleNavItems.filter(item => !primaryMobilePaths.includes(item.path))

  const isCurrentInMore = moreMobileItems.some(item => 
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  const currentTitle = getTitleForRoute(location.pathname)
  const todayFormatted = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <AdminSecurityGate>
      <div className={styles.adminWrapper}>
      
      {/* TOP HEADER */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button 
            type="button" 
            className={styles.backBtn} 
            onClick={() => navigate(-1)} 
            aria-label="Volver atrás"
          >
            <ArrowLeft size={16} />
            <span className={styles.backLabel}>Volver</span>
          </button>
          
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.routeTitle}>{currentTitle}</h1>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* BADGE DE ROL AUTENTICADO */}
          {currentUserRole === 'OWNER' && (
            <div className={styles.roleHeaderBadgeOwner}>
              <Crown size={13} />
              <span>CEO</span>
            </div>
          )}
          {currentUserRole === 'ADMIN' && (
            <div className={styles.roleHeaderBadgeAdmin}>
              <UserCheck size={13} />
              <span>Administradora</span>
            </div>
          )}
          {currentUserRole === 'SPECIALIST' && (
            <div className={styles.roleHeaderBadgeSpecialist}>
              <Scissors size={13} />
              <span>Especialista</span>
            </div>
          )}

          <div className={styles.dateBadge}>
            <Calendar size={15} />
            <span>{todayFormatted}</span>
          </div>
          
          {currentUserRole !== 'SPECIALIST' && (
            activeCashSession ? (
              <div className={styles.cashBoxPill}>
                <span className={styles.greenDot} />
                <span>Caja Abierta: <strong>{activeCashSession.responsibleName}</strong></span>
              </div>
            ) : (
              <div className={`${styles.cashBoxPill} ${styles.closedCashPill}`}>
                <span className={styles.redDot} />
                <span>Caja Cerrada</span>
              </div>
            )
          )}

          <button 
            type="button" 
            className={styles.logoutHeaderBtn} 
            onClick={handleLogout}
            title="Cambiar de clave o salir"
          >
            <LogOut size={14} />
            <span className={styles.logoutLabel}>Salir</span>
          </button>
        </div>
      </header>

      <div className={styles.adminBody}>
        {/* DESKTOP SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandSubtitle}>PORTAL ADMINISTRATIVO</span>
            <span className={styles.brandTitle}>Catheryne Ríos</span>
          </div>

          <nav className={styles.sidebarNav}>
            {visibleNavItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.linkActive : ''}`}
              >
                <item.icon size={18} />
                <span>{item.fullLabel || item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN PAGE CONTENT */}
        <main ref={mainContentRef} className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (4 accesos rápidos + Más) */}
      <nav className={styles.mobileBottomNav}>
        {primaryMobileItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles.mobileActive : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {!isSpecialist && moreMobileItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMoreOpen(prev => !prev)}
            className={`${styles.mobileNavItem} ${styles.moreNavBtn} ${isMoreOpen || isCurrentInMore ? styles.mobileActive : ''}`}
            aria-label="Más opciones del sistema"
          >
            <Menu size={20} />
            <span>Más</span>
          </button>
        )}
      </nav>

      {/* MOBILE BOTTOM SHEET DRAWER ("Más Opciones") */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.moreSheetBackdrop}
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className={styles.moreSheetDrawer}
            >
              <div className={styles.moreSheetHandle} />
              <div className={styles.moreSheetHeader}>
                <div className={styles.moreSheetTitleGroup}>
                  <h3 className={styles.moreSheetTitle}>Más Funciones</h3>
                  <p className={styles.moreSheetSubtitle}>Panel Administrativo Catheryne Ríos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className={styles.moreSheetCloseBtn}
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.moreSheetGrid}>
                {moreMobileItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setIsMoreOpen(false)}
                    className={({ isActive }) => `${styles.moreSheetCard} ${isActive ? styles.moreSheetCardActive : ''}`}
                  >
                    <div className={styles.moreSheetIconWrapper}>
                      <item.icon size={22} />
                    </div>
                    <div className={styles.moreSheetInfo}>
                      <span className={styles.moreSheetLabel}>{item.fullLabel || item.label}</span>
                    </div>
                    <ChevronRight size={16} className={styles.moreSheetArrow} />
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* S.H.I.E.L.D. Copiloto Ejecutivo Inteligente con Llama 3 (Solo para Dueña / Owner) */}
      {currentUserRole === 'OWNER' && <AdminAiCopilot />}
    </div>
  </AdminSecurityGate>
  )
}
