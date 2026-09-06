import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeString, sanitizePhone, sanitizeEmail } from '../common/utils/sanitizer';

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
    const cleanPhone = sanitizePhone(data.phone);
    const cleanName = sanitizeString(data.name, 100);
    const cleanEmail = data.email ? sanitizeEmail(data.email) : null;
    const cleanNotes = data.notes ? sanitizeString(data.notes, 500) : '';

    return this.prisma.client.upsert({
      where: { phone: cleanPhone },
      update: {
        name: cleanName,
        email: cleanEmail || undefined,
        notes: cleanNotes || undefined,
      },
      create: {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        notes: cleanNotes,
      },
    });
  }

  async updateClient(id: string, data: { name?: string; phone?: string; email?: string; notes?: string; loyaltyPoints?: number }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = sanitizeString(data.name, 100);
    if (data.phone !== undefined) updateData.phone = sanitizePhone(data.phone);
    if (data.email !== undefined) updateData.email = sanitizeEmail(data.email);
    if (data.notes !== undefined) updateData.notes = sanitizeString(data.notes, 500);
    if (data.loyaltyPoints !== undefined) updateData.loyaltyPoints = Number(data.loyaltyPoints) || 0;

    return this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteClient(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
