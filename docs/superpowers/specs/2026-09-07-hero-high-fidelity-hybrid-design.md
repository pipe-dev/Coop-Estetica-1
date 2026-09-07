# Especificación de Diseño: Hero Híbrido de Alta Fidelidad (Canvas WebP + Video 1080p)

**Fecha:** 2026-09-07  
**Estado:** Aprobado para Planificación  
**Proyecto:** Catheryne Ríos Estética — Frontend Web  

---

## 1. Contexto y Problema

### 1.1 Contexto
La página principal de *Catheryne Ríos Estética* cuenta con una experiencia dividida en dos estados:
1. **Primer Hero (Storytelling para nuevos visitantes):** Una experiencia cinematográfica en la que el usuario desliza la pantalla a través de un scrollTrigger que sincroniza el avance de las frases de marca con la animación de fondo, revelando la insignia dorada metálica "CR" sobre una superficie texturizada de cuero oscuro.
2. **Segundo Hero (Usuario recurrente):** Un estado estático directo de 100vh donde el fondo reproduce continuamente la ambientación en bucle y se despliega la consola de acceso rápido a citas, tienda y catálogo de servicios.

### 1.2 Diagnóstico del Problema
Al intentar reducir drásticamente el peso del archivo de video inicial (de 26.3 MB a 1.5 MB) con una tasa de bits de 1400 kbps y un intervalo forzado de fotogramas clave (`-g 5`), el codificador H.264 descartó los detalles finos de las bajas luces. Esto provocó:
* **Banding y Macrobloques severos:** Degradados oscuros y textura de cuero pixelados con artefactos en bloque notables alrededor del logo dorado.
* **Fricción de decodificación en móviles:** La API `<video>.currentTime` genera latencia de búsqueda (seeking latency) en navegadores móviles durante el scroll rápido.

---

## 2. Solución Arquitectónica Propuesta

Implementar una **arquitectura híbrida de dos niveles** inspirada en el estándar de interacción visual de marcas de alta gama (Apple, Porsche):

```
┌─────────────────────────────────────────────────────────────┐
│                    HOME HERO CONTROLLER                     │
├──────────────────────────────┬──────────────────────────────┤
│  Nuevo Visitante             │  Usuario Recurrente          │
│  (!isReturningUser)          │  (isReturningUser === true)  │
├──────────────────────────────┼──────────────────────────────┤
│  CANVAS WEBP SEQUENCE        │  NATIVE 1080p MP4 VIDEO      │
│  • 75 fotogramas WebP 1080p  │  • Video 1080p (CRF 20)      │
│  • Cero macrobloques/banding │  • Flag `-tune film`         │
│  • 60/120 FPS al scroll      │  • Bucle nativo por hardware │
│  • Latencia de seek: 0 ms    │  • Cero carga en CPU/JS      │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 3. Pipeline de Generación de Medios (Assets)

### 3.1 Asset A: Secuencia de Fotogramas WebP (Primer Hero)
* **Origen:** Secuencia de 8 segundos del video original en alta definición.
* **Parámetros de extracción:**
  * Formato: WebP (`-c:v libwebp`)
  * Calidad: `q:v 85` (calidad fotográfica sin pérdida visible en degradados oscuros)
  * Resolución: 1920x1080 nativo
  * Tasa de muestreo: ~9.375 fps (75 fotogramas uniformemente distribuidos a lo largo de los 8 segundos)
  * Directorio de destino: `frontend/public/frames/hero/frame_%03d.webp` (75 archivos de ~30 KB cada uno, total ~2.2 MB).

### 3.2 Asset B: Video 1080p Cinematográfico (Segundo Hero)
* **Origen:** Video de 16 segundos con ida y vuelta fluida (ping-pong nativo).
* **Parámetros de codificación:**
  * Códec: H.264 High Profile (`libx264`)
  * Resolución: 1920x1080
  * Calidad: `CRF 20`
  * Optimización de textura: `-tune film` (preserva grano fino y elimina macrobloques en negros)
  * Streaming: `-movflags +faststart`
  * Archivo de destino: `frontend/public/videos/hero_loop.mp4` (~4.8 MB).

---

## 4. Componentes y Flujo de Datos en Frontend

### 4.1 Hook de Precarga de Fotogramas (`useFramePreloader`)
* Precarga incremental de los 75 fotogramas WebP como objetos `HTMLImageElement` en memoria.
* **Priorización:** Carga inmediata de los primeros 10 fotogramas para garantizar inicio instantáneo; los 65 fotogramas restantes se cargan en segundo plano usando `requestIdleCallback` o ráfagas asíncronas para no saturar la red ni bloquear el renderizado principal.

### 4.2 Renderizador en Canvas (`HeroCanvas`)
* Sustituye al elemento `<video>` cuando `!isReturningUser`.
* **Sincronización con Scroll:**
  $$\text{targetIndex} = \min(74, \max(0, \lfloor \text{latest} \times 74 \rfloor))$$
* **Dibujo en GPU:** Dibuja el cuadro mediante `ctx.drawImage()`, adaptado al `devicePixelRatio` del dispositivo (tope de `dpr = 1.5` en dispositivos móviles para optimizar uso de memoria VRAM).
* Mantiene la cortina negra sólida `#000000` con *"Desliza hacia abajo para comenzar"* que se desvanece de `0.00` a `0.08` de scroll.

### 4.3 Reproductor Nativo para Retorno (`HeroVideoLoop`)
* Cuando `isReturningUser` es verdadero, no se cargan fotogramas en el canvas ni se consumen recursos de memoria en imágenes sueltas.
* Se monta directamente el elemento `<video>` con `autoPlay`, `loop`, `muted`, `playsInline` y póster WebP precargado.
* Los botones laterales de agendamiento se muestran fluidamente con una transición de 0.35s.

---

## 5. Control de Calidad y Criterios de Éxito

1. **Cero artefactos de compresión:** La textura oscura de fondo y los detalles dorados no deben mostrar bandas de color (banding) ni bloques pixelados.
2. **Fluidez de scroll a 60 FPS:** Al deslizar rápidamente hacia arriba y hacia abajo en el primer hero, el avance visual debe responder de manera instantánea y continua.
3. **Carga rápida y sin bloqueos:** El primer fotograma debe mostrarse en menos de 100 ms tras ocultarse la cortina negra inicial.
4. **Memoria limpia:** Al cambiar de página (`/servicios`, `/tienda`, etc.) o al activarse el segundo hero, la memoria de los fotogramas del canvas debe liberarse adecuadamente.
