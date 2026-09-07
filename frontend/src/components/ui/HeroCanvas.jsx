import React, { useRef, useEffect, useState } from 'react';
import { deviceCapability } from '../../utils/deviceCapability';
import styles from './HeroCanvas.module.css';

const { isLowEnd, maxDpr, maxCanvasFrames, canvasStep } = deviceCapability;
const TOTAL_FRAMES = maxCanvasFrames; // 25 en gama ultra-baja (3.8MB), 75 en gama alta

const getFramePath = (logicalIndex) => {
  // Mapear el índice lógico (0..TOTAL_FRAMES-1) al archivo real frame_001..frame_075
  const originalFileIndex = Math.min(74, logicalIndex * canvasStep);
  const padded = String(originalFileIndex + 1).padStart(3, '0');
  return `/frames/hero/frame_${padded}.webp`;
};

export const HeroCanvas = ({ progress }) => {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const lastDrawnIndexRef = useRef(-1);

  // 1. Precarga inteligente y escalonada (Priority Staged Preload)
  useEffect(() => {
    let isCancelled = false;
    const images = new Array(TOTAL_FRAMES);

    const loadSingleFrame = (index) => {
      if (isCancelled || images[index]) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = getFramePath(index);
      img.onload = () => {
        if (!isCancelled) {
          setLoadedCount((prev) => prev + 1);
        }
      };
      images[index] = img;
    };

    // Prioridad 1: Fotograma 0 (crítico para renderizado inmediato)
    loadSingleFrame(0);

    // Prioridad 2: Primeros 4 fotogramas para inicio de scroll fluido
    const timer1 = setTimeout(() => {
      if (isCancelled) return;
      for (let i = 1; i < Math.min(5, TOTAL_FRAMES); i++) {
        loadSingleFrame(i);
      }
    }, 20);

    // Prioridad 3: Resto de fotogramas en lotes ligeros de 5 para no colapsar la CPU ni red móvil
    const timer2 = setTimeout(() => {
      if (isCancelled) return;
      let currentIndex = 5;
      const interval = setInterval(() => {
        if (isCancelled || currentIndex >= TOTAL_FRAMES) {
          clearInterval(interval);
          return;
        }
        for (let j = 0; j < 5 && currentIndex < TOTAL_FRAMES; j++, currentIndex++) {
          loadSingleFrame(currentIndex);
        }
      }, isLowEnd ? 80 : 30);
    }, 80);

    imagesRef.current = images;

    return () => {
      isCancelled = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
      imagesRef.current = [];
    };
  }, []);

  // 2. Función de renderizado en Canvas adaptando a 'cover' con DPR controlado
  const drawFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false acelera el pipeline GPU
    if (!ctx) return;

    let usableImg = imagesRef.current[frameIndex];
    // Fallback: si el fotograma no ha terminado de cargar, buscar el más cercano disponible
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

    ctx.drawImage(usableImg, drawX, drawY, drawWidth, drawHeight);
    lastDrawnIndexRef.current = frameIndex;
  };

  // 3. Manejo de redimensionamiento con DPR optimizado según capacidad del dispositivo
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
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

    window.addEventListener('resize', handleResize, { passive: true });
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
