import React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Calendar, Wallet, Users, Scissors, Bell, ArrowLeft, ShieldCheck, History, UserCheck, ShoppingBag, Settings, LogOut, Crown } from 'lucide-react'
import AdminSecurityGate from './AdminSecurityGate'
import AdminAiCopilot from './AdminAiCopilot'
import { useAdmin } from '../../context/AdminContext'
import styles from './AdminLayout.module.css'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/agenda', label: 'Agenda', icon: Calendar },
  { path: '/admin/caja', label: 'Caja', icon: Wallet },
  { path: '/admin/historial', label: 'Historial', icon: History },
  { path: '/admin/clientes', label: 'Directorio & Ficha', icon: UserCheck },
  { path: '/admin/equipo', label: 'Equipo & Nómina', icon: Users },
  { path: '/admin/servicios', label: 'Servicios', icon: Scissors },
  { path: '/admin/productos', label: 'Productos', icon: ShoppingBag },
  { path: '/admin/notificaciones', label: 'Anuncios', icon: Bell },
  { path: '/admin/configuracion', label: 'Configuración', icon: Settings }
]

const getTitleForRoute = (pathname) => {
  if (pathname === '/admin/agenda') return 'Agenda & Calendario'
  if (pathname === '/admin/caja') return 'Flujo de Caja & Finanzas'
  if (pathname === '/admin/historial') return 'Historial & Auditoría de Movimientos'
  if (pathname === '/admin/clientes') return 'Directorio & Ficha de Clientas'
  if (pathname === '/admin/equipo') return 'Equipo, Nómina & Comisiones'
  if (pathname === '/admin/servicios') return 'Catálogo de Servicios'
  if (pathname === '/admin/productos') return 'Inventario & Tienda Online'
  if (pathname === '/admin/notificaciones') return 'Gestión de Anuncios'
  if (pathname === '/admin/configuracion') return 'Configuración General del Negocio'
  return 'Dashboard General'
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const mainContentRef = React.useRef(null)

  const { activeCashSession, currentUserRole } = useAdmin()

  // Reset scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      mainContentRef.current.scrollTop = 0
    }
  }, [location.pathname])

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('spa_admin_authed')
      sessionStorage.removeItem('spa_admin_role')
    } catch (e) {}
    window.location.reload()
  }

  // Filtrado estricto de navegación según el rol autenticado
  const visibleNavItems = navItems.filter(item => {
    if (currentUserRole === 'SPECIALIST') {
      return item.path === '/admin/agenda' || item.path === '/admin/servicios' || item.path === '/admin/historial'
    }
    if (currentUserRole === 'ADMIN') {
      return item.path !== '/admin/configuracion'
    }
    return true
  })

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
            <ArrowLeft size={18} />
            <span className={styles.backLabel}>Volver</span>
          </button>
          
          <div className={styles.headerTitleGroup}>
            <ShieldCheck size={18} className={styles.adminShieldIcon} />
            <h1 className={styles.routeTitle}>{currentTitle}</h1>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* BADGE DE ROL AUTENTICADO */}
          {currentUserRole === 'OWNER' && (
            <div className={styles.roleHeaderBadgeOwner}>
              <Crown size={14} />
              <span>Dueña (Acceso Total)</span>
            </div>
          )}
          {currentUserRole === 'ADMIN' && (
            <div className={styles.roleHeaderBadgeAdmin}>
              <UserCheck size={14} />
              <span>Administradora</span>
            </div>
          )}
          {currentUserRole === 'SPECIALIST' && (
            <div className={styles.roleHeaderBadgeSpecialist}>
              <Scissors size={14} />
              <span>Especialista</span>
            </div>
          )}

          <div className={styles.dateBadge}>
            <Calendar size={16} />
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
            <LogOut size={15} />
            <span>Salir</span>
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
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN PAGE CONTENT */}
        <main ref={mainContentRef} className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={styles.mobileBottomNav}>
        {visibleNavItems.map(item => (
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
      </nav>

      {/* S.H.I.E.L.D. Copiloto Ejecutivo Inteligente con Llama 3 */}
      <AdminAiCopilot />
    </div>
  </AdminSecurityGate>
)
}
