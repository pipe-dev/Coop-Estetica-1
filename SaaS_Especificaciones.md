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

## 4. Panel de Administración, Staff y Caja Central (POS)
- **Gestión de Staff (Hasta 15 personas):** El sistema tendrá dos roles principales:
  - *Admin:* Acceso total a finanzas, configuración, reportes y caja.
  - *Colaboradora:* Interfaz limpia para ver sus citas asignadas y funciones limitadas.
- **Login por Turnos:** Al ingresar, se selecciona qué integrante del staff está abriendo el turno para tomar responsabilidad operativa del día.
- **Caja y Control Financiero Diario:**
  - Registro de **Ingresos** (servicios prestados o productos vendidos).
  - Botón para registrar **Egresos/Gastos** diarios (insumos, café, etc.).
  - Fórmula de la Caja: `(Total Ingresos - Total Egresos = Efectivo Neto en Caja)`.
- **Cálculo de Nómina:** El sistema no dividirá comisiones matemáticamente; en su lugar, entregará el "Total Generado" agrupado por colaboradora para que el administrador decida la distribución y pague por fuera del sistema.
- **Reportes (Excel):** Exportación con un clic de gráficas de ingresos, citas y el servicio más vendido.
- **Backups Manuales Inteligentes:** Al hacer clic en "Cerrar Caja" al final del día, el sistema forzará la descarga automática de la base de datos (formato `.sql` o `.csv`) al computador local, cumpliendo la regla de cero costos de nube.

## 5. Arquitectura Técnica (Backend y DB)
- **Frontend:** React + Vite, animaciones Framer Motion, diseño responsive, tipografía Syne.
- **Backend:** Node.js (NestJS) estructurado bajo principios S.O.L.I.D.
- **Base de Datos:** PostgreSQL (Relacional) para proteger la integridad de las citas y la caja financiera. Manejado a través de Prisma ORM.
