import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigNegocioService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL DEL NEGOCIO
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

    // Omitir masterPinHash en respuestas públicas
    const { masterPinHash, ...publicData } = config;
    return publicData;
  }

  async updateConfig(data: {
    businessName?: string;
    whatsappNumber?: string;
    phone?: string;
    address?: string;
    openingHours?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    facebookUrl?: string;
    promoBanner?: string;
  }) {
    return this.prisma.businessConfig.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
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
