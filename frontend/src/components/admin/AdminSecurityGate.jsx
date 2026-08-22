import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, KeyRound, AlertTriangle } from 'lucide-react'
import styles from './AdminSecurityGate.module.css'

/**
 * ⚠️ NOTA DE SEGURIDAD PARA FASE BACKEND:
 * Este candado de PIN es un control de acceso del lado del cliente para la etapa actual.
 * Cuando se implemente el servidor Backend, se sustituirá por:
 *  - Autenticación real basada en tokens JWT con HTTP-Only Cookies seguras.
 *  - Hashing de contraseñas con bcrypt / Argon2.
 *  - Protección contra ataques de fuerza bruta (Rate-Limiting / Throttling).
 *  - Implementación del PRINCIPIO SHIELD (WAF, sanitización de entrada, prevención XSS, CSRF y SQLi).
 */

export default function AdminSecurityGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('spa_admin_authed') === 'true'
    } catch (e) {
      return false
    }
  })

  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const CORRECT_PIN = '1234'

  const handleUnlock = (e) => {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      try {
        sessionStorage.setItem('spa_admin_authed', 'true')
      } catch (e) {}
      setIsAuthenticated(true)
      setErrorMsg('')
    } else {
      setErrorMsg('PIN incorrecto. Inténtalo de nuevo (PIN por defecto: 1234)')
      setPin('')
    }
  }

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('spa_admin_authed')
    } catch (e) {}
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.gateWrapper}>
        <div className={styles.gateCard}>
          <div className={styles.shieldHeader}>
            <div className={styles.shieldIconCircle}>
              <ShieldCheck size={32} />
            </div>
            <h2>Acceso Restringido</h2>
            <p>Ingresa el PIN de seguridad para acceder al panel de administración de Catheryne Ríos Estética.</p>
          </div>

          <form onSubmit={handleUnlock} className={styles.pinForm}>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.lockIcon} />
              <input
                type="password"
                maxLength={8}
                placeholder="Ingresa PIN (1234)"
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
              <span>Desbloquear Panel Admin</span>
            </button>
          </form>

          <div className={styles.shieldNotice}>
            <p><strong>🛡️ Principio SHIELD Note:</strong> En la integración backend se activará autenticación multi-factor, prevención WAF anti-extracciones y firmas JWT.</p>
          </div>
        </div>
      </div>
    )
  }

  return children
}
