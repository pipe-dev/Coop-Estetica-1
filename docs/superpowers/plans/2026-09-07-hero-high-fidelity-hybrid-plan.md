# Hero Híbrido de Alta Fidelidad (Canvas WebP + Video 1080p) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar una arquitectura híbrida de dos niveles para el Hero: una secuencia de fotogramas WebP en `<canvas>` para el primer hero (storytelling controlado por scroll con cero macrobloques ni banding) y un video remasterizado en 1080p nativo con `-tune film` para el segundo hero (usuario recurrente).

**Architecture:** 
- Para nuevos visitantes (`!isReturningUser`): `<HeroCanvas>` precarga 75 fotogramas WebP de 1080p (total ~2.2 MB) y dibuja el fotograma correspondiente al avance del scroll instantáneamente por GPU (0ms latencia de seek).
- Para usuarios recurrentes (`isReturningUser === true`): `<video>` nativo de 1080p codificado con CRF 20 y `-tune film` que reproduce en bucle continuo de 60 FPS por hardware con 0% de sobrecarga en CPU/JS.

**Tech Stack:** React 19, Vite, Framer Motion, HTML5 Canvas 2D API, FFmpeg (libwebp + libx264).

## Global Constraints

- Resolución de fotogramas WebP y video: 1920x1080 nativo.
- Cero banding o macrobloques en la textura de cuero negro y los biseles dorados.
- Preservar la pantalla inicial negra sólida (`#000000`) con *"Desliza hacia abajo para comenzar"*.
- Preservar las 4 escenas del relato sincronizadas con scroll distance de 450vh.
- Mantener compatibilidad total con dispositivos de gama baja (DPR limitado a 1.5 en canvas).

---

### Task 1: Pipeline de Generación de Medios (FFmpeg)

**Files:**
- Create: `frontend/public/frames/hero/frame_001.webp` ... `frame_075.webp`
- Create: `frontend/public/videos/hero_loop_1080p.mp4`
- Modify: `frontend/public/videos/hero.mp4`

**Interfaces:**
- Produces: 75 fotogramas WebP 1080p en `frontend/public/frames/hero/`
- Produces: Video 1080p remasterizado con `-tune film` en `frontend/public/videos/hero_loop_1080p.mp4`

- [ ] **Step 1: Crear directorio de fotogramas**

```powershell
New-Item -ItemType Directory -Force -Path "frontend/public/frames/hero"
```

- [ ] **Step 2: Extraer 75 fotogramas WebP en 1080p con alta calidad (q:v 85)**

Extraer del clip original de 8 segundos exactamente 75 cuadros distribuidos uniformemente:

```powershell
ffmpeg -i frontend/public/videos/hero.mp4 -vf "fps=75/8,scale=1920:1080:flags=lanczos" -c:v libwebp -quality 85 -preset photo -an -y "frontend/public/frames/hero/frame_%03d.webp"
```

- [ ] **Step 3: Verificar que los 75 fotogramas se generaron correctamente y revisar tamaño total**

```powershell
$frames = Get-ChildItem "frontend/public/frames/hero/*.webp"
$totalBytes = ($frames | Measure-Object -Property Length -Sum).Sum
Write-Host "Total frames:" $frames.Count "Total Size:" ([math]::Round($totalBytes / 1MB, 2)) "MB"
```
Expected: 75 archivos `.webp` con un peso acumulado de entre 1.8 MB y 2.5 MB.

- [ ] **Step 4: Codificar el video 1080p con `-tune film` para el segundo hero**

Crear el video de 16 segundos en 1080p de alta fidelidad con preservación de grano fino:

```powershell
ffmpeg -i frontend/public/videos/hero.mp4 -filter_complex "[0:v]split[f][r_in];[r_in]reverse[r];[f][r]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -crf 20 -tune film -preset medium -movflags +faststart -an -pix_fmt yuv420p -y frontend/public/videos/hero_loop_1080p.mp4
```

- [ ] **Step 5: Verificar tamaño y bitrate de `hero_loop_1080p.mp4`**

```powershell
Get-Item frontend/public/videos/hero_loop_1080p.mp4 | Select-Object Name, Length
```
Expected: ~3.5 MB a 5.5 MB.

- [ ] **Step 6: Commit de los assets generados**

```powershell
git add frontend/public/frames/hero/*.webp frontend/public/videos/hero_loop_1080p.mp4
git commit -m "media(hero): generate 75 high-fidelity 1080p WebP frames and 1080p film-tuned video"
```

---

### Task 2: Componente `HeroCanvas` & Hook de Precarga

**Files:**
- Create: `frontend/src/components/ui/HeroCanvas.jsx`
- Create: `frontend/src/components/ui/HeroCanvas.module.css`

**Interfaces:**
- Produces: `<HeroCanvas progress={scrollYProgress} totalFrames={75} />`
- Consumes: `frontend/public/frames/hero/frame_*.webp`

- [ ] **Step 1: Crear estilos para `HeroCanvas`**

Archivo `frontend/src/components/ui/HeroCanvas.module.css`:
```css
.canvasContainer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background-color: #000000;
}

.heroCanvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 2: Crear el componente `HeroCanvas.jsx` con precarga inteligente y renderizado GPU**

Archivo `frontend/src/components/ui/HeroCanvas.jsx`:
```jsx
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

  // 1. Precarga incremental de fotogramas
  useEffect(() => {
    let isCancelled = false;
    const images = [];

    // Precargar los primeros 10 inmediatamente
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

  // 2. Función de dibujo en Canvas con adaptación de aspecto 'cover'
  const drawFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    // Si la imagen objetivo aún no carga, intentar buscar la más cercana ya disponible
    let usableImg = img;
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

  // 3. Manejo de resolución y redimensionamiento con DPR optimizado
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

  // 4. Dibujar primer cuadro cuando el primer frame esté listo
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
```

- [ ] **Step 3: Commit del componente `HeroCanvas`**

```powershell
git add frontend/src/components/ui/HeroCanvas.jsx frontend/src/components/ui/HeroCanvas.module.css
git commit -m "feat(hero): add high-performance HeroCanvas component with image preloader"
```

---

### Task 3: Integración Híbrida en `Home.jsx`

**Files:**
- Modify: `frontend/src/pages/Home.jsx`

**Interfaces:**
- Consumes: `HeroCanvas` para `!isReturningUser`
- Consumes: `hero_loop_1080p.mp4` para `isReturningUser`

- [ ] **Step 1: Importar `HeroCanvas` en `Home.jsx`**

```jsx
import HeroCanvas from '../components/ui/HeroCanvas';
```

- [ ] **Step 2: Renderizar condicionalmente `HeroCanvas` o `<video>` nativo 1080p**

En el JSX de `Home.jsx`:
```jsx
          <div className={styles.heroImageWrapper}>
            {isReturningUser ? (
              <video
                ref={videoRef}
                src="/videos/hero_loop_1080p.mp4"
                poster="/images/hero_poster.webp"
                className={styles.heroImage}
                muted
                playsInline
                preload="auto"
                autoPlay
                loop
              />
            ) : (
              <HeroCanvas progress={scrollYProgress} />
            )}
          </div>
```

- [ ] **Step 3: Eliminar llamadas redundantes a `videoRef.currentTime` durante scroll cuando `!isReturningUser`**

Dado que `HeroCanvas` ahora se encarga de dibujar el fotograma exacto directamente por scroll, el listener `useMotionValueEvent` en `Home.jsx` queda exclusivamente para controlar las escenas de texto:

```jsx
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isReturningUser && latest > 0.8) {
      localStorage.setItem('hasSeenIntro', 'true');
    }

    if (isReturningUser) return;

    if (latest < 0.08) {
      setActiveScene(-1); // Cortina negra pura
      setStoryWord("");
      setShowCtas(false);
    } else if (latest < 0.30) {
      setActiveScene(0); // "Bienvenida a Catheryne Ríos estética"
      setStoryWord("");
      setShowCtas(false);
    } else if (latest < 0.55) {
      setActiveScene(1); // "El lujo de decidir cuidarte."
      setStoryWord("");
      setShowCtas(false);
    } else if (latest < 0.75) {
      setActiveScene(-1); // Escena cinematográfica limpia mostrando solo el arte
      setStoryWord("");
      setShowCtas(false);
    } else if (latest < 0.91) {
      setActiveScene(2); // "Para engrandecer tu belleza."
      setStoryWord("");
      setShowCtas(false);
    } else {
      setActiveScene(3); // "quiérete en:" + CTAs
      setStoryWord("quiérete en:");
      setShowCtas(true);
    }
  });
```

- [ ] **Step 4: Compilar frontend y verificar que no haya errores**

```powershell
cd frontend; npm run build; cd ..
```
Expected: Build exitoso en <2s.

- [ ] **Step 5: Commit de la integración híbrida en `Home.jsx`**

```powershell
git add frontend/src/pages/Home.jsx
git commit -m "feat(hero): integrate Canvas WebP sequence for storytelling and 1080p video for returning users"
```

---

### Task 4: Verificación y Despliegue en Producción

**Files:**
- Verify: `frontend/public/frames/hero/`
- Verify: `frontend/public/videos/hero_loop_1080p.mp4`
- Verify: `https://catheryneriosestetica.vercel.app`

- [ ] **Step 1: Comprobar visualmente los fotogramas WebP extraídos**

Verificar que no existen artefactos de compresión ni macrobloques en el fotograma 74 (el del logo final):
```powershell
Get-Item "frontend/public/frames/hero/frame_074.webp" | Select-Object Name, Length
```

- [ ] **Step 2: Subir cambios a GitHub para despliegue en Vercel**

```powershell
git push origin main
```

- [ ] **Step 3: Verificar en producción**

1. Abrir `https://catheryneriosestetica.vercel.app` en ventana incógnito (nuevo usuario):
   - Cortina negra inicial pura con "Desliza hacia abajo para comenzar".
   - Al deslizar, la cortina se retira y el canvas dibuja los fotogramas WebP en 1080p impecables, sin ningún macrobloque ni pixelación en el cuero oscuro ni el logo dorado.
   - La fluidez al deslizar el dedo hacia arriba y abajo es continua e instantánea.
2. Recargar la página (usuario recurrente):
   - Carga el video 1080p nativo de inmediato en bucle fluido de fondo detrás de los botones.
