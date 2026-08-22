import React from 'react'
import { motion } from 'framer-motion'
import styles from './RadialTimePicker.module.css'

export default function RadialTimePicker({ value = '10:00 AM', onChange }) {
  // Parse input string e.g. "10:30 PM" or "01:00 AM"
  const parseTimeString = (timeStr) => {
    if (!timeStr) return { hour: 10, minute: 0, period: 'AM' }
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return { hour: 10, minute: 0, period: 'AM' }
    let h = parseInt(match[1], 10)
    let m = parseInt(match[2], 10)
    let p = match[3].toUpperCase()
    if (h < 1 || h > 12) h = 10
    // Round minute to nearest 5
    m = Math.round(m / 5) * 5
    if (m >= 60) m = 0
    return { hour: h, minute: m, period: p }
  }

  const { hour: selectedHour, minute: selectedMin, period: selectedPeriod } = parseTimeString(value)

  const formatOutput = (h, m, p) => {
    const formattedH = String(h).padStart(2, '0')
    const formattedM = String(m).padStart(2, '0')
    return `${formattedH}:${formattedM} ${p}`
  }

  const handleHourClick = (h) => {
    const newStr = formatOutput(h, selectedMin, selectedPeriod)
    if (onChange) onChange(newStr)
  }

  const handleMinClick = (m) => {
    const newStr = formatOutput(selectedHour, m, selectedPeriod)
    if (onChange) onChange(newStr)
  }

  const handlePeriodClick = (p) => {
    const newStr = formatOutput(selectedHour, selectedMin, p)
    if (onChange) onChange(newStr)
  }

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  // Outer Dial Radius (px)
  const outerRadius = 96
  // Inner Dial Radius (px)
  const innerRadius = 56

  return (
    <div className={styles.container}>
      {/* DIGITAL READOUT HEADER */}
      <div className={styles.readoutHeader}>
        <span className={styles.timeValText}>
          {String(selectedHour).padStart(2, '0')}:{String(selectedMin).padStart(2, '0')}
        </span>
        <span className={styles.periodBadge}>{selectedPeriod}</span>
      </div>

      {/* CLOCK & SIDE PERIOD TOGGLE WRAPPER */}
      <div className={styles.clockBodyWrapper}>
        {/* RADIAL CIRCULAR CLOCK FACE */}
        <div className={styles.clockCircle}>
          {/* Subtle concentric rings background */}
          <div className={styles.outerRingGuide} />
          <div className={styles.innerRingGuide} />

          {/* Center Hub */}
          <div className={styles.centerDot} />

          {/* OUTER DIAL - HOURS (1 to 12) */}
          {hours.map((h, i) => {
            // angle in degrees: 12 is top (-90 deg)
            const angleDeg = i * 30 - 90
            const angleRad = (angleDeg * Math.PI) / 180
            const x = Math.round(outerRadius * Math.cos(angleRad))
            const y = Math.round(outerRadius * Math.sin(angleRad))
            const isSelected = selectedHour === h

            return (
              <button
                key={`h-${h}`}
                type="button"
                className={`${styles.dialBtn} ${styles.outerDialBtn} ${isSelected ? styles.selectedDialBtn : ''}`}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                onClick={() => handleHourClick(h)}
                title={`Hora ${h}`}
              >
                {h}
              </button>
            )
          })}

          {/* INNER DIAL - MINUTES (00 to 55) */}
          {minutes.map((m, i) => {
            const angleDeg = i * 30 - 90
            const angleRad = (angleDeg * Math.PI) / 180
            const x = Math.round(innerRadius * Math.cos(angleRad))
            const y = Math.round(innerRadius * Math.sin(angleRad))
            const isSelected = selectedMin === m

            return (
              <button
                key={`m-${m}`}
                type="button"
                className={`${styles.dialBtn} ${styles.innerDialBtn} ${isSelected ? styles.selectedInnerBtn : ''}`}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                onClick={() => handleMinClick(m)}
                title={`Minuto ${String(m).padStart(2, '0')}`}
              >
                {String(m).padStart(2, '0')}
              </button>
            )
          })}
        </div>

        {/* SIDE AM / PM TOGGLE BUTTONS */}
        <div className={styles.periodColumn}>
          <button
            type="button"
            className={`${styles.periodBtn} ${selectedPeriod === 'AM' ? styles.activePeriodBtn : ''}`}
            onClick={() => handlePeriodClick('AM')}
          >
            AM
          </button>
          <button
            type="button"
            className={`${styles.periodBtn} ${selectedPeriod === 'PM' ? styles.activePeriodBtn : ''}`}
            onClick={() => handlePeriodClick('PM')}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  )
}
