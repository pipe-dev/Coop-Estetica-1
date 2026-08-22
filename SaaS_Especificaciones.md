# Especificaciones del Ecosistema SaaS - Catheryne Ríos Estética

Este documento centraliza todas las funcionalidades, lógicas de negocio y decisiones arquitectónicas acordadas para el desarrollo del ecosistema completo. Servirá como nuestra hoja de ruta técnica ("Master Spec") para la fase de Backend y la finalización del Frontend.

## Principios Fundamentales
1. **Ecosistema Cerrado:** Todo se gestiona dentro de la plataforma (cero dependencia de apps externas como Google Calendar).
2. **Infraestructura a Costo Cero:** Se evitará el uso de APIs o servicios de pago recurrente (AWS, Twilio, SendGrid) implementando soluciones nativas y automatizaciones manuales/gratuitas.
3. **Experiencia Premium:** El diseño debe ser lujoso, interactivo e intuitivo, elevando el estatus de la marca y de sus clientes.

---

## 1. Módulo E-commerce y Ventas
- **Catálogo Mixto:** Venta de productos físicos (incluyendo esquema dropshipping) y servicios del spa.
- **Pagos Manuales:** Sin integración de pasarelas de pago con comisiones. El cierre de venta se hace mediante transferencia, Nequi, Daviplata, Efectivo, QR, etc., con un flujo directo hacia WhatsApp para enviar el comprobante.
- **Venta Cruzada Inteligente (Cross-Selling Premium):** El sistema sugerirá productos o servicios complementarios de forma sutil y exclusiva (ej: sugerir aromaterapia con un masaje) para aumentar el ticket promedio sin forzar la venta.
- **Notificaciones de Carrito Abandonado:** El sistema enviará recordatorios automáticos de carritos no completados utilizando los canales a costo cero.
- **Ruleta VIP de Fidelidad:** Sistema gamificado donde los clientes recurrentes (tras completar 2 o 3 compras/servicios) obtienen un "tiro de ruleta" como recompensa de lealtad para ganar descuentos (2%, 5%, 10%) o servicios gratuitos. *Nota: No se usa para captación de leads en frío, sino puramente para fidelización.*

## 2. Sistema de Agendamiento (Booking)
- **Reservas Gratuitas:** Los clientes pueden agendar online sin realizar anticipos de dinero. El pago se efectúa presencialmente en el spa.
- **Notificaciones Costo Cero:** 
  - *Email:* Uso de `Nodemailer` conectado a una cuenta de Gmail del Spa para confirmaciones automáticas.
  - *WhatsApp:* Generación de enlaces preformateados (`wa.me`) para que la recepcionista envíe notificaciones o recordatorios con un solo clic en su PC/móvil.
- **Checkbox Legal:** Para evitar riesgos, el sistema exigirá que el cliente acepte los términos de servicio y riesgos antes de confirmar la cita, registrando IP y fecha de aceptación (remplazando la firma digital compleja).

## 3. Historial de Clientes y CRM
- **Ficha Simple:** Seguimiento básico de clientes y sus citas. (No se incluirá historial médico avanzado o fotos de antes y después para mantener simplicidad y fluidez).
- **Programa de Lealtad (Puntos):** Los clientes acumulan puntos que podrán ser redimidos después. La gestión y asignación de estos puntos la controla el administrador.

## 4. Panel de Administración, Roles & Seguridad Anti-Fraude (RBAC & PIN Maestro)
- **Jerarquía de 3 Roles de Acceso (Validado 100% en Backend):**
  1. 👑 **Rol Propietaria / Dueña (Catheryne):** 
     - Acceso total sin restricciones a todos los módulos.
     - Administración y cambio del **PIN Maestro de Propietaria**.
     - Configuración y modificación de porcentajes de comisión de especialistas.
     - Modificación de precios oficiales del catálogo de servicios y productos.
     - Autorización y liquidación de pagos de nómina.
     - Visualización del balance financiero neto acumulado y auditoría completa.
  2. 🛡️ **Rol Administradora / Recepcionista Encargada:**
     - Operación diaria del spa: apertura y cierre de turnos con **Arqueo Ciego**.
     - Gestión de la agenda completa (crear, mover y cobrar citas con recibos WhatsApp).
     - Cobro y registro de ingresos/egresos en caja.
     - Directorio de clientas y venta directa de productos.
     - *Bloqueos de Seguridad:* No puede cambiar comisiones, modificar precios oficiales, alterar inventarios manualmente, borrar clientas ni liquidar nóminas sin el **PIN Maestro de la Propietaria**.
  3. 👥 **Rol Especialista / Colaboradora:**
     - Interfaz simplificada y restringida.
     - Visualización exclusiva de sus **propias citas asignadas**.
     - Marcado de servicios como atendidos.
     - Consulta de su acumulado de comisiones generadas.
     - *Bloqueo Total:* Espacios financieros, caja general, directorio global de clientas y ajustes del sistema completamente inaccesibles.

- **Mecanismo de Seguridad Anti-Fraude (Protegido en Backend - Anti-DevTools):**
  - **Validación del Lado del Servidor:** Todas las rutas y mutaciones críticas (`PATCH /services/:id/price`, `PATCH /team/:id/commission`, `POST /payroll/liquidate`, `DELETE /clients/:id`) estarán protegidas por NestJS Guards (`@UseGuards(OwnerPinGuard)`).
  - **PIN Maestro Hasheado:** El PIN se almacena con hash criptográfico (bcrypt/argon2) en PostgreSQL y se valida únicamente en el backend, imposibilitando que alguien con conocimientos básicos de DevTools o consola del navegador pueda evadir la seguridad.
  - **Protección Anti-Fuerza Bruta:** Máximo 3 intentos fallidos de PIN consecutivos antes de un bloqueo temporal (15 minutos) con alerta de seguridad al email de la dueña.
  - **Auditoría Inmutable (`SecurityAuditLog`):** Cada acción sensible o autorizada por PIN queda registrada en base de datos con: IP del cliente, timestamp, ID del usuario, acción ejecutada y valores anteriores vs. nuevos.

- **Caja, Arqueo Ciego y Control Financiero:**
  - **Apertura y Cierre por Turnos:** Responsable asignado al inicio del turno con base inicial.
  - **Arqueo Ciego:** Al cerrar el turno, la colaboradora ingresa el efectivo contado sin ver el saldo esperado del sistema. Si hay descuadre (faltante/sobrante), el backend exige obligatoriamente justificación y método de resolución.
  - **Comprobantes WhatsApp:** Envío de recibo digital oficial en un clic a la clienta para evitar sobreprecios o cobros no reportados.

- **Cálculo de Nómina & Comisiones:**
  - Cálculo automático basado estrictamente en **citas pagadas** multiplicadas por el % de comisión de cada especialista.
  - Generación de desembolso a caja solo bajo autorización de la dueña.

- **Reportes y Respaldos:**
  - Exportación en un clic a Excel / CSV de caja, movimientos de auditoría y directorio de clientas.
  - Descarga manual de base de datos (`.sql` / `.csv`) al cerrar la caja del día.

## 5. Arquitectura Técnica (Backend y DB)
- **Frontend:** React + Vite, animaciones Framer Motion, diseño responsive luxury, tipografía Syne y HSL tailored design system.
- **Backend:** Node.js con NestJS estructurado bajo arquitectura hexagonal y principios S.O.L.I.D.
- **Seguridad Backend:** JWT con refresh tokens, RBAC Decorators, Argon2/Bcrypt para PINs y contraseñas, Throttler / Rate-limiting.
- **Base de Datos:** PostgreSQL (Relacional) para garantizar integridad transaccional (ACID) en finanzas, citas e inventario. Manejado a través de Prisma ORM.
