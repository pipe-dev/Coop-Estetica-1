import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Crown, UserCheck, Scissors, CheckCircle2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import styles from './AdminSecurityGate.module.css'

export default function AdminSecurityGate({ children }) {
  const { 
    currentUserRole, 
    setCurrentUserRole, 
    setCurrentSpecialistId,
    businessConfig,
    teamMembers
  } = useAdmin()

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('spa_admin_authed') === 'true'
    } catch (e) {
      return false
    }
  })

  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedRolePreset, setSelectedRolePreset] = useState('OWNER') // 'OWNER' | 'ADMIN' | 'SPECIALIST'

  // Definición de las 3 claves oficiales del sistema
  const OWNER_PIN = businessConfig?.masterPin || '2026'
  const ADMIN_PIN = '1234'
  const SPECIALIST_PIN = '7777'

  const handleUnlock = (e) => {
    e.preventDefault()
    setErrorMsg('')
    const input = pin.trim()

    if (input === OWNER_PIN) {
      // 1. Desbloqueo como DUEÑA (Acceso Total)
      setCurrentUserRole('OWNER')
      try {
        sessionStorage.setItem('spa_admin_authed', 'true')
        sessionStorage.setItem('spa_admin_role', 'OWNER')
      } catch (err) {}
      setIsAuthenticated(true)
    } else if (input === ADMIN_PIN) {
      // 2. Desbloqueo como ADMINISTRADORA (Gestión Operativa)
      setCurrentUserRole('ADMIN')
      try {
        sessionStorage.setItem('spa_admin_authed', 'true')
        sessionStorage.setItem('spa_admin_role', 'ADMIN')
      } catch (err) {}
      setIsAuthenticated(true)
    } else if (input === SPECIALIST_PIN) {
      // 3. Desbloqueo como ESPECIALISTA (Agenda & Monto Neto)
      setCurrentUserRole('SPECIALIST')
      setCurrentSpecialistId('2') // Valentina Silva por defecto
      try {
        sessionStorage.setItem('spa_admin_authed', 'true')
        sessionStorage.setItem('spa_admin_role', 'SPECIALIST')
      } catch (err) {}
      setIsAuthenticated(true)
    } else {
      setErrorMsg('PIN de acceso incorrecto. Verifica la clave correspondiente a tu rol.')
      setPin('')
    }
  }

  const handlePresetSelect = (roleKey) => {
    setSelectedRolePreset(roleKey)
    setErrorMsg('')
    if (roleKey === 'OWNER') setPin(OWNER_PIN)
    if (roleKey === 'ADMIN') setPin(ADMIN_PIN)
    if (roleKey === 'SPECIALIST') setPin(SPECIALIST_PIN)
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.gateWrapper}>
        <motion.div 
          className={styles.gateCard}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.shieldHeader}>
            <div className={styles.shieldIconCircle}>
              <ShieldCheck size={32} />
            </div>
            <h2>Control de Acceso por Roles</h2>
            <p>Ingresa la clave correspondiente a tu nivel de autorización en Catheryne Ríos Estética.</p>
          </div>

          {/* ROLE SELECTOR / GUIDE TABS */}
          <div className={styles.roleGuideContainer}>
            <div className={styles.roleTabs}>
              <button 
                type="button" 
                className={`${styles.roleTab} ${selectedRolePreset === 'OWNER' ? styles.tabOwnerActive : ''}`}
                onClick={() => handlePresetSelect('OWNER')}
              >
                <Crown size={14} />
                <span>Dueña</span>
              </button>

              <button 
                type="button" 
                className={`${styles.roleTab} ${selectedRolePreset === 'ADMIN' ? styles.tabAdminActive : ''}`}
                onClick={() => handlePresetSelect('ADMIN')}
              >
                <UserCheck size={14} />
                <span>Administradora</span>
              </button>

              <button 
                type="button" 
                className={`${styles.roleTab} ${selectedRolePreset === 'SPECIALIST' ? styles.tabSpecialistActive : ''}`}
                onClick={() => handlePresetSelect('SPECIALIST')}
              >
                <Scissors size={14} />
                <span>Especialista</span>
              </button>
            </div>

            <div className={styles.roleDescriptionBox}>
              {selectedRolePreset === 'OWNER' && (
                <div>
                  <strong>Acceso Total (Propietaria):</strong>
                  <p>Visualiza toda la facturación, autoriza cambios de precios, comisiones y configuración maestra. (Clave: <code>{OWNER_PIN}</code>)</p>
                </div>
              )}
              {selectedRolePreset === 'ADMIN' && (
                <div>
                  <strong>Acceso Operativo (Recepción):</strong>
                  <p>Maneja agenda global, apertura/cierre de caja con arqueo ciego, cobros y clientas. Bloqueada para mutaciones críticas. (Clave: <code>{ADMIN_PIN}</code>)</p>
                </div>
              )}
              {selectedRolePreset === 'SPECIALIST' && (
                <div>
                  <strong>Acceso Restringido (Especialista):</strong>
                  <p>Consulta exclusivamente su propia agenda asignada y su acumulado diario en <strong>monto neto</strong>. (Clave: <code>{SPECIALIST_PIN}</code>)</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleUnlock} className={styles.pinForm}>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.lockIcon} />
              <input
                type="password"
                maxLength={8}
                placeholder="Ingresa tu clave de acceso..."
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoFocus
                required
              />
            </div>

            {errorMsg && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className={styles.unlockBtn}>
              <KeyRound size={16} />
              <span>Desbloquear Panel</span>
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return children
}
