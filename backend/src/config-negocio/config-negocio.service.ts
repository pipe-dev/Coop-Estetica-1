import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ConfigNegocioService {
  constructor(private prisma: PrismaService) {}

  // Micro-Caché en memoria RAM para alta concurrencia (TTL: 60s)
  private configCache: { data: any; timestamp: number } | null = null;
  private membershipsCache: { data: any[]; timestamp: number } | null = null;
  private closedDatesCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000;

  private invalidateCache() {
    this.configCache = null;
    this.membershipsCache = null;
    this.closedDatesCache = null;
  }

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL DEL NEGOCIO (PÚBLICA - CERO FUGA DE CLAVES)
  // ----------------------------------------------------
  async getPublicConfig() {
    const now = Date.now();
    if (this.configCache && now - this.configCache.timestamp < this.CACHE_TTL_MS) {
      return this.configCache.data;
    }

    let config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      config = await this.prisma.businessConfig.create({
        data: { id: 'singleton' },
      });
    }

    // Exponer ÚNICAMENTE datos comerciales públicos. Cero PINs, cero hashes, cero correos privados.
    const result = {
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

    this.configCache = { data: result, timestamp: now };
    return result;
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
    this.invalidateCache();
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
    if (onlyActive) {
      const now = Date.now();
      if (this.membershipsCache && now - this.membershipsCache.timestamp < this.CACHE_TTL_MS) {
        return this.membershipsCache.data;
      }
    }

    const data = await this.prisma.membership.findMany({
      where: onlyActive ? { active: true } : {},
      orderBy: { price: 'asc' },
    });

    if (onlyActive) {
      this.membershipsCache = { data, timestamp: Date.now() };
    }
    return data;
  }

  async createMembership(data: {
    name: string;
    price: number;
    popular?: boolean;
    color?: string;
    features: string[];
  }) {
    this.invalidateCache();
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
    this.invalidateCache();
    return this.prisma.membership.update({
      where: { id },
      data,
    });
  }

  async deleteMembership(id: string) {
    this.invalidateCache();
    return this.prisma.membership.delete({
      where: { id },
    });
  }

  // ----------------------------------------------------
  // DÍAS DE CIERRE, FESTIVOS & VACACIONES
  // ----------------------------------------------------
  async getAllClosedDates() {
    const now = Date.now();
    if (this.closedDatesCache && now - this.closedDatesCache.timestamp < this.CACHE_TTL_MS) {
      return this.closedDatesCache.data;
    }

    const data = await this.prisma.closedDate.findMany({
      orderBy: { date: 'asc' },
    });

    this.closedDatesCache = { data, timestamp: now };
    return data;
  }

  async createClosedDate(data: { date: string; reason: string; type?: string }) {
    this.invalidateCache();
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
    this.invalidateCache();
    return this.prisma.closedDate.delete({
      where: { id },
    });
  }
}
