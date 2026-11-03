import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // Micro-Caché en memoria RAM para alta concurrencia (TTL: 60s)
  private categoriesCache: { data: any[]; timestamp: number } | null = null;
  private servicesCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000;

  private invalidateCache() {
    this.categoriesCache = null;
    this.servicesCache = null;
  }

  // ----------------------------------------------------
  // CATEGORÍAS
  // ----------------------------------------------------
  async getAllCategories(includeInactive = false) {
    if (!includeInactive) {
      const now = Date.now();
      if (this.categoriesCache && now - this.categoriesCache.timestamp < this.CACHE_TTL_MS) {
        return this.categoriesCache.data;
      }
    }

    const data = await this.prisma.serviceCategory.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        services: {
          where: includeInactive ? {} : { active: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    if (!includeInactive) {
      this.categoriesCache = { data, timestamp: Date.now() };
    }
    return data;
  }

  async createCategory(data: { name: string; description?: string; image?: string; order?: number }) {
    this.invalidateCache();
    return this.prisma.serviceCategory.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        order: data.order || 0,
        active: true,
      },
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string; image?: string; order?: number; active?: boolean }) {
    const exists = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Categoría no encontrada.');

    this.invalidateCache();
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    this.invalidateCache();
    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  // ----------------------------------------------------
  // SERVICIOS
  // ----------------------------------------------------
  async getAllServices(includeInactive = false) {
    if (!includeInactive) {
      const now = Date.now();
      if (this.servicesCache && now - this.servicesCache.timestamp < this.CACHE_TTL_MS) {
        return this.servicesCache.data;
      }
    }

    const data = await this.prisma.service.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (!includeInactive) {
      this.servicesCache = { data, timestamp: Date.now() };
    }
    return data;
  }

  async getServiceById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado.');
    return service;
  }

  async createService(data: {
    name: string;
    categoryId: string;
    price: number;
    duration: number;
    description?: string;
    includes?: string;
    image?: string;
  }) {
    this.invalidateCache();
    return this.prisma.service.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        price: Number(data.price),
        duration: Number(data.duration) || 60,
        description: data.description || '',
        includes: data.includes || '',
        image: data.image || '',
        active: true,
      },
    });
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      price?: number;
      duration?: number;
      description?: string;
      includes?: string;
      image?: string;
      active?: boolean;
    },
  ) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Servicio no encontrado.');

    this.invalidateCache();
    return this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
        duration: data.duration !== undefined ? Number(data.duration) : undefined,
      },
    });
  }

  async toggleServiceActive(id: string) {
    this.invalidateCache();
    const service = await this.getServiceById(id);
    return this.prisma.service.update({
      where: { id },
      data: { active: !service.active },
    });
  }

  async deleteService(id: string) {
    this.invalidateCache();
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
