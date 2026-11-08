# Especificación de Diseño: Reserva Multi-Servicio («Bolsa de Tratamientos») y Comisiones Flexibles en Caja

**Fecha:** 2026-11-07  
**Estado:** Propuesto (En revisión)  
**Proyecto:** Catheryne Ríos Estética  
**Autor:** Antigravity AI & Catheryne Ríos Estética Team  

---

## 1. Contexto y Objetivos

En una estética integral, las clientas suelen agendar múltiples tratamientos complementarios en una misma visita (por ejemplo: *Uñas Acrílicas + Lifting de Pestañas + Limpieza Facial Profunda*).

### Objetivos Principales:
1. **Experiencia Multi-Servicio («Bolsa de Tratamientos»):** Permitir a la clienta seleccionar 1 o varios tratamientos de cualquier categoría de forma fluida y visual.
2. **Cálculo de Bloque Continuo Sin Cruces:** Sumar duraciones reales de todos los tratamientos seleccionados y ofrecer únicamente horarios donde quepa el bloque completo continuo sin colisionar con citas existentes ni horarios de descanso.
3. **Asignación Inteligente de Especialista:** Permitir elegir una especialista específica o seleccionar **«Cualquiera (Asignación Automática)»**, la cual balancea la carga asignando a la especialista con menor volumen de citas en ese día.
4. **Comisiones Variables en Caja (`ConfirmSaleModal.jsx`):** Ofrecer al personal de recepción un selector dual (`%` o `$ COP`) para fijar o ajustar la comisión de la especialista en el momento exacto del cobro de la cita, reflejando el cálculo en tiempo real y persistiendo en la contabilidad.
5. **Regla de Terminología:** Queda estrictamente estandarizado el uso de **«Estética»** / **«Catheryne Ríos Estética»** en toda la interfaz y comunicación; nunca se usará el término "spa".

---

## 2. Arquitectura de Datos y Flujo de Reserva

### 2.1. Estructura de la Cita Multi-Servicio
```typescript
interface MultiServiceBooking {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceIds: string[];         // IDs de los tratamientos seleccionados
  serviceName: string;          // Ej: "Uñas Esculpidas + Lifting Pestañas"
  servicesBreakdown: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
  totalDuration: number;        // Suma de duraciones en minutos (ej: 135 min)
  price: number;                // Suma de precios en COP (ej: 180000)
  date: string;                 // YYYY-MM-DD
  time: string;                 // Hora de inicio (ej: "10:00 AM")
  endTime: string;              // Hora estimada de fin (ej: "12:15 PM")
  specialistId: string;         // ID de la especialista asignada
  specialistName: string;
  notes?: string;
  status: 'Confirmada' | 'Pagada' | 'Cancelada';
  commissionRate?: number;      // % pactado en caja al cobrar
  commissionAmount?: number;    // $ COP neto ganado por la especialista
}
```

---

## 3. Experiencia de Usuario en Reserva (`Booking.jsx`)

### 3.1. Selección de Tratamientos («Bolsa de Tratamientos»)
- Las tarjetas de servicios cuentan con un botón de selección interactivo `[ + Agregar ]` / `[ ✓ Seleccionado ]`.
- Soporta selección combinada entre categorías (ej: Cejas, Uñas, Faciales, Corporales).
- Al seleccionar al menos un servicio, emerge una **Barra Flotante Dorada (Sticky Bottom Bar)** de diseño exclusivo:
  ```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ✦ 3 Tratamientos • 2h 15m • $185.000 COP          [ Ver Bolsa | Continuar → ] │
  └────────────────────────────────────────────────────────────────────────┘
  ```
- Al tocar "Ver Bolsa", un drawer/modal compacto permite ver el desglose detallado, eliminar un tratamiento individual o ver la duración total acumulada.

### 3.2. Selector de Especialista: Específica o Inteligente
- **Opción Recomendada (Top):**
  - Card destacada: **`✦ Cualquiera (Asignación Automática)`** con etiqueta dorada *"Mayor disponibilidad y balance de citas"*.
  - Si la clienta la elige, el backend calcula la especialista que tiene el bloque libre y que tiene menor número de citas agendadas ese día.
- **Opción Específica:**
  - Cards individuales de cada especialista (Catheryne Ríos, etc.) con foto, especialidad y estado de disponibilidad.

### 3.3. Algoritmo de Bloque Continuo de Horarios
- Total de minutos = `servicios.reduce((acc, s) => acc + s.duration, 0)`.
- Si el negocio abre de 8:00 AM a 6:00 PM (10 horas = 600 min), el sistema genera ranuras cada 15 o 30 minutos (ej: 8:00, 8:30, 9:00...).
- Para cada horario `H`:
  - `Fin = H + TotalMinutos`.
  - Se valida que `Fin <= HoraCierreNegocio`.
  - Se valida que ningún minuto del intervalo `[H, Fin]` colisione con citas ya existentes de la especialista (o de la seleccionada en "Cualquiera") ni con bloqueos de agenda.
- Si colisiona, ese botón de hora se desactiva visualmente o no se muestra, garantizando **cero riesgo de citas sobrepuestas**.

---

## 4. Cobro en Caja y Comisión Flexible (`ConfirmSaleModal.jsx`)

### 4.1. Interfaz Dual de Comisión
En el modal de cobro y confirmación de venta:
1. **Sección Especialista:**
   - Muestra el nombre de la especialista que realizó la atención.
   - Switch / Selector de modo: `[ % Porcentaje ]` o `[ $ Valor Fijo ]`.
2. **Chips Rápidos de Porcentaje:**
   - Botones rápidos: `[ 30% ]` `[ 40% ]` `[ 50% ]`.
   - Campo numérico editable para cualquier otro porcentaje (ej: `35%`, `45%`, `60%`).
3. **Entrada de Valor Fijo COP:**
   - Permite escribir directamente una cifra en dinero (ej: `$45.000`).
   - El sistema calcula y muestra instantáneamente a qué porcentaje equivale esa cifra sobre el total del servicio.
4. **Desglose en Vivo (Live Preview):**
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │ Total a Cobrar:                       $120.000 COP           │
   │ ──────────────────────────────────────────────────────────── │
   │ 👩‍⚕️ Comisión Especialista (40%):       $48.000 COP            │
   │ 🏢 Margen Neto Estética (60%):          $72.000 COP            │
   └──────────────────────────────────────────────────────────────┘
   ```
5. **Persistencia Contable:**
   - Al hacer clic en **"Cobrar & Generar Recibo"**, se emite el comprobante para WhatsApp y se guarda la cita con su `commissionRate` y `commissionAmount` reales.
   - La vista de **Liquidación de Especialistas** y la **Agenda** usan este valor real exacto, evitando discrepancias de caja.

---

## 5. Arquitectura Backend & Concurrencia

### 5.1. Endpoints
- **`GET /api/appointments/availability`**
  - Parámetros: `date` (YYYY-MM-DD), `duration` (minutos totales), `specialistId` (opcional o 'any').
  - Retorna: Lista de horarios de inicio viables y la especialista recomendada en caso de modo automático.
- **`POST /api/appointments/book`**
  - Payload con validación Zod/NestJS DTO.
  - Verificación atómica de colisión antes del commit en PostgreSQL.

### 5.2. Contingencia Offline / WhatsApp
- Si el backend experimentara intermitencia de red móvil en el dispositivo de la clienta, el botón de contingencia de WhatsApp se activa de inmediato con el mensaje preformateado:
  *"Hola Catheryne Ríos Estética, deseo confirmar mi cita para [Tratamientos] el día [Fecha] a las [Hora]..."*

---

## 6. Criterios de Aceptación y Pruebas
1. Una clienta puede seleccionar 3 tratamientos distintos en `Booking.jsx` y ver el total en la barra dorada flotante.
2. Al seleccionar fecha, solo aparecen horas donde el bloque completo de 2h+ esté 100% libre.
3. Si selecciona "Cualquiera", el sistema asigna automáticamente a la especialista con menos citas de ese día.
4. En `ConfirmSaleModal.jsx`, la administradora puede ingresar tanto porcentaje (%) como valor en pesos ($ COP) y ver el margen de la estética al instante.
5. Al cobrar, el recibo digital y WhatsApp reflejan el desglose y la cita queda registrada como pagada con su comisión calculada.
6. En ninguna pantalla, modal o mensaje aparece la palabra "spa", manteniendo siempre "estética".
