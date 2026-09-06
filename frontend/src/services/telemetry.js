// Motor de telemetría y captura de excepciones en cliente para Catheryne Ríos Estética
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const APP_VERSION = 'Versión 2.0';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'apikey',
  'api_key',
  'secret',
  'authorization',
  'creditcard',
  'masterpin',
  'adminpin',
  'specialistpin',
  'telemetrypin',
  'pin'
];

/**
 * Sanitiza recursivamente objetos en cliente para no enviar credenciales
 */
function sanitizeClientPayload(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeClientPayload);

  const sanitized = {};
  for (const key of Object.keys(data)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeClientPayload(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

/**
 * Registra un evento de telemetría desde el cliente de forma no bloqueante.
 * Regla #1: Nunca arrojar errores que rompan la experiencia de usuario.
 */
export async function logClientEvent({
  level = 'info',
  source = 'client-runtime',
  action = 'unknownAction',
  message = '',
  error = null,
  metadata = null,
}) {
  try {
    let errorDetails = null;
    if (error) {
      if (error instanceof Error) {
        errorDetails = `${error.name}: ${error.message}\n${error.stack || ''}`;
      } else if (typeof error === 'string') {
        errorDetails = error;
      } else {
        try {
          errorDetails = JSON.stringify(error);
        } catch {
          errorDetails = String(error);
        }
      }
    }

    const payload = {
      level,
      source,
      action,
      message: message || (error instanceof Error ? error.message : 'Evento de cliente'),
      error: errorDetails,
      metadata: sanitizeClientPayload(metadata),
      version: APP_VERSION,
      environment: import.meta.env.MODE || 'production',
    };

    // Envío asíncrono no bloqueante
    fetch(`${API_BASE_URL}/system-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      // Si la API está temporalmente inalcanzable, advertir en consola local sin interrumpir
      console.warn('[Telemetry Client Silent Catch]:', err?.message || err);
    });
  } catch (outerErr) {
    console.warn('[Telemetry Client Error]:', outerErr);
  }
}

/**
 * Inicializa escuchas automáticas globales de errores de runtime no capturados
 */
let isListenerInitialized = false;
export function initGlobalErrorTelemetry() {
  if (isListenerInitialized || typeof window === 'undefined') return;
  isListenerInitialized = true;

  window.addEventListener('error', (event) => {
    // Ignorar errores triviales de extensiones de navegador
    if (event.filename && (event.filename.includes('chrome-extension') || event.filename.includes('moz-extension'))) {
      return;
    }
    logClientEvent({
      level: 'error',
      source: 'client-runtime',
      action: 'window.onerror',
      message: event.message || 'Excepción no capturada en ventana',
      error: event.error || event.message,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logClientEvent({
      level: 'error',
      source: 'client-runtime',
      action: 'unhandledrejection',
      message: event.reason?.message || 'Promesa no manejada rechazada en cliente',
      error: event.reason,
      metadata: {
        type: 'PromiseRejection',
      },
    });
  });
}
