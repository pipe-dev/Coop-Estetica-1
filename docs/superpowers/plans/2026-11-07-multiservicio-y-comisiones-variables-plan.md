# Plan de Implementación: Reserva Multi-Servicio («Bolsa de Tratamientos») y Comisiones Variables en Caja

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Catheryne Ríos Estética la selección simultánea de múltiples tratamientos con cálculo continuo de horarios sin choques, asignación inteligente de especialistas ("Cualquiera / Balance de Carga"), y cobro en caja con ajuste dual de comisión (% o $ COP) en `ConfirmSaleModal.jsx`.

**Architecture:** 
- **Backend (NestJS + Prisma):** Extender `AppointmentsService` con endpoint `/api/appointments/availability` para validación de bloques continuos y auto-asignación por balance de citas. Soporte para múltiples servicios en `/api/appointments/book` y actualización de comisiones pactadas en `PATCH /api/appointments/:id/status`.
- **Frontend (React + Vite + Framer Motion):** Rediseñar el flujo de reserva en `Booking.jsx` con «Bolsa de Tratamientos», barra flotante dorada inferior (*Sticky Luxury Bar*) y drawer de resumen. Actualizar `ConfirmSaleModal.jsx` con selector dual interactivo (% / $ COP) que se sincroniza en vivo con el margen de la estética y persiste en la liquidación diaria.

**Tech Stack:** React 19, Vite, Framer Motion, Lucide Icons, NestJS, Prisma ORM, PostgreSQL (Supabase), TypeScript.

## Global Constraints

- **Nombre y Marca:** Uso estricto de **«Catheryne Ríos Estética»**; terminantemente prohibido el uso del término "spa" en toda la interfaz, mensajes y código.
- **Identidad Visual:** Paleta de lujo carbón y oro pulido (`#D4AF37`, `#DFBA44`), tipografías Playfair Display / Cinzel y Montserrat.
- **Compatibilidad Hacia Atrás:** Reservas de un solo servicio siguen funcionando sin ninguna alteración en la base de datos ni en el API.
- **Responsividad:** 100% adaptable a teléfonos móviles (desde 320px de ancho) con botones táctiles generosos (mínimo 44px).

---

### Task 1: Backend - Disponibilidad de Bloques Continuos y Soporte Multi-Servicio

**Files:**
- Modify: `backend/src/appointments/appointments.service.ts`
- Modify: `backend/src/appointments/appointments.controller.ts`
- Test: `backend/test/availability-multiservice.spec.ts`

**Interfaces:**
- Consumes: `prisma.appointment`, `prisma.service`, `prisma.teamMember`.
- Produces: 
  - `getAvailability(date: string, durationMinutes: number, specialistId?: string): Promise<{ availableSlots: string[], suggestedSpecialistId?: string }>`
  - `bookAppointment(data: { clientName, clientPhone, clientEmail?, serviceIds?: string[], serviceId?: string, specialistId: string, date, time, notes? })`

- [ ] **Step 1: Crear prueba automatizada para cálculo de disponibilidad continua**

Crear `backend/test/availability-multiservice.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppointmentsService - Disponibilidad y Multi-Servicio', () => {
  let service: AppointmentsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'test-app-1', ...data })),
            },
            service: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'srv-1', name: 'Uñas Acrílicas', price: 90000, duration: 60, active: true },
                { id: 'srv-2', name: 'Lifting Pestañas', price: 60000, duration: 45, active: true },
              ]),
              findUnique: jest.fn().mockResolvedValue({ id: 'srv-1', name: 'Uñas Acrílicas', price: 90000, duration: 60, active: true }),
            },
            teamMember: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'spec-1', name: 'Catheryne Ríos', active: true, commissionRate: 45 },
                { id: 'spec-2', name: 'Valentina Spa', active: true, commissionRate: 40 },
              ]),
              findUnique: jest.fn().mockResolvedValue({ id: 'spec-1', name: 'Catheryne Ríos', active: true, commissionRate: 45 }),
            },
            client: {
              upsert: jest.fn().mockResolvedValue({ id: 'cli-1', name: 'María Gómez', phone: '3001234567' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('debe calcular los slots de inicio disponibles para una duración de 105 minutos', async () => {
    const result = await service.getAvailability('2026-11-20', 105, 'spec-1');
    expect(result).toHaveProperty('availableSlots');
    expect(Array.isArray(result.availableSlots)).toBe(true);
    expect(result.availableSlots.length).toBeGreaterThan(0);
  });

  it('debe soportar bookAppointment con múltiples serviceIds', async () => {
    const booking = await service.bookAppointment({
      clientName: 'María Gómez',
      clientPhone: '3001234567',
      serviceIds: ['srv-1', 'srv-2'],
      serviceId: 'srv-1',
      specialistId: 'spec-1',
      date: '2026-11-20',
      time: '10:00 AM',
    });

    expect(booking).toBeDefined();
    expect(booking.serviceName).toContain('Uñas Acrílicas');
    expect(booking.serviceName).toContain('Lifting Pestañas');
    expect(booking.price).toBe(150000);
  });
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falla**

Ejecutar en terminal:
```powershell
npm test --prefix backend backend/test/availability-multiservice.spec.ts
```
Resultado esperado: FAIL (método `getAvailability` no existe).

- [ ] **Step 3: Implementar `getAvailability` y soporte multi-servicio en `AppointmentsService` y `AppointmentsController`**

En `backend/src/appointments/appointments.service.ts`, agregar la función de cálculo de bloques y auto-asignación:
```typescript
  // ----------------------------------------------------
  // DISPONIBILIDAD EN BLOQUE CONTINUO & AUTO-ASIGNACIÓN
  // ----------------------------------------------------
  async getAvailability(date: string, durationMinutes = 60, specialistId?: string) {
    const allSpecialists = await this.prisma.teamMember.findMany({
      where: { active: true },
    });

    const isAny = !specialistId || specialistId === 'any';
    const targetSpecialists = isAny ? allSpecialists : allSpecialists.filter(s => s.id === specialistId);

    if (targetSpecialists.length === 0) {
      return { availableSlots: [], suggestedSpecialistId: null };
    }

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        date,
        status: { notIn: ['Cancelada'] },
        specialistId: { in: targetSpecialists.map(s => s.id) },
      },
    });

    // Horario laboral: 8:00 AM (480 min) a 7:00 PM (1140 min)
    const openTimeMin = 8 * 60;
    const closeTimeMin = 19 * 60;
    const intervalStep = 30; // ranuras cada 30 min

    const parseTimeToMinutes = (tStr: string) => {
      const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 540;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const formatMinutesTo12h = (totalMins: number) => {
      let h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const validSlotsSet = new Set<string>();

    for (let current = openTimeMin; current + durationMinutes <= closeTimeMin; current += intervalStep) {
      const slotEnd = current + durationMinutes;

      // Verificar si al menos una de las especialistas tiene libre este bloque continuo
      const freeSpecialist = targetSpecialists.find(spec => {
        const specApps = existingAppointments.filter(a => a.specialistId === spec.id);
        const hasCollision = specApps.some(app => {
          const appStart = parseTimeToMinutes(app.time);
          const appEnd = appStart + 60; // Asume 60 min por cita existente si no especifica
          return Math.max(current, appStart) < Math.min(slotEnd, appEnd);
        });
        return !hasCollision;
      });

      if (freeSpecialist) {
        validSlotsSet.add(formatMinutesTo12h(current));
      }
    }

    // Auto-selección inteligente: Especialista con menor carga ese día
    let suggestedSpecialistId = targetSpecialists[0]?.id;
    if (isAny && targetSpecialists.length > 0) {
      const counts: Record<string, number> = {};
      targetSpecialists.forEach(s => { counts[s.id] = 0; });
      existingAppointments.forEach(a => {
        if (counts[a.specialistId] !== undefined) counts[a.specialistId]++;
      });

      suggestedSpecialistId = targetSpecialists.reduce((prev, curr) => {
        return (counts[curr.id] || 0) < (counts[prev.id] || 0) ? curr : prev;
      }, targetSpecialists[0]).id;
    }

    return {
      availableSlots: Array.from(validSlotsSet),
      suggestedSpecialistId,
    };
  }
```

En `backend/src/appointments/appointments.controller.ts`, exponer el endpoint:
```typescript
  @Throttle({ short: { limit: 10, ttl: 60000 }, medium: { limit: 30, ttl: 300000 } })
  @Get('availability')
  async getAvailability(
    @Query('date') date: string,
    @Query('duration') duration?: string,
    @Query('specialistId') specialistId?: string,
  ) {
    return this.appointmentsService.getAvailability(date, Number(duration) || 60, specialistId);
  }
```

- [ ] **Step 4: Re-ejecutar pruebas y verificar que pasan**

```powershell
npm test --prefix backend backend/test/availability-multiservice.spec.ts
```
Resultado esperado: PASS (todos los tests pasan).

- [ ] **Step 5: Commit cambios del Task 1**

```powershell
git add backend/src/appointments/ backend/test/availability-multiservice.spec.ts
git commit -m "feat(backend): add continuous block availability and multi-service booking support"
```

---

### Task 2: Backend - Persistencia de Comisiones Personalizadas en el Cobro

**Files:**
- Modify: `backend/src/appointments/appointments.service.ts`
- Modify: `backend/src/appointments/appointments.controller.ts`

**Interfaces:**
- Consumes: `PATCH /api/appointments/:id/status`
- Produces: Actualización atómica en base de datos de `status`, `commissionAmount` y auditoría en `Appointment`.

- [ ] **Step 1: Actualizar `updateStatus` en `AppointmentsService` para recibir comisión opcional**

En `backend/src/appointments/appointments.service.ts`:
```typescript
  async updateStatus(
    id: string,
    status: string,
    user?: any,
    extraData?: { commissionAmount?: number; commissionRate?: number; paymentMethod?: string }
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cita no encontrada.');
    }

    const updatePayload: any = { status };
    if (extraData?.commissionAmount !== undefined) {
      updatePayload.commissionAmount = Number(extraData.commissionAmount);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updatePayload,
    });

    return updated;
  }
```

- [ ] **Step 2: Actualizar `AppointmentsController` para aceptar el body extendido**

En `backend/src/appointments/appointments.controller.ts`:
```typescript
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; commissionAmount?: number; commissionRate?: number; paymentMethod?: string },
    @Request() req: any
  ) {
    return this.appointmentsService.updateStatus(id, body.status, req.user, body);
  }
```

- [ ] **Step 3: Verificar compilación en el backend**

```powershell
npm run --prefix backend build
```
Resultado esperado: Build exitoso sin errores de tipos.

- [ ] **Step 4: Commit cambios del Task 2**

```powershell
git add backend/src/appointments/
git commit -m "feat(backend): support variable commission update when marking appointment as paid"
```

---

### Task 3: Frontend - Selector Dual de Comisiones en `ConfirmSaleModal.jsx`

**Files:**
- Modify: `frontend/src/components/admin/ConfirmSaleModal.jsx`
- Modify: `frontend/src/components/admin/ConfirmSaleModal.module.css`

**Interfaces:**
- Consumes: `appointment` (`specialistName`, `price`, `specialistRate`), `onConfirm`.
- Produces: `onConfirm({ appointmentId, paymentMethod, totalPrice, cashReceived, changeToGive, notes, receiptNo, commissionRate, commissionAmount })`.

- [ ] **Step 1: Agregar el estado de comisión dual sincronizada en `ConfirmSaleModal.jsx`**

En `frontend/src/components/admin/ConfirmSaleModal.jsx`:
- Inicializar `commissionMode`: `'percent'` | `'amount'`.
- Inicializar `commissionRate`: `appointment.specialistRate || 40`.
- Calcular `commissionAmount`: `Math.round((totalPrice * commissionRate) / 100)`.
- Manejadores de sincronización mutua:
  - Al cambiar `%`: calcular `$ COP` = `Math.round((totalPrice * val) / 100)`.
  - Al cambiar `$ COP`: calcular `%` = `Number(((val / (totalPrice || 1)) * 100).toFixed(1))`.
- Chips rápidos: `[ 30% ]`, `[ 40% ]`, `[ 50% ]`, `[ Valor Fijo ]`.
- Desglose en vivo:
  - Ganancia Especialista: `$commissionAmount COP`
  - Margen Estética: `$(totalPrice - commissionAmount) COP`

- [ ] **Step 2: Estilizar la sección de comisión en `ConfirmSaleModal.module.css`**

Agregar estilos de lujo negro carbón con bordes dorados, inputs numéricos limpios y badges de ganancia.

- [ ] **Step 3: Transmitir los datos al presionar "Cobrar & Generar Recibo"**

Asegurar que `onConfirm` reciba:
```javascript
onConfirm({
  appointmentId: appointment.id,
  paymentMethod,
  totalPrice,
  cashReceived: paymentMethod === 'Efectivo' ? receivedVal : totalPrice,
  changeToGive: paymentMethod === 'Efectivo' ? Math.max(0, changeToGive) : 0,
  notes,
  receiptNo,
  commissionRate,
  commissionAmount
})
```

- [ ] **Step 4: Verificar en desarrollo que no existan errores de sintaxis**

```powershell
npm run --prefix frontend build
```
Resultado esperado: Build sin errores.

- [ ] **Step 5: Commit cambios del Task 3**

```powershell
git add frontend/src/components/admin/ConfirmSaleModal.*
git commit -m "feat(frontend): add synchronized dual commission selector to ConfirmSaleModal"
```

---

### Task 4: Frontend - Integración con Agenda y Métricas de Liquidación

**Files:**
- Modify: `frontend/src/pages/admin/AdminAgenda.jsx`
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `frontend/src/context/AdminContext.jsx`

**Interfaces:**
- Consumes: `updateAppointmentStatus(id, 'Pagada', { commissionAmount, commissionRate })`.
- Produces: Actualización inmediata en el cálculo de `specialistNetToday` y en transacciones contables.

- [ ] **Step 1: Extender `updateAppointmentStatus` en `AdminContext.jsx`**

Permitir que acepte `extraData` con `commissionAmount`:
```javascript
const updateAppointmentStatus = (id, newStatus, extraData = {}) => {
  setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, ...extraData } : a))
  api.updateAppointmentStatus(id, newStatus, extraData)
}
```

- [ ] **Step 2: Conectar `handleConfirmSale` en `AdminAgenda.jsx` y `AdminDashboard.jsx`**

Actualizar `handleConfirmSale` para recibir `{ appointmentId, paymentMethod, totalPrice, notes, commissionRate, commissionAmount }` y pasarlos a `updateAppointmentStatus`.

- [ ] **Step 3: Probar compilación del frontend**

```powershell
npm run --prefix frontend build
```
Resultado esperado: PASS.

- [ ] **Step 4: Commit cambios del Task 4**

```powershell
git add frontend/src/pages/admin/AdminAgenda.jsx frontend/src/pages/admin/AdminDashboard.jsx frontend/src/context/AdminContext.jsx
git commit -m "feat(frontend): integrate flexible commissions with daily agenda settlements"
```

---

### Task 5: Frontend - Experiencia Multi-Servicio («Bolsa de Tratamientos») en `Booking.jsx`

**Files:**
- Modify: `frontend/src/pages/Booking.jsx`
- Modify: `frontend/src/pages/Booking.module.css`

**Interfaces:**
- Consumes: `GET /api/appointments/availability?date=...&duration=...&specialistId=...`
- Produces: `POST /api/appointments/book` con `serviceIds: string[]`, `price: number`, `serviceName: string`.

- [ ] **Step 1: Migrar `selectedService` a array `selectedServices` («Bolsa de Tratamientos»)**

En `Booking.jsx`:
- Estado: `const [selectedServices, setSelectedServices] = useState([])`.
- Función `toggleService(service)`: Agrega o remueve el servicio de la bolsa.
- Métricas calculadas:
  - `totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 45), 0)`.
  - `totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)`.

- [ ] **Step 2: Implementar la Barra Flotante Dorada Inferior (Sticky Bar)**

Renderizar al pie de la pantalla cuando `selectedServices.length > 0`:
```jsx
{selectedServices.length > 0 && (
  <motion.div 
    initial={{ y: 80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className={styles.floatingCartBar}
  >
    <div className={styles.cartBarInfo}>
      <span className={styles.cartBadge}>{selectedServices.length} Tratamiento{selectedServices.length > 1 ? 's' : ''}</span>
      <span className={styles.cartDuration}>⏳ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
      <span className={styles.cartTotal}>${totalPrice.toLocaleString()} COP</span>
    </div>
    <button 
      type="button" 
      className={styles.cartContinueBtn}
      onClick={() => setActiveStep(2)}
    >
      <span>Continuar</span>
      <ArrowRight size={18} />
    </button>
  </motion.div>
)}
```

- [ ] **Step 3: Agregar opción de Asignación Inteligente en el selector de Especialistas**

Añadir como primera opción destacada:
- ID: `'any'`
- Título: **`✦ Cualquiera (Asignación Automática)`**
- Subtítulo: *"Te asignamos a la profesional disponible con mejor horario y menor espera"*.

- [ ] **Step 4: Conectar la consulta de horarios continuos con la duración total**

Al seleccionar fecha en el Paso 3, consultar `api.getAvailability(selectedDate, totalDuration, selectedSpecialistId)`.
Mostrar únicamente las horas donde el bloque completo está disponible.

- [ ] **Step 5: Enviar la reserva multi-servicio al backend**

En `handleConfirmBooking`:
```javascript
const payload = {
  clientName: clientName.trim(),
  clientPhone: clientPhone.trim(),
  clientEmail: clientEmail.trim() || undefined,
  serviceIds: selectedServices.map(s => s.id),
  serviceId: selectedServices[0]?.id,
  serviceName: selectedServices.map(s => s.name).join(' + '),
  specialistId: booking.specialist === 'any' ? suggestedSpecialistId : booking.specialist,
  date: booking.date,
  time: booking.time,
  price: totalPrice,
}
```

- [ ] **Step 6: Verificar build del frontend**

```powershell
npm run --prefix frontend build
```
Resultado esperado: Build exitoso.

- [ ] **Step 7: Commit cambios del Task 5**

```powershell
git add frontend/src/pages/Booking.*
git commit -m "feat(frontend): implement multi-service bag and continuous booking in Booking.jsx"
```

---

### Task 6: Verificación Integral End-to-End & Auditoría de Marca

**Files:**
- Create: `backend/test/e2e-multiservice-booking.ts`

- [ ] **Step 1: Ejecutar script de prueba E2E de reserva multiservicio y cobro con comisión variable**

Ejecutar script contra el backend para comprobar:
1. Consulta de disponibilidad continua de 105 min.
2. Reserva atómica de 2 servicios simultáneos.
3. Actualización de cita como Pagada con comisión del 35% personalizada.

- [ ] **Step 2: Auditoría estricta de términos ("spa" vs "estética")**

Verificar con búsqueda global que no haya reintroducción del término "spa" en ningún archivo nuevo o modificado.
```powershell
Get-ChildItem -Path "frontend/src","backend/src" -Recurse -Include *.jsx,*.ts,*.css | Select-String -Pattern "\bspa\b" -CaseSensitive:$false
```
Resultado esperado: 0 coincidencias.

- [ ] **Step 3: Commit final y Push a GitHub**

```powershell
git add .
git commit -m "chore: complete multi-service booking and flexible commission workflow"
git push origin main
```
