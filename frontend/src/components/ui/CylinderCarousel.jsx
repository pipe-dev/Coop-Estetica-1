import React from "react";
import { motion } from "framer-motion";
import styles from "./CylinderCarousel.module.css";

export const CylinderCarousel = React.forwardRef(
  (
    {
      images,
      className,
      containerClassName,
      cardClassName,
      animationDuration = 32,
      cardWidth = 250,
      onImageClick,
      ...props
    },
    ref
  ) => {
    const N = images.length;
    
    const customStyle = {
      "--n": N,
      "--w": `${cardWidth}px`,
      "--ba": `calc(1turn / var(--n))`,
      "--anim-dur": `${animationDuration}s`,
    };

    return (
      <div
        ref={ref}
        className={`${styles.carouselContainer} ${className || ""}`}
        {...props}
      >
        <div
          className={`${styles.carouselInner} ${containerClassName || ""}`}
          style={{
            ...customStyle,
            animation: "ry var(--anim-dur) linear infinite",
          }}
        >
          <style>
            {`
              @keyframes ry {
                to { transform: rotateY(1turn); }
              }
            `}
          </style>
          
          {images.map((img, i) => (
            <div
              key={img.id || i}
              className={styles.carouselSlot}
              style={{
                width: "var(--w)",
                aspectRatio: "7/10",
                "--i": i,
                transform: "rotateY(calc(var(--i) * var(--ba))) translateZ(calc(-1 * (0.5 * var(--w) + 0.5em) / tan(0.5 * var(--ba))))",
              }}
            >
              <motion.img
                layoutId={`carousel-image-${img.id || i}`}
                src={img.src}
                alt={img.alt || `Carousel image ${i}`}
                className={`${styles.carouselImage} ${cardClassName || ""}`}
                onClick={() => onImageClick && onImageClick(img)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

CylinderCarousel.displayName = "CylinderCarousel";
