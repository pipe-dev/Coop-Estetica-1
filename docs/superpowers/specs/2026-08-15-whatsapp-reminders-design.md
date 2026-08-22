# Spec: Centro de Recordatorios de Citas por WhatsApp & Anuncios Web

**Fecha:** 2026-08-15  
**Módulo:** `/admin/notificaciones` (Centro de Notificaciones & Comunicaciones)  
**Marca Oficial:** Catheryne Ríos Estética  

---

## 1. Contexto y Propósito
Optimizar y centralizar la comunicación externa y el despacho de recordatorios de citas en `Catheryne Ríos Estética`. La administradora podrá, en menos de 2 minutos, enviar recordatorios oficiales personalizados por WhatsApp a las clientas para citas de mañana (confirmación) y citas de hoy (aviso de puntualidad 1 hora antes), previniendo inasistencias y desorganización de la agenda sin dar pie a cancelaciones de última hora.

---

## 2. Arquitectura de Navegación en `/admin/notificaciones`
El módulo se divide en dos pestañas principales:

1. **Pestaña 1: `[ 📲 Recordatorios de Citas por WhatsApp ]`**
2. **Pestaña 2: `[ 📢 Anuncios Web & Promociones ]`**

---

## 3. Especificación Detallada: Recordatorios de Citas

### 3.1 Filtros y Modos de Recordatorio
- **☀️ Modo Mañana (Confirmación previa - Default):** Filtra citas programadas para el día siguiente (`today + 1 día`).
- **⏰ Modo Hoy (Aviso 1 Hora Antes / Puntualidad):** Filtra citas programadas para el día de hoy (`today`).
- **📅 Modo Fecha Personalizada:** Selector `input type="date"` para consultar cualquier otra fecha.

### 3.2 Plantillas Oficiales de WhatsApp

#### Plantilla A (Modo Mañana):
```text
🌸 *RECORDATORIO DE TU CITA — CATHERYNE RÍOS ESTÉTICA* 🌸
Hola *{{clientName}}*, ¡te saludamos con mucho cariño! ✨

Te recordamos tu cita programada para el día de mañana:
🗓️ *Fecha:* {{dateFormatted}}
⏰ *Hora:* {{time}}
💆 *Tratamiento:* {{serviceName}}
👩‍⚕️ *Especialista:* {{specialistName}}
📍 *Lugar:* Catheryne Ríos Estética

Por favor responde a este mensaje con un *“CONFIRMO”* para asegurar tu espacio con tu especialista. 💖
¡Te esperamos para consentirte y realzar tu belleza!
```

#### Plantilla B (Modo Hoy / 1 Hora antes):
```text
⏰ *¡TU CITA ESTÁ POR COMENZAR! — CATHERYNE RÍOS ESTÉTICA* ⏰
Hola *{{clientName}}*, ¡esperamos que estés teniendo un lindo día! 🌸

Te recordamos que tu cita de hoy está lista para iniciar:
💆 *Tratamiento:* {{serviceName}}
👩‍⚕️ *Especialista:* {{specialistName}}
⏰ *Hora:* {{time}}
📍 *Lugar:* Catheryne Ríos Estética

Tu especialista ya tiene la cabina y los insumos preparados para recibirte puntualmente. ✨💖 ¡Te esperamos!
```

### 3.3 Flujo de Interacción y Estados
1. Se listan las citas de la fecha seleccionada.
2. Cada cita muestra: Hora, Clienta, Teléfono, Tratamiento, Especialista, Estado del Recordatorio (`🟡 Pendiente` / `🟢 Enviado`).
3. Al hacer clic en `[ 📲 Enviar Recordatorio ]`:
   - Se genera el enlace de WhatsApp `https://wa.me/57{{cleanPhone}}?text={{encodedMessage}}`.
   - Se abre en nueva pestaña del navegador o app de WhatsApp.
   - El estado local de la cita se actualiza a `🟢 Enviado` y se incrementa el contador de enviados.
4. Botón alternativo `[ 📋 Copiar Mensaje ]` para copiar el texto formateado al portapapeles.

---

## 4. Especificación Detallada: Anuncios Web & Promociones
- Mantiene la creación de anuncios con título, descripción y fecha.
- Switch de activación/desactivación para mostrar/ocultar en la web pública.
- Botón de eliminación.

---

## 5. Diseño y Estilos
- Integrado con la paleta de lujo del panel de administración (`#0E0E0E`, `#18181B`, `#D4AF37`, acentos verdes para WhatsApp `#10B981` y `#25D366`).
- Tipografía `Syne` en encabezados y fuentes nítidas en tablas/tarjetas.
- Totalmente responsive para móviles y tablets.
