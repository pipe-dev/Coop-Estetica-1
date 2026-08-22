import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown } from 'lucide-react'
import styles from './TimePickerUniversal.module.css'

export default function TimePickerUniversal({ value = '10:00 AM', onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current value string e.g. "10:30 AM"
  const parseTimeString = (timeStr) => {
    if (!timeStr) return { hour: 10, minute: '00', period: 'AM' }
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return { hour: 10, minute: '00', period: 'AM' }
    let h = parseInt(match[1], 10)
    let m = match[2]
    let p = match[3].toUpperCase()
    if (h < 1 || h > 12) h = 10
    return { hour: h, minute: m, period: p }
  }

  const { hour: selectedHour, minute: selectedMin, period: selectedPeriod } = parseTimeString(value)

  const formatAndEmit = (h, m, p) => {
    const formattedH = String(h).padStart(2, '0')
    const formattedStr = `${formattedH}:${m} ${p}`
    if (onChange) onChange(formattedStr)
  }

  const handleHourSelect = (h) => {
    formatAndEmit(h, selectedMin, selectedPeriod)
  }

  const handleMinSelect = (m) => {
    formatAndEmit(selectedHour, m, selectedPeriod)
  }

  const handlePeriodSelect = (p) => {
    formatAndEmit(selectedHour, selectedMin, p)
  }

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const minutes = ['00', '15', '30', '45']

  // Outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {label && <label className={styles.fieldLabel}>{label}</label>}

      {/* TRIGGER BUTTON */}
      <button
        type="button"
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock size={16} className={styles.clockIcon} />
        <span className={styles.timeText}>{value || '10:00 AM'}</span>
        <ChevronDown size={14} className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotated : ''}`} />
      </button>

      {/* FLOATING POPOVER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={styles.popover}
          >
            {/* 3-COLUMN SELECTOR */}
            <div className={styles.selectorRow}>
              {/* HOURS COLUMN */}
              <div className={styles.colGroup}>
                <span className={styles.colHeader}>Hora</span>
                <div className={styles.hoursGrid}>
                  {hours.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`${styles.cellBtn} ${selectedHour === h ? styles.cellActive : ''}`}
                      onClick={() => handleHourSelect(h)}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* MINUTES COLUMN */}
              <div className={styles.colGroup}>
                <span className={styles.colHeader}>Min</span>
                <div className={styles.minGrid}>
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.cellBtn} ${selectedMin === m ? styles.cellActive : ''}`}
                      onClick={() => handleMinSelect(m)}
                    >
                      :{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* PERIOD COLUMN */}
              <div className={styles.colGroup}>
                <span className={styles.colHeader}>Jornada</span>
                <div className={styles.periodBox}>
                  {['AM', 'PM'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.periodPill} ${selectedPeriod === p ? styles.periodActive : ''}`}
                      onClick={() => handlePeriodSelect(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CONFIRM BUTTON */}
            <button
              type="button"
              className={styles.doneBtn}
              onClick={() => setIsOpen(false)}
            >
              Listo ({value})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
