import React, { useRef, useEffect, useState } from 'react';
import styles from './HeroCanvas.module.css';

const TOTAL_FRAMES = 75;

const getFramePath = (index) => {
  const padded = String(index + 1).padStart(3, '0');
  return `/frames/hero/frame_${padded}.webp`;
};

export const HeroCanvas = ({ progress }) => {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const lastDrawnIndexRef = useRef(-1);

  // 1. Precarga incremental de los 75 fotogramas WebP
  useEffect(() => {
    let isCancelled = false;
    const images = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (!isCancelled) {
          setLoadedCount((prev) => prev + 1);
        }
      };
      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      isCancelled = true;
      imagesRef.current = [];
    };
  }, []);

  // 2. Función de renderizado en Canvas adaptando a 'cover'
  const drawFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let usableImg = imagesRef.current[frameIndex];
    // Fallback: si el fotograma actual no ha terminado de cargar, buscar el más cercano cargado
    if (!usableImg || !usableImg.complete) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = imagesRef.current[frameIndex - offset];
        if (prev && prev.complete) { usableImg = prev; break; }
        const next = imagesRef.current[frameIndex + offset];
        if (next && next.complete) { usableImg = next; break; }
      }
    }

    if (!usableImg || !usableImg.complete || usableImg.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = usableImg.naturalWidth;
    const imgHeight = usableImg.naturalHeight;

    // Calcular escala estilo object-fit: cover
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const drawX = (canvasWidth - drawWidth) / 2;
    const drawY = (canvasHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(usableImg, drawX, drawY, drawWidth, drawHeight);
    lastDrawnIndexRef.current = frameIndex;
  };

  // 3. Manejo de redimensionamiento con DPR optimizado (máx 1.5 para ahorrar VRAM)
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      if (lastDrawnIndexRef.current >= 0) {
        drawFrame(lastDrawnIndexRef.current);
      } else {
        drawFrame(0);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Dibujar primer fotograma tan pronto esté disponible
  useEffect(() => {
    if (loadedCount > 0 && lastDrawnIndexRef.current === -1) {
      drawFrame(0);
    }
  }, [loadedCount]);

  // 5. Suscripción al scroll progress de Framer Motion
  useEffect(() => {
    if (!progress) return;

    const unsubscribe = progress.on('change', (latest) => {
      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(latest * (TOTAL_FRAMES - 1))));
      if (frameIndex !== lastDrawnIndexRef.current) {
        drawFrame(frameIndex);
      }
    });

    return () => unsubscribe();
  }, [progress]);

  return (
    <div className={styles.canvasContainer}>
      <canvas ref={canvasRef} className={styles.heroCanvas} />
    </div>
  );
};

export default HeroCanvas;
