import React, { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Heart } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import SectionTitle from './SectionTitle'
import styles from './GiftCardCustomizer.module.css'

const presets = [
  { id: 'dorada', name: 'Experiencia Dorada', value: 150000, color: '#D4AF37' },
  { id: 'platino', name: 'Experiencia Platino', value: 300000, color: '#E5E4E2' },
  { id: 'suprema', name: 'Experiencia Suprema', value: 600000, color: '#B8960C' }
]

export default function GiftCardCustomizer({ showTitle = true }) {
  const [selectedPreset, setSelectedPreset] = useState(presets[0])
  const [customValue, setCustomValue] = useState('')
  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [message, setMessage] = useState('')

  const cardRef = useRef(null)

  // 3D Parallax Tilt Physics with Framer Motion Springs (Calibrated to prevent plane clipping)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 260, damping: 24 }
  const mouseXSpring = useSpring(x, springConfig)
  const mouseYSpring = useSpring(y, springConfig)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [10, -10])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-10, 10])

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.35, 0.08, 0.35])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const activeValue = customValue ? parseInt(customValue, 10) || 0 : selectedPreset.value

  const handleBuyWhatsApp = (e) => {
    e.preventDefault()
    const sponsorPhone = '573006269056'

    const messageLines = [
      '🎁 *SOLICITUD DE BONO DE REGALO (GIFT CARD)* 🎁',
      '════════════════════════════',
      `✦ *Plan:* ${selectedPreset.name}`,
      `✦ *Valor del Bono:* $${activeValue.toLocaleString()} COP`,
      '',
      `👤 *Para (Destinatario):* ${recipient || 'Persona Especial'}`,
      `✍️ *De parte de:* ${sender || 'Alguien que te aprecia'}`,
      message ? `💌 *Mensaje Dedicatorio:* ${message}` : '',
      '════════════════════════════',
      '_Enviado desde el personalizador de Bonos de Catheryne Ríos Estética_'
    ].filter(Boolean).join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${sponsorPhone}&text=${encodeURIComponent(messageLines)}`
    window.open(whatsappUrl, '_blank')
  }

  const isCustom = !!customValue
  const activeTier = isCustom ? 'custom' : selectedPreset.id
  const tierClass = {
    dorada: styles.tierDorada,
    platino: styles.tierPlatino,
    suprema: styles.tierSuprema,
    custom: styles.tierCustom,
  }[activeTier] || ''

  return (
    <div className={styles.customizerWrapper} id="gift-cards">
      {showTitle && (
        <SectionTitle
          subtitle="Tarjetas de Regalo"
          title="Regala una Experiencia de Lujo"
          description="Diseña una Gift Card personalizada. Elige el valor, los nombres y la dedicatoria en tiempo real."
          align="center"
        />
      )}

      <div className={styles.customizerGrid}>
        
        {/* LEFT: SKEUOMORPHIC PRESENTATION TRAY & 3D PARALLAX CARD */}
        <div
          className={styles.cardPreviewContainer}
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* SKEUOMORPHIC BED / RECESSED CASING SLOT */}
          <div className={styles.recessedSlotCasing}>
            <div className={styles.slotInteriorBed}>
              
              {/* DYNAMIC SHADOW CAST UNDER THE CARD */}
              <motion.div
                className={styles.cardCastShadow}
                style={{
                  x: useTransform(mouseXSpring, [-0.5, 0.5], [10, -10]),
                  y: useTransform(mouseYSpring, [-0.5, 0.5], [12, -6]),
                }}
              />

              {/* THE PHYSICAL SKEUOMORPHIC CARD */}
              <motion.div
                className={`${styles.metallicCard} ${tierClass}`}
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: 'preserve-3d',
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                {/* 3D Physical Card Bevel Edge Ring */}
                <div className={styles.cardBevelEdge} />

                {/* Tactile Satin / Brushed Card Texture */}
                <div className={styles.cardSurfaceTexture} />

                {/* Dynamic Specular Glare Reflection */}
                <motion.div
                  className={styles.dynamicGlare}
                  style={{
                    background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.4) 0%, transparent 60%)`,
                    opacity: glareOpacity
                  }}
                />

                {/* Ambient Shimmer */}
                <div className={styles.cardShimmer} />

                {/* Platino extra shimmer */}
                {activeTier === 'platino' && <div className={styles.platinoShimmer} />}

                {/* Suprema glow & particles */}
                {activeTier === 'suprema' && (
                  <>
                    <div className={styles.supremaGlow} />
                    <div className={`${styles.sparkleParticle} ${styles.sp1}`} />
                    <div className={`${styles.sparkleParticle} ${styles.sp2}`} />
                    <div className={`${styles.sparkleParticle} ${styles.sp3}`} />
                    <div className={`${styles.sparkleParticle} ${styles.sp4}`} />
                    <div className={`${styles.sparkleParticle} ${styles.sp5}`} />
                  </>
                )}

                {/* Subtle Luxury Watermark Emblem */}
                <div className={styles.securityWatermark} />

                {/* HEADER: Nombre de la estética hot-stamped */}
                <div className={styles.cardHeaderRow} style={{ transform: 'translateZ(12px)' }}>
                  <span className={styles.brandName}>CATHERYNE RÍOS ESTÉTICA</span>
                </div>

                {/* MAIN AMOUNT: Monto grabado / debossed en relieve */}
                <div className={styles.cardCenterBlock} style={{ transform: 'translateZ(20px)' }}>
                  <div className={styles.amountDisplay}>
                    ${activeValue.toLocaleString()}
                  </div>
                </div>

                {/* DETAILS BLOCK: Para, De y Placa de Dedicatoria */}
                <div className={styles.cardDetailsBlock} style={{ transform: 'translateZ(14px)' }}>
                  <div className={styles.namesBlock}>
                    <div className={styles.nameRow}>
                      <span className={styles.nameLabel}>Para:</span>
                      <span className={styles.nameValue}>{recipient || 'Nombre del Destinatario'}</span>
                    </div>
                    <div className={styles.nameRow}>
                      <span className={styles.nameLabel}>De:</span>
                      <span className={styles.nameValue}>{sender || 'Tu Nombre'}</span>
                    </div>
                  </div>

                  {message && (
                    <div className={styles.messageBox} style={{ transform: 'translateZ(16px)' }}>
                      <Heart size={13} className={styles.heartIcon} />
                      <p className={styles.messageText}>"{message}"</p>
                    </div>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* RIGHT: CONTROLS & FORM */}
        <div className={styles.controlsPanel}>
          <form onSubmit={handleBuyWhatsApp} className={styles.customizerForm}>
            
            {/* PRESET VALUES */}
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>1. Elige la Experiencia o Valor</label>
              <div className={styles.presetsGrid}>
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.presetBtn} ${selectedPreset.id === p.id && !customValue ? styles.presetActive : ''}`}
                    onClick={() => {
                      setSelectedPreset(p)
                      setCustomValue('')
                    }}
                  >
                    <span className={styles.presetName}>{p.name}</span>
                    <span className={styles.presetPrice}>${p.value.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM AMOUNT */}
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>O ingresa un Valor Personalizado (COP)</label>
              <input
                type="number"
                className={styles.textInput}
                placeholder="Ej. 250000"
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
              />
            </div>

            {/* RECIPIENT & SENDER */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>2. ¿Para quién es?</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Ej. Valentina Gómez"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>¿De parte de quién?</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Ej. Carlos Mendoza"
                  value={sender}
                  onChange={e => setSender(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* DEDICATION MESSAGE */}
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>3. Mensaje Especial o Dedicatoria</label>
              <textarea
                className={styles.textArea}
                rows="3"
                placeholder="Ej. ¡Feliz cumpleaños mi amor! Disfruta de un día de relajación inolvidable..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button type="submit" className={styles.submitBtn}>
              <FaWhatsapp size={18} />
              <span>Adquirir Bono por WhatsApp</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
