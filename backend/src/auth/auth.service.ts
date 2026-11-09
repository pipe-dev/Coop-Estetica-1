import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { teamMember: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales de acceso no válidas.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales de acceso no válidas.');
    }

    if (!user.active) {
      throw new UnauthorizedException('La cuenta de usuario se encuentra inactiva.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamMemberId: user.teamMemberId,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamMemberId: user.teamMemberId,
        specialistName: user.teamMember?.name,
        specialistRole: user.teamMember?.role,
        commissionRate: user.teamMember?.commissionRate,
      },
    };
  }

  async verifyPin(pin: string): Promise<{ valid: boolean; role?: 'OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'ADMIN' | 'SPECIALIST'; accessToken?: string }> {
    const config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    const trimmed = String(pin).trim();

    const activeMasterPin = config?.masterPin || '202626';
    const activeServicesPin = config?.servicesAdminPin || config?.adminPin || '111111';
    const activeProductsPin = config?.productsAdminPin || '222222';
    const activeSpecialistPin = config?.specialistPin || '777777';

    // 1. Validar Dueña (masterPin / masterPinHash)
    let isOwner = false;
    if (trimmed === activeMasterPin) {
      isOwner = true;
    } else if (config?.masterPinHash) {
      isOwner = await bcrypt.compare(trimmed, config.masterPinHash);
    }

    let matchedRole: 'OWNER' | 'ADMIN_SERVICIOS' | 'ADMIN_PRODUCTOS' | 'ADMIN' | 'SPECIALIST' | null = null;
    let sub = 'admin-owner';
    let name = 'Catheryne Ríos (Propietaria)';

    if (isOwner) {
      matchedRole = 'OWNER';
      sub = 'admin-owner';
      name = 'Catheryne Ríos (Propietaria)';
    } else if (trimmed === activeServicesPin) {
      matchedRole = 'ADMIN_SERVICIOS';
      sub = 'staff-admin-servicios';
      name = 'Administradora de Servicios';
    } else if (trimmed === activeProductsPin) {
      matchedRole = 'ADMIN_PRODUCTOS';
      sub = 'staff-admin-productos';
      name = 'Administrador de Productos';
    } else if (trimmed === activeSpecialistPin) {
      matchedRole = 'SPECIALIST';
      sub = 'staff-specialist';
      name = 'Especialista';
    }

    if (matchedRole) {
      const payload = {
        sub,
        name,
        role: matchedRole,
      };
      const token = this.jwtService.sign(payload);
      return { valid: true, role: matchedRole, accessToken: token };
    }

    return { valid: false };
  }

  async updateMasterPin(currentPin: string, newPin: string) {
    const verification = await this.verifyPin(currentPin);
    if (!verification.valid || verification.role !== 'OWNER') {
      throw new UnauthorizedException('El PIN actual no es correcto.');
    }

    if (!newPin || !/^\d{6}$/.test(String(newPin).trim())) {
      throw new BadRequestException('El nuevo PIN debe tener exactamente 6 dígitos numéricos.');
    }

    const hashed = await bcrypt.hash(String(newPin).trim(), 10);

    await this.prisma.businessConfig.upsert({
      where: { id: 'singleton' },
      update: { masterPinHash: hashed },
      create: { id: 'singleton', masterPinHash: hashed },
    });

    return { success: true, message: 'PIN Maestro actualizado exitosamente.' };
  }
}
