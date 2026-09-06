import React, { useState, useRef } from 'react'
import { UploadCloud, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { uploadToImgBB } from '../../services/imgbbService'
import styles from './ImageUploader.module.css'

export default function ImageUploader({ value, onChange, label = 'Foto del Servicio o Producto' }) {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    setIsUploading(true)

    try {
      const res = await uploadToImgBB(file)
      onChange(res.url)
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir la foto. Por favor intenta de nuevo.')
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
            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.changeBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <RefreshCw size={13} />
                <span>Cambiar foto</span>
              </button>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={handleRemove}
              >
                <Trash2 size={13} />
                <span>Eliminar</span>
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
              <span className={styles.uploadingText}>Subiendo foto...</span>
              <span className={styles.uploadingSubtext}>Un momento por favor</span>
            </div>
          ) : (
            <div className={styles.idleState}>
              <div className={styles.uploadIconCircle}>
                <UploadCloud size={24} />
              </div>
              <span className={styles.idleTitle}>Toca aquí para seleccionar una foto</span>
              <span className={styles.idleSubtitle}>Formatos JPG, PNG o WEBP</span>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorBanner}>
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
