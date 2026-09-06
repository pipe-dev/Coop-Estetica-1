import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface LogEventParams {
  level: LogLevel;
  source: string;
  action: string;
  message: string;
  error?: unknown;
  metadata?: Record<string, any>;
  clientIp?: string;
  userAgent?: string;
  version?: string;
  commit?: string;
  environment?: string;
}

const APP_VERSION = 'Versión 2.0';
const GIT_COMMIT = 'main-prod';
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
  'pin',
  'passwordhash',
];

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Sanitiza recursivamente objetos y metadatos para evitar persistir claves o contraseñas
   */
  sanitizePayload(data?: any): any {
    if (!data) return undefined;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePayload(item));
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitizePayload(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  /**
   * Registra un evento de telemetría sin bloquear el flujo de la aplicación.
   * Regla #1: Nunca arrojar errores desde el logger.
   */
  async logSystemEvent(params: LogEventParams): Promise<any | null> {
    try {
      let errorDetails: string | null = null;

      if (params.error) {
        if (params.error instanceof Error) {
          errorDetails = params.error.stack || params.error.message;
        } else if (typeof params.error === 'string') {
          errorDetails = params.error;
        } else {
          try {
            errorDetails = JSON.stringify(params.error, Object.getOwnPropertyNames(params.error));
          } catch {
            errorDetails = String(params.error);
          }
        }
      }

      const sanitizedMetadata = params.metadata ? this.sanitizePayload(params.metadata) : null;
      const metadataStr = sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null;

      const logRecord = await this.prisma.systemLog.create({
        data: {
          level: params.level || 'info',
          source: params.source || 'system',
          action: params.action || 'unknown',
          message: params.message || 'Sin mensaje especificado',
          stackTrace: errorDetails,
          metadata: metadataStr,
          version: params.version || APP_VERSION,
          commit: params.commit || GIT_COMMIT,
          environment: params.environment || process.env.NODE_ENV || 'production',
          clientIp: params.clientIp || null,
          userAgent: params.userAgent || null,
        },
      });

      return logRecord;
    } catch (err) {
      // Regla de oro: Atrapar el error silenciosamente sin tumbar el hilo principal
      this.logger.error(`[Telemetry Failure] Error al persistir log del sistema: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Obtiene logs con filtros, búsqueda y paginación
   */
  async getLogs(filters: {
    level?: string;
    source?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (filters.level && filters.level.toUpperCase() !== 'ALL') {
        whereClause.level = filters.level.toLowerCase();
      }

      if (filters.source && filters.source.toUpperCase() !== 'ALL') {
        whereClause.source = { contains: filters.source, mode: 'insensitive' };
      }

      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.trim();
        whereClause.OR = [
          { message: { contains: term, mode: 'insensitive' } },
          { action: { contains: term, mode: 'insensitive' } },
          { source: { contains: term, mode: 'insensitive' } },
          { metadata: { contains: term, mode: 'insensitive' } },
          { stackTrace: { contains: term, mode: 'insensitive' } },
        ];
      }

      const [logs, total] = await Promise.all([
        this.prisma.systemLog.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.systemLog.count({ where: whereClause }),
      ]);

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (err) {
      this.logger.error(`Error al consultar logs: ${err?.message || err}`);
      return { logs: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  /**
   * Obtiene todos los logs (hasta 1000) para la acción de "Copiar todos los logs"
   */
  async getAllLogs(limit: number = 1000) {
    try {
      return await this.prisma.systemLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (err) {
      this.logger.error(`Error al consultar todos los logs: ${err?.message || err}`);
      return [];
    }
  }

  /**
   * Calcula estadísticas de salud del sistema
   */
  async getStats() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalCount, criticalCount, errorCount, warningCount, infoCount, recentErrors] =
        await Promise.all([
          this.prisma.systemLog.count(),
          this.prisma.systemLog.count({ where: { level: 'critical' } }),
          this.prisma.systemLog.count({ where: { level: 'error' } }),
          this.prisma.systemLog.count({ where: { level: 'warning' } }),
          this.prisma.systemLog.count({ where: { level: 'info' } }),
          this.prisma.systemLog.count({
            where: {
              timestamp: { gte: last24h },
              level: { in: ['critical', 'error'] },
            },
          }),
        ]);

      let systemHealth: 'OPTIMO' | 'ADVERTENCIA' | 'CRITICO' = 'OPTIMO';
      if (recentErrors > 5 || criticalCount > 0) {
        systemHealth = 'CRITICO';
      } else if (recentErrors > 0 || warningCount > 5) {
        systemHealth = 'ADVERTENCIA';
      }

      return {
        totalCount,
        criticalCount,
        errorCount,
        warningCount,
        infoCount,
        recentErrors24h: recentErrors,
        systemHealth,
        appVersion: APP_VERSION,
        gitCommit: GIT_COMMIT,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      return {
        totalCount: 0,
        criticalCount: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        recentErrors24h: 0,
        systemHealth: 'OPTIMO',
        appVersion: APP_VERSION,
        gitCommit: GIT_COMMIT,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Valida el PIN de acceso a la consola de telemetría (PIN por defecto: 5214)
   */
  async verifyTelemetryPin(pin: string): Promise<boolean> {
    const inputPin = String(pin || '').trim();
    if (!inputPin) return false;

    // PIN oficial dedicado: 5214
    if (inputPin === '5214') return true;

    // Opcionalmente comparar con BusinessConfig en la base de datos
    try {
      const config = await this.prisma.businessConfig.findUnique({
        where: { id: 'singleton' },
      });
      if (config?.telemetryPin && inputPin === config.telemetryPin) {
        return true;
      }
      // También permitir el PIN Maestro de la CEO/Dueña (202626) como superadmin
      if (config?.masterPin && inputPin === config.masterPin) {
        return true;
      }
    } catch {
      // Fallback a 5214
    }

    return inputPin === '5214';
  }

  /**
   * Purga logs antiguos según política de retención (ej: mayores a N días)
   */
  async purgeLogs(days: number = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await this.prisma.systemLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      await this.logSystemEvent({
        level: 'info',
        source: 'system',
        action: 'purgeLogs',
        message: `Purga de logs completada: se eliminaron ${result.count} registros con más de ${days} días`,
      });

      return { success: true, count: result.count };
    } catch (err) {
      this.logger.error(`Fallo en purga de logs: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  /**
   * Limpia todos los logs
   */
  async clearAllLogs() {
    try {
      const result = await this.prisma.systemLog.deleteMany({});
      await this.logSystemEvent({
        level: 'info',
        source: 'system',
        action: 'clearAllLogs',
        message: `Se restableció el almacén de logs del sistema (${result.count} eliminados).`,
      });
      return { success: true, count: result.count };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }
}
