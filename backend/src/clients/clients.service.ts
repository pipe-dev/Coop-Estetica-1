import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getAllClients() {
    return this.prisma.client.findMany({
      include: {
        appointments: {
          select: {
            id: true,
            serviceName: true,
            specialistName: true,
            date: true,
            time: true,
            price: true,
            status: true,
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async getClientById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async createClient(data: { name: string; phone: string; email?: string; notes?: string }) {
    return this.prisma.client.upsert({
      where: { phone: data.phone.trim() },
      update: {
        name: data.name,
        email: data.email || undefined,
        notes: data.notes || undefined,
      },
      create: {
        name: data.name,
        phone: data.phone.trim(),
        email: data.email || null,
        notes: data.notes || '',
      },
    });
  }

  async updateClient(id: string, data: { name?: string; phone?: string; email?: string; notes?: string; loyaltyPoints?: number }) {
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async deleteClient(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
