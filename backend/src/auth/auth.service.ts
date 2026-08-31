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

  async verifyPin(pin: string): Promise<boolean> {
    const config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config?.masterPinHash) {
      return pin === '2026';
    }

    return bcrypt.compare(String(pin), config.masterPinHash);
  }

  async updateMasterPin(currentPin: string, newPin: string) {
    const isValid = await this.verifyPin(currentPin);
    if (!isValid) {
      throw new UnauthorizedException('El PIN actual no es correcto.');
    }

    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      throw new BadRequestException('El nuevo PIN debe tener entre 4 y 8 dígitos.');
    }

    const hashed = await bcrypt.hash(String(newPin), 10);

    await this.prisma.businessConfig.upsert({
      where: { id: 'singleton' },
      update: { masterPinHash: hashed },
      create: { id: 'singleton', masterPinHash: hashed },
    });

    return { success: true, message: 'PIN Maestro actualizado exitosamente.' };
  }
}
