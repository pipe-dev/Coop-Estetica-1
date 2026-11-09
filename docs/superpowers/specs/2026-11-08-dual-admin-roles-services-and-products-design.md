# Especificación de Diseño: Administradores Diferenciados (Servicios vs. Productos) y Control de Acceso RBAC

**Fecha:** 2026-11-08  
**Estado:** Propuesto (En revisión)  
**Proyecto:** Catheryne Ríos Estética  
**Autor:** Antigravity AI & Catheryne Ríos Estética Team  

---

## 1. Contexto y Objetivos

Actualmente el sistema cuenta con un rol de administración genérico (`ADMIN`), el cual permitía acceder a la mayoría de módulos sin diferenciar responsabilidades entre la operación del salón/estética y la gestión comercial de la tienda virtual.

### Objetivos:
1. **Separación de Responsabilidades (RBAC):** Crear dos perfiles administrativos claramente delimitados:
   - **Administrador de Servicios:** Gestión clínica y operativa de la estética (especialistas, citas, caja, servicios, clientas y recordatorios de WhatsApp).
   - **Administrador de Productos:** Gestión comercial de la tienda e inventario (catálogo de productos, stock, marcas, precios y gestión de anuncios/banners web).
2. **Rol Maestro (`OWNER`):** Mantener acceso total e irrestricto para la propietaria (Catheryne Ríos) sobre todos los módulos operativos, comerciales, configuración de claves y auditoría de telemetría.
3. **PINs Independientes de 6 Dígitos:**
   - **Dueña (`OWNER`):** `202626`
   - **Admin Servicios (`ADMIN_SERVICIOS`):** `111111`
   - **Admin Productos (`ADMIN_PRODUCTOS`):** `222222`
   - **Especialistas (`SPECIALIST`):** `777777`
4. **Configuración Dinámica:** Permitir a la Dueña modificar cualquiera de los 4 PINs desde `AdminConfiguracion.jsx`.
5. **Regla de Marca:** Toda la interfaz mantiene estrictamente **«Catheryne Ríos Estética»**; terminantemente prohibido el uso del término "spa".

---

## 2. Matriz de Permisos y Módulos Visibles

| Módulo / Ruta | Dueña (`OWNER`) | Admin Servicios (`ADMIN_SERVICIOS`) | Admin Productos (`ADMIN_PRODUCTOS`) | Especialistas (`SPECIALIST`) |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** (`/admin`) | ✅ Total | ✅ Operativo | ✅ Comercial | ❌ |
| **Agenda & Citas** (`/admin/agenda`) | ✅ | ✅ | ❌ | ✅ (Solo citas propias) |
| **Caja & Finanzas** (`/admin/caja`) | ✅ | ✅ | ❌ | ❌ |
| **Historial & Auditoría** (`/admin/historial`) | ✅ | ✅ | ❌ | ✅ (Solo servicios propios) |
| **Directorio Clientas CRM** (`/admin/clientes`) | ✅ | ✅ | ❌ | ❌ |
| **Equipo & Nómina** (`/admin/equipo`) | ✅ | ✅ | ❌ | ❌ |
| **Catálogo de Servicios** (`/admin/servicios`) | ✅ | ✅ | ❌ | ❌ |
| **Inventario & Productos** (`/admin/productos`) | ✅ | ❌ | ✅ | ❌ |
| **Gestión de Anuncios Web** (`/admin/notificaciones`) | ✅ | ❌ | ✅ | ❌ |
| **Configuración General & Claves** (`/admin/configuracion`) | ✅ | ❌ | ❌ | ❌ |
| **Telemetría & Logs** (`/admin/telemetria`) | ✅ | ❌ | ❌ | ❌ |

---

## 3. Arquitectura Backend & Autenticación

### 3.1. Modelo Prisma (`schema.prisma`)
En el modelo `BusinessConfig`:
```prisma
model BusinessConfig {
  id                   String   @id @default("singleton")
  businessName         String   @default("Catheryne Ríos Estética")
  // ...
  masterPin            String   @default("202626") // PIN Dueña
  servicesAdminPin     String   @default("111111") // PIN Admin Servicios
  productsAdminPin     String   @default("222222") // PIN Admin Productos
  specialistPin        String   @default("777777") // PIN Especialistas
  adminPin             String?  @default("111111") // Alias backward-compatibility
  // ...
}
```

### 3.2. Servicio de Autenticación (`auth.service.ts`)
La función `verifyPin(pin: string)` evaluará:
1. `pin === masterPin || '202626'` ➔ Retorna JWT con rol `OWNER`.
2. `pin === servicesAdminPin || '111111' || '123456'` ➔ Retorna JWT con rol `ADMIN_SERVICIOS`.
3. `pin === productsAdminPin || '222222'` ➔ Retorna JWT con rol `ADMIN_PRODUCTOS`.
4. `pin === specialistPin || '777777'` ➔ Retorna JWT con rol `SPECIALIST`.

---

## 4. Experiencia de Usuario en Frontend

### 4.1. Pantalla de Entrada de Seguridad (`AdminSecurityGate.jsx`)
- Selector de presets visual:
  - `[ 👑 Dueña ]`
  - `[ ✂️ Admin Servicios ]`
  - `[ 🛍️ Admin Productos ]`
  - `[ 👩‍⚕️ Especialista ]`
- Validación de PIN de 6 dígitos con soporte resiliente online/offline.
- Redirección automática a la vista principal correspondiente al rol autenticado:
  - `ADMIN_SERVICIOS` ➔ `/admin/agenda` (o `/admin`).
  - `ADMIN_PRODUCTOS` ➔ `/admin/productos`.
  - `SPECIALIST` ➔ `/admin/agenda`.
  - `OWNER` ➔ `/admin`.

### 4.2. Barra Lateral y Navegación Dinámica (`AdminLayout.jsx`)
- Filtra `navItems` de acuerdo al `currentUserRole`.
- **Guardia de rutas estricta (Strict Route Guard):** Si un usuario intenta escribir manualmente en la URL una ruta no autorizada (por ejemplo, el Admin de Productos ingresando a `/admin/caja`), el sistema lo redirige de inmediato a su vista autorizada (`/admin/productos`), impidiendo fugas de información.
- **Badge de Rol en el Header:** Muestra una insignia distintiva:
  - 👑 *Catheryne Ríos (Dueña)*
  - ✂️ *Administración de Servicios*
  - 🛍️ *Administración de Productos & Tienda*
  - 👩‍⚕️ *Especialista: [Nombre]*

### 4.3. Panel de Configuración (`AdminConfiguracion.jsx`)
Exclusivo para la Dueña (`OWNER`), con tarjeta de seguridad de lujo para actualizar los PINs:
- Campo: PIN Dueña (Maestro)
- Campo: PIN Administrador de Servicios (Operaciones)
- Campo: PIN Administrador de Productos (Tienda & Anuncios)
- Campo: PIN Especialistas
- Botón "Actualizar Claves de Acceso" con guardado persistente en base de datos.

---

## 5. Criterios de Aceptación y Pruebas
1. Ingresar el PIN `111111` autentica al usuario como `ADMIN_SERVICIOS`, muestra únicamente los módulos de servicios, agenda, caja, especialistas y clientas, y oculta productos y anuncios.
2. Ingresar el PIN `222222` autentica al usuario como `ADMIN_PRODUCTOS`, muestra únicamente inventario de productos y anuncios web, y bloquea el acceso a caja, citas y especialistas.
3. Ingresar el PIN `202626` autentica como `OWNER` y permite acceso total a todos los módulos.
4. Intentar acceder por URL directa a un módulo restringido ejecuta una redirección automática sin errores de consola.
5. La Dueña puede cambiar cualquiera de los PINs desde Configuración y el nuevo PIN queda activo de inmediato.
6. En ninguna pantalla aparece el término "spa", manteniéndose 100% como **Catheryne Ríos Estética**.
