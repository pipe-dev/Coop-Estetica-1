import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ConfigNegocioService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL DEL NEGOCIO (PÚBLICA - CERO FUGA DE CLAVES)
  // ----------------------------------------------------
  async getPublicConfig() {
    let config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      config = await this.prisma.businessConfig.create({
        data: { id: 'singleton' },
      });
    }

    // Exponer ÚNICAMENTE datos comerciales públicos. Cero PINs, cero hashes, cero correos privados.
    return {
      id: config.id,
      businessName: config.businessName,
      whatsappNumber: config.whatsappNumber,
      phone: config.phone,
      address: config.address,
      openingHours: config.openingHours,
      instagramUrl: config.instagramUrl,
      tiktokUrl: config.tiktokUrl,
      facebookUrl: config.facebookUrl,
      promoBanner: config.promoBanner,
      updatedAt: config.updatedAt,
    };
  }

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL DEL NEGOCIO (ADMINISTRATIVA - PROTEGIDA)
  // ----------------------------------------------------
  async getAdminConfig() {
    let config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      config = await this.prisma.businessConfig.create({
        data: { id: 'singleton' },
      });
    }

    // Omitir masterPinHash pero permitir ver los PINs activos al panel administrativo autorizado
    const { masterPinHash, ...adminData } = config;
    return adminData;
  }

  async updateConfig(data: any) {
    // Sanitización: prevenir inyección o manipulación directa de hash
    const { id, masterPinHash, ...cleanData } = data;
    if (cleanData.masterPin && typeof cleanData.masterPin === 'string') {
      cleanData.masterPinHash = await bcrypt.hash(cleanData.masterPin.trim(), 10);
    }
    return this.prisma.businessConfig.upsert({
      where: { id: 'singleton' },
      update: cleanData,
      create: { id: 'singleton', ...cleanData },
    });
  }

  // ----------------------------------------------------
  // PLANES DE MEMBRESÍA VIP
  // ----------------------------------------------------
  async getAllMemberships(onlyActive = true) {
    return this.prisma.membership.findMany({
      where: onlyActive ? { active: true } : {},
      orderBy: { price: 'asc' },
    });
  }

  async createMembership(data: {
    name: string;
    price: number;
    popular?: boolean;
    color?: string;
    features: string[];
  }) {
    return this.prisma.membership.create({
      data: {
        name: data.name,
        price: data.price,
        popular: data.popular ?? false,
        color: data.color ?? '#D4AF37',
        features: data.features || [],
      },
    });
  }

  async updateMembership(id: string, data: any) {
    return this.prisma.membership.update({
      where: { id },
      data,
    });
  }

  async deleteMembership(id: string) {
    return this.prisma.membership.delete({
      where: { id },
    });
  }

  // ----------------------------------------------------
  // DÍAS DE CIERRE, FESTIVOS & VACACIONES
  // ----------------------------------------------------
  async getAllClosedDates() {
    return this.prisma.closedDate.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createClosedDate(data: { date: string; reason: string; type?: string }) {
    return this.prisma.closedDate.upsert({
      where: { date: data.date },
      update: {
        reason: data.reason,
        type: data.type || 'Festivo',
      },
      create: {
        date: data.date,
        reason: data.reason,
        type: data.type || 'Festivo',
      },
    });
  }

  async deleteClosedDate(id: string) {
    return this.prisma.closedDate.delete({
      where: { id },
    });
  }
}
