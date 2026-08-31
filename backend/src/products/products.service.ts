import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllPublic() {
    return this.prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAdmin() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return product;
  }

  async create(data: {
    name: string;
    brand?: string;
    category: string;
    price: number;
    salePrice?: number;
    stock: number;
    description?: string;
    image?: string;
    featured?: boolean;
  }) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand || 'Catheryne Ríos Luxury',
        category: data.category,
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : null,
        stock: Number(data.stock) || 0,
        description: data.description || '',
        image: data.image || '',
        featured: Boolean(data.featured),
        status: Number(data.stock) > 0 ? 'Disponible' : 'Agotado',
        active: true,
      },
    });
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Producto no encontrado.');

    const newStock = data.stock !== undefined ? Number(data.stock) : exists.stock;
    const newStatus = newStock > 0 ? (data.status || 'Disponible') : 'Agotado';

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
        salePrice: data.salePrice !== undefined ? (data.salePrice ? Number(data.salePrice) : null) : undefined,
        stock: newStock,
        status: newStatus,
      },
    });
  }

  async toggleAvailability(id: string) {
    const prod = await this.getById(id);
    const isAvail = prod.status === 'Disponible' && prod.stock > 0;

    return this.prisma.product.update({
      where: { id },
      data: {
        status: isAvail ? 'Agotado' : 'Disponible',
        stock: isAvail ? 0 : 10,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
