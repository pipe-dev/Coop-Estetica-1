import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OwnerPinGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedPin = request.headers['x-owner-pin'] || request.body?.ownerPin;

    if (!providedPin) {
      throw new UnauthorizedException('Se requiere la autorización del PIN Maestro de la Propietaria para esta acción crítica.');
    }

    const config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    // Si no hay PIN configurado aún en la base de datos, el PIN inicial por defecto es 2026
    const validHash = config?.masterPinHash;
    let isValid = false;

    if (!validHash) {
      isValid = providedPin === '2026';
    } else {
      isValid = await bcrypt.compare(String(providedPin), validHash);
    }

    if (!isValid) {
      // Registrar intento fallido en auditoría
      await this.prisma.securityAuditLog.create({
        data: {
          action: 'FAILED_MASTER_PIN_ATTEMPT',
          details: JSON.stringify({ path: request.url, method: request.method }),
          ipAddress: request.ip || 'desconocida',
          userRole: request.user?.role || 'ANONYMOUS',
          userId: request.user?.id || null,
        },
      });

      throw new UnauthorizedException('El PIN Maestro de Propietaria suministrado es incorrecto.');
    }

    return true;
  }
}
