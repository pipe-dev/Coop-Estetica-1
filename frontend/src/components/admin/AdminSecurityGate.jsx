import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Crown, UserCheck, Scissors, CheckCircle2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { api } from '../../services/api'
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
      const authed = sessionStorage.getItem('spa_admin_authed') === 'true'
      const token = sessionStorage.getItem('spa_admin_token')
      return authed && !!token
    } catch (e) {
      return false
    }
  })

  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedRolePreset, setSelectedRolePreset] = useState('OWNER') // 'OWNER' | 'ADMIN' | 'SPECIALIST'

  useEffect(() => {
    const handleEjection = (e) => {
      setIsAuthenticated(false)
      setErrorMsg(e?.detail?.reason || 'Acceso denegado: Sesión expirada o manipulada.')
      setPin('')
    }
    window.addEventListener('spa_auth_ejected', handleEjection)
    return () => window.removeEventListener('spa_auth_ejected', handleEjection)
  }, [])

  const handleUnlock = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    const input = pin.trim()
    if (!input) return

    try {
      const res = await api.verifyPin(input)
      if (res && res.valid && res.role && res.accessToken) {
        setCurrentUserRole(res.role)
        try {
          sessionStorage.setItem('spa_admin_token', res.accessToken)
          sessionStorage.setItem('spa_admin_authed', 'true')
          sessionStorage.setItem('spa_admin_role', res.role)
        } catch (e) {}
        if (res.role === 'SPECIALIST') setCurrentSpecialistId('2')
        setIsAuthenticated(true)
        return
      } else {
        setErrorMsg('PIN de acceso incorrecto o no autorizado.')
        setPin('')
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor de autenticación.')
      setPin('')
    }
  }

  const handlePresetSelect = (roleKey) => {
    setSelectedRolePreset(roleKey)
    setErrorMsg('')
    // No auto-rellenar el PIN para proteger la clave
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
            <h2>Control de Acceso</h2>
            <p>Ingresa tu clave de acceso para ingresar al panel.</p>
          </div>

          {/* ROLE SELECTOR TABS */}
          <div className={styles.roleGuideContainer}>
            <div className={styles.roleTabs}>
              <button 
                type="button" 
                className={`${styles.roleTab} ${selectedRolePreset === 'OWNER' ? styles.tabOwnerActive : ''}`}
                onClick={() => handlePresetSelect('OWNER')}
              >
                <Crown size={14} />
                <span>CEO</span>
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
          </div>

          <form onSubmit={handleUnlock} className={styles.pinForm}>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.lockIcon} />
              <input
                type="password"
                maxLength={6}
                placeholder="Ingresa tu clave de 6 dígitos..."
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
