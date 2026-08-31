import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, X, RefreshCw, Zap } from 'lucide-react'
import { uploadToImgBB } from '../../services/imgbbService'
import { formatBytes } from '../../utils/imageOptimizer'
import styles from './ImageUploader.module.css'

export default function ImageUploader({ value, onChange, label = 'Foto del Servicio o Producto' }) {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [optimizationStats, setOptimizationStats] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    setOptimizationStats(null)
    setIsUploading(true)

    try {
      const res = await uploadToImgBB(file)
      onChange(res.url)
      setOptimizationStats(res)
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir la imagen a la CDN')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    setErrorMsg('')
    setOptimizationStats(null)
  }

  return (
    <div className={styles.uploaderContainer}>
      <label className={styles.uploaderLabel}>{label}</label>

      {/* HIDDEN FILE INPUT (Supports camera & gallery on mobile) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      {value ? (
        <div className={styles.previewCard}>
          <img src={value} alt="Preview" className={styles.previewImage} />
          
          <div className={styles.previewOverlay}>
            <div className={styles.badgesRow}>
              <div className={styles.cdnBadge}>
                <CheckCircle2 size={13} />
                <span>CDN ImgBB</span>
              </div>

              {optimizationStats && (
                <div className={styles.optBadge}>
                  <Zap size={13} />
                  <span>
                    {formatBytes(optimizationStats.originalSize)} → {formatBytes(optimizationStats.optimizedSize)} ({optimizationStats.savingsPercent} optimizada)
                  </span>
                </div>
              )}
            </div>

            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.changeBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <RefreshCw size={14} />
                <span>Cambiar Foto</span>
              </button>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={handleRemove}
                title="Quitar foto"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`${styles.dropzone} ${isUploading ? styles.dropzoneUploading : ''}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className={styles.uploadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <span className={styles.uploadingText}>Comprimiendo y Subiendo a CDN...</span>
              <span className={styles.uploadingSubtext}>Convirtiendo a WebP ultraliviano en tu dispositivo</span>
            </div>
          ) : (
            <div className={styles.idleState}>
              <div className={styles.uploadIconCircle}>
                <UploadCloud size={24} />
              </div>
              <span className={styles.idleTitle}>Toca aquí para seleccionar una foto</span>
              <span className={styles.idleSubtitle}>Se optimiza y comprime automáticamente antes de enviar</span>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorBanner}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MANUAL URL INPUT FALLBACK */}
      <div className={styles.manualUrlRow}>
        <span className={styles.orText}>o escribe un enlace directo:</span>
        <input
          type="url"
          placeholder="https://..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={styles.manualInput}
        />
      </div>
    </div>
  )
}
