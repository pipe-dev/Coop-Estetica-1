import React, { useState, useEffect } from 'react'
import styles from './ProgressiveImage.module.css'

const ProgressiveImage = ({ src, placeholderSrc, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Reset state if src changes
    setIsLoaded(false)
  }, [src])

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* 
        TINY BLURRED PLACEHOLDER
        Always rendered first, blurred heavily, loads instantly.
      */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt={alt || ''}
          className={`${styles.placeholder} ${isLoaded ? styles.hidden : ''}`}
          aria-hidden="true"
        />
      )}

      {/* 
        FULL HD IMAGE
        Loaded in background. Opacity 0 until onLoad fires.
      */}
      <img
        src={src}
        alt={alt || ''}
        className={`${styles.hdImage} ${isLoaded ? styles.loaded : ''}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

export default ProgressiveImage
