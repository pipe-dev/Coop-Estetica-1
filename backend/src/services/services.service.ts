import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------
  // CATEGORÍAS
  // ----------------------------------------------------
  async getAllCategories(includeInactive = false) {
    return this.prisma.serviceCategory.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        services: {
          where: includeInactive ? {} : { active: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createCategory(data: { name: string; description?: string; image?: string; order?: number }) {
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

    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  // ----------------------------------------------------
  // SERVICIOS
  // ----------------------------------------------------
  async getAllServices(includeInactive = false) {
    return this.prisma.service.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
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
    const service = await this.getServiceById(id);
    return this.prisma.service.update({
      where: { id },
      data: { active: !service.active },
    });
  }

  async deleteService(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
