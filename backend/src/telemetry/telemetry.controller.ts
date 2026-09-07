import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { TelemetryService, LogLevel } from './telemetry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('api/system-logs')
export class TelemetryController {
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly jwtService: JwtService,
  ) {}

  private ensureNotSpecialist(req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen autorización para consultar la consola de telemetría.');
    }
  }

  /**
   * Endpoint de ingesta de eventos (utilizado por el cliente React o servicios internos)
   * S.H.I.E.L.D. Pillar 5 & 13: Limitado a 30 eventos/min para evitar DoS y saturación de base de datos
   */
  @Throttle({ short: { limit: 30, ttl: 60000 }, medium: { limit: 100, ttl: 300000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  async createLog(
    @Body()
    body: {
      level?: LogLevel;
      source?: string;
      action?: string;
      message?: string;
      error?: any;
      metadata?: Record<string, any>;
      version?: string;
      environment?: string;
    },
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.telemetryService.logSystemEvent({
      level: body.level || 'info',
      source: body.source || 'client-runtime',
      action: body.action || 'runtimeEvent',
      message: body.message || 'Log registrado desde cliente',
      error: body.error,
      metadata: body.metadata,
      clientIp,
      userAgent,
      version: body.version,
      environment: body.environment,
    });

    return { success: true, id: result?.id };
  }

  /**
   * Consulta paginada y filtrada de logs para la consola administrativa
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getLogs(
    @Req() req: any,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.ensureNotSpecialist(req);
    return await this.telemetryService.getLogs({
      level,
      source,
      search,
      page,
      limit,
    });
  }

  /**
   * Obtiene todos los logs (hasta 1000) para la acción de "Copiar todos los logs"
   */
  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllLogs(@Req() req: any, @Query('limit') limit?: number) {
    this.ensureNotSpecialist(req);
    const logs = await this.telemetryService.getAllLogs(limit ? Number(limit) : 1000);
    return { logs, count: logs.length };
  }

  /**
   * Obtiene métricas en vivo y estado de salud del sistema
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Req() req: any) {
    this.ensureNotSpecialist(req);
    return await this.telemetryService.getStats();
  }

  /**
   * Valida el PIN de desbloqueo de la consola de telemetría (S.H.I.E.L.D. Anti-Brute-Force)
   */
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 300000 } })
  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  async verifyPin(@Body('pin') pin: string) {
    const isValid = await this.telemetryService.verifyTelemetryPin(pin);
    if (!isValid) {
      throw new UnauthorizedException('PIN de acceso a telemetría incorrecto.');
    }
    const token = this.jwtService.sign({
      sub: 'admin-developer',
      name: 'Desarrollador / Telemetría',
      role: 'OWNER',
    });
    return { 
      success: true, 
      valid: true, 
      message: 'Acceso a consola de telemetría autorizado', 
      accessToken: token 
    };
  }

  /**
   * Inyecta un evento de prueba en vivo para verificar el pipeline
   */
  @UseGuards(JwtAuthGuard)
  @Post('test-event')
  @HttpCode(HttpStatus.OK)
  async createTestEvent(
    @Body()
    body: {
      level?: LogLevel;
      source?: string;
      message?: string;
    },
    @Req() req: any,
  ) {
    this.ensureNotSpecialist(req);
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const testEvent = await this.telemetryService.logSystemEvent({
      level: body.level || 'critical',
      source: body.source || 'appointments',
      action: 'testDiagnosticEvent',
      message: body.message || 'Error de prueba para verificación del pipeline de telemetría',
      error: new Error('Simulated diagnostic exception for AI verification: connection timeout in mock provider'),
      metadata: {
        simulationId: `SIM-${Date.now()}`,
        simulatedBy: 'Catheryne Ríos (CEO/Propietaria)',
        targetModule: 'appointments',
        diagnosticCode: 'ERR_TELEMETRY_PIPELINE_VERIFY',
      },
      clientIp,
      userAgent: req.headers['user-agent'] || 'Diagnostic Tester',
    });

    return { success: true, log: testEvent };
  }

  /**
   * Purga de logs antiguos por política de retención o limpieza (Exclusivo OWNER)
   */
  @UseGuards(JwtAuthGuard)
  @Delete('purge')
  async purgeLogs(
    @Query('days') days?: number,
    @Query('all') all?: string,
    @Req() req?: any,
  ) {
    if (req.user?.role !== 'OWNER') {
      throw new ForbiddenException('Acceso denegado: Solo la Propietaria (CEO) o Desarrollador puede purgar el registro de auditoría.');
    }
    if (all === 'true') {
      return await this.telemetryService.clearAllLogs();
    }
    const daysNumber = days ? Number(days) : 30;
    return await this.telemetryService.purgeLogs(daysNumber);
  }
}
