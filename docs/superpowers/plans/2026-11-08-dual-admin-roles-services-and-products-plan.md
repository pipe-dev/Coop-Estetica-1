# Plan de Implementación: Administradores Diferenciados (Servicios vs. Productos) y Control de Acceso RBAC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Catheryne Ríos Estética la separación estricta de perfiles administrativos: `ADMIN_SERVICIOS` (Operaciones, citas, caja, equipo y servicios) y `ADMIN_PRODUCTOS` (Inventario, productos y anuncios web), con PINs diferenciados (`111111` y `222222`), navegación filtrada y guardias de ruta automáticas.

**Architecture:**
- **Backend (NestJS + Prisma):** Extender `BusinessConfig` con `servicesAdminPin` y `productsAdminPin`. Actualizar `AuthService.verifyPin` para emitir tokens JWT con roles `ADMIN_SERVICIOS` o `ADMIN_PRODUCTOS`. Exponer endpoints en `ConfigNegocioController` para actualización de PINs por parte de la propietaria (`OWNER`).
- **Frontend (React 19 + Vite):** Actualizar `AdminSecurityGate.jsx` con los selectores de roles y verificación de PINs. Actualizar `AdminLayout.jsx` con filtrado dinámico de `navItems`, guardias de ruta automáticas con redirección segura y badge de rol en el header. Actualizar `AdminConfiguracion.jsx` con el panel de administración de claves para la Dueña.

**Tech Stack:** React 19, Vite, Framer Motion, Lucide Icons, NestJS, Prisma ORM, PostgreSQL (Supabase), TypeScript.

## Global Constraints

- **Nombre y Marca:** Uso estricto de **«Catheryne Ríos Estética»**; terminantemente prohibido el uso del término "spa" en toda la interfaz, mensajes y código.
- **Identidad Visual:** Paleta de lujo carbón y oro pulido (`#D4AF37`), tipografías Playfair Display / Cinzel y Montserrat.
- **PINs Oficiales por Defecto:**
  - Dueña (`OWNER`): `202626`
  - Admin Servicios (`ADMIN_SERVICIOS`): `111111` (soporta `123456` como fallback)
  - Admin Productos (`ADMIN_PRODUCTOS`): `222222`
  - Especialistas (`SPECIALIST`): `777777`
- **Seguridad y Confidencialidad:** Un rol restringido jamás podrá ver información de caja, citas, o inventario ajeno a su perfil ni por URL directa.

---

### Task 1: Backend - Schema Prisma y Autenticación RBAC en `AuthService`

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/auth/auth.service.ts`
- Test: `backend/test/auth-dual-admin.ts`

**Interfaces:**
- Consumes: `prisma.businessConfig`, `verifyPin(pin: string)`
- Produces: `{ valid: boolean; role: 'OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'SPECIALIST'; accessToken: string }`

- [ ] **Step 1: Crear script de prueba automatizado para verificar autenticación de ambos roles**

Crear `backend/test/auth-dual-admin.ts`:
```typescript
import { AuthService } from '../src/auth/auth.service';

async function testAuth() {
  console.log('--- TEST: Verificación de PINs y Roles Diferenciados ---');

  const mockPrisma: any = {
    businessConfig: {
      findUnique: async () => ({
        id: 'singleton',
        masterPin: '202626',
        servicesAdminPin: '111111',
        productsAdminPin: '222222',
        specialistPin: '777777',
      }),
    },
  };

  const mockJwt: any = {
    sign: (payload: any) => `token-${payload.role}-${Date.now()}`,
  };

  const service = new AuthService(mockPrisma, mockJwt);

  const resServicios = await service.verifyPin('111111');
  console.log('PIN 111111 Rol:', resServicios.role);
  if (resServicios.role !== 'ADMIN_SERVICIOS') {
    throw new Error('FAIL: Esperado ADMIN_SERVICIOS');
  }

  const resProductos = await service.verifyPin('222222');
  console.log('PIN 222222 Rol:', resProductos.role);
  if (resProductos.role !== 'ADMIN_PRODUCTOS') {
    throw new Error('FAIL: Esperado ADMIN_PRODUCTOS');
  }

  const resOwner = await service.verifyPin('202626');
  console.log('PIN 202626 Rol:', resOwner.role);
  if (resOwner.role !== 'OWNER') {
    throw new Error('FAIL: Esperado OWNER');
  }

  console.log('SUCCESS: Autenticación de roles diferenciados funciona correctamente!');
}

testAuth().catch(err => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falla antes de la implementación**

```powershell
npx --prefix backend ts-node backend/test/auth-dual-admin.ts
```
Resultado esperado: FAIL (los nuevos roles aún no existen en `verifyPin`).

- [ ] **Step 3: Actualizar `schema.prisma` y `auth.service.ts`**

En `backend/prisma/schema.prisma`, agregar `servicesAdminPin` y `productsAdminPin` al modelo `BusinessConfig`:
```prisma
  servicesAdminPin     String?   @default("111111")
  productsAdminPin     String?   @default("222222")
```

En `backend/src/auth/auth.service.ts`, actualizar `verifyPin`:
```typescript
  async verifyPin(pin: string): Promise<{ valid: boolean; role?: 'OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'ADMIN' | 'SPECIALIST'; accessToken?: string }> {
    const config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    const trimmed = String(pin).trim();

    let isOwner = false;
    if (trimmed === (config?.masterPin || '202626') || trimmed === '202626') {
      isOwner = true;
    } else if (config?.masterPinHash) {
      isOwner = await bcrypt.compare(trimmed, config.masterPinHash);
    }

    let matchedRole: 'OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'SPECIALIST' | null = null;
    let sub = 'admin-owner';
    let name = 'Catheryne Ríos (Propietaria)';

    if (isOwner) {
      matchedRole = 'OWNER';
      sub = 'admin-owner';
      name = 'Catheryne Ríos (Propietaria)';
    } else if (trimmed === (config?.servicesAdminPin || config?.adminPin || '111111') || trimmed === '111111' || trimmed === '123456') {
      matchedRole = 'ADMIN_SERVICIOS';
      sub = 'staff-admin-servicios';
      name = 'Administradora de Servicios';
    } else if (trimmed === (config?.productsAdminPin || '222222') || trimmed === '222222') {
      matchedRole = 'ADMIN_PRODUCTOS';
      sub = 'staff-admin-productos';
      name = 'Administrador de Productos';
    } else if (trimmed === (config?.specialistPin || '777777') || trimmed === '777777') {
      matchedRole = 'SPECIALIST';
      sub = 'staff-specialist';
      name = 'Especialista';
    }

    if (matchedRole) {
      const payload = { sub, name, role: matchedRole };
      const token = this.jwtService.sign(payload);
      return { valid: true, role: matchedRole, accessToken: token };
    }

    return { valid: false };
  }
```

- [ ] **Step 4: Re-ejecutar la prueba automatizada y verificar que pasa**

```powershell
npx --prefix backend ts-node backend/test/auth-dual-admin.ts
```
Resultado esperado: PASS.

- [ ] **Step 5: Commit cambios del Task 1**

```powershell
git add backend/prisma/schema.prisma backend/src/auth/auth.service.ts backend/test/auth-dual-admin.ts
git commit -m "feat(backend): add dual admin role authentication in auth service"
```

---

### Task 2: Backend - Actualización de PINs de Administradores en `ConfigNegocio`

**Files:**
- Modify: `backend/src/config-negocio/config-negocio.service.ts`
- Modify: `backend/src/config-negocio/config-negocio.controller.ts`

**Interfaces:**
- Consumes: `PATCH /api/config-negocio/pins`
- Produces: Actualización atómica en base de datos de `masterPin`, `servicesAdminPin`, `productsAdminPin` y `specialistPin`.

- [ ] **Step 1: Extender `updatePins` en `ConfigNegocioService`**

Permitir actualizar `servicesAdminPin` y `productsAdminPin` de forma validada (exactamente 6 dígitos).

- [ ] **Step 2: Exponer el endpoint protegido para la Dueña en `ConfigNegocioController`**

Asegurar que solo un usuario con rol `OWNER` pueda invocar la actualización de claves.

- [ ] **Step 3: Compilar y verificar types en el backend**

```powershell
npm run --prefix backend build
```
Resultado esperado: Build exitoso sin errores.

- [ ] **Step 4: Commit cambios del Task 2**

```powershell
git add backend/src/config-negocio/
git commit -m "feat(backend): support updating services and products admin pins in config service"
```

---

### Task 3: Frontend - Pantalla de Entrada de Seguridad (`AdminSecurityGate.jsx`)

**Files:**
- Modify: `frontend/src/components/admin/AdminSecurityGate.jsx`
- Modify: `frontend/src/components/admin/AdminSecurityGate.module.css`

**Interfaces:**
- Consumes: `api.verifyPin(input)`, `currentUserRole`, `setCurrentUserRole`
- Produces: Autenticación instantánea guardando rol en `sessionStorage` y `localStorage`.

- [ ] **Step 1: Agregar chips de presets para los 4 roles en `AdminSecurityGate.jsx`**

Añadir selectores rápidos:
- `[ 👑 Dueña ]`
- `[ ✂️ Admin Servicios ]`
- `[ 🛍️ Admin Productos ]`
- `[ 👩‍⚕️ Especialista ]`

- [ ] **Step 2: Configurar el fallback offline para `111111` y `222222`**

Asegurar que si Render o la red se desconectan temporalmente, el PIN `111111` asigne `ADMIN_SERVICIOS` y `222222` asigne `ADMIN_PRODUCTOS`.

- [ ] **Step 3: Redirección automática inicial según el rol**

- `ADMIN_SERVICIOS` ➔ `/admin/agenda`
- `ADMIN_PRODUCTOS` ➔ `/admin/productos`
- `SPECIALIST` ➔ `/admin/agenda`
- `OWNER` ➔ `/admin`

- [ ] **Step 4: Probar build de frontend**

```powershell
npm run --prefix frontend build
```

- [ ] **Step 5: Commit cambios del Task 3**

```powershell
git add frontend/src/components/admin/AdminSecurityGate.*
git commit -m "feat(frontend): add role selectors and dual admin authentication in security gate"
```

---

### Task 4: Frontend - Navegación Dinámica y Guardia de Rutas (`AdminLayout.jsx`)

**Files:**
- Modify: `frontend/src/components/admin/AdminLayout.jsx`
- Modify: `frontend/src/components/admin/AdminLayout.module.css`

**Interfaces:**
- Consumes: `currentUserRole` ('OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'ADMIN' | 'SPECIALIST')
- Produces: Filtrado estricto de `navItems`, redirección anti-intrusión y badge de rol visual.

- [ ] **Step 1: Implementar filtrado de `navItems` por rol**

```javascript
  const visibleNavItems = navItems.filter(item => {
    if (currentUserRole === 'SPECIALIST') {
      return item.path === '/admin/agenda' || item.path === '/admin/historial'
    }
    if (currentUserRole === 'ADMIN_SERVICIOS') {
      return ['/admin', '/admin/agenda', '/admin/caja', '/admin/historial', '/admin/clientes', '/admin/equipo', '/admin/servicios'].includes(item.path)
    }
    if (currentUserRole === 'ADMIN_PRODUCTOS') {
      return ['/admin', '/admin/productos', '/admin/notificaciones'].includes(item.path)
    }
    if (currentUserRole === 'ADMIN') {
      return item.path !== '/admin/configuracion' && item.path !== '/admin/telemetria'
    }
    return true // OWNER tiene todo
  })
```

- [ ] **Step 2: Implementar Guardia Estricta de Rutas (Strict Route Guard)**

Si un `ADMIN_PRODUCTOS` intenta abrir `/admin/caja` o `/admin/agenda`, redirigir inmediatamente a `/admin/productos`.
Si un `ADMIN_SERVICIOS` intenta abrir `/admin/productos` o `/admin/notificaciones`, redirigir a `/admin/agenda`.
Si una `SPECIALIST` intenta abrir cualquier ruta distinta de agenda o historial, redirigir a `/admin/agenda`.

- [ ] **Step 3: Agregar Badge de Rol en la barra superior (Header)**

Mostrar la insignia correspondiente:
- 👑 *Catheryne Ríos (Dueña)*
- ✂️ *Admin Servicios*
- 🛍️ *Admin Productos*
- 👩‍⚕️ *Especialista: [Nombre]*

- [ ] **Step 4: Probar compilación del frontend**

```powershell
npm run --prefix frontend build
```

- [ ] **Step 5: Commit cambios del Task 4**

```powershell
git add frontend/src/components/admin/AdminLayout.*
git commit -m "feat(frontend): enforce dynamic navigation and strict route guards for dual admins"
```

---

### Task 5: Frontend - Panel de Gestión de PINs en `AdminConfiguracion.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/AdminConfiguracion.jsx`

**Interfaces:**
- Consumes: `businessConfig.servicesAdminPin`, `businessConfig.productsAdminPin`, `businessConfig.masterPin`, `businessConfig.specialistPin`
- Produces: Formulario con guardado atómico de claves para la Dueña.

- [ ] **Step 1: Agregar inputs para PIN de Servicios y PIN de Productos en `AdminConfiguracion.jsx`**

En la sección "Seguridad & Claves de Acceso", mostrar 4 tarjetas/campos con icono, título y descripción:
1. Clave Maestra Dueña (`masterPin`)
2. Clave Administrador de Servicios (`servicesAdminPin`)
3. Clave Administrador de Productos (`productsAdminPin`)
4. Clave Especialistas (`specialistPin`)

- [ ] **Step 2: Conectar el guardado de claves con el backend / estado global**

- [ ] **Step 3: Probar compilación del frontend**

```powershell
npm run --prefix frontend build
```

- [ ] **Step 4: Commit cambios del Task 5**

```powershell
git add frontend/src/pages/admin/AdminConfiguracion.jsx
git commit -m "feat(frontend): allow owner to manage services and products admin pins in settings"
```

---

### Task 6: Verificación E2E Integral y Auditoría de Marca

**Files:**
- Create: `backend/test/e2e-dual-admin.ts`

- [ ] **Step 1: Ejecutar script de verificación E2E de autenticación y permisos**

Comprobar que:
1. PIN `111111` emite rol `ADMIN_SERVICIOS`.
2. PIN `222222` emite rol `ADMIN_PRODUCTOS`.
3. PIN `202626` emite rol `OWNER`.
4. PIN `777777` emite rol `SPECIALIST`.

- [ ] **Step 2: Auditoría estricta de términos ("spa" vs "estética")**

Verificar que se mantenga en 0 coincidencias el término "spa".

- [ ] **Step 3: Commit final y Push a GitHub**

```powershell
git add .
git commit -m "chore: complete dual admin roles implementation and verification"
git push origin main
```
