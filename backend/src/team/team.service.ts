import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getAllPublic() {
    return this.prisma.teamMember.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        experience: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAllAdmin() {
    return this.prisma.teamMember.findMany({
      include: {
        user: { select: { id: true, email: true, active: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    role: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    experience?: string;
    color?: string;
    commissionRate?: number;
  }) {
    return this.prisma.teamMember.create({
      data: {
        name: data.name,
        role: data.role,
        phone: data.phone || '',
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=D4AF37&color=fff`,
        bio: data.bio || '',
        experience: data.experience || '3 años',
        color: data.color || '#D4AF37',
        commissionRate: Number(data.commissionRate) || 45,
        active: true,
      },
    });
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Especialista no encontrada.');

    return this.prisma.teamMember.update({
      where: { id },
      data: {
        ...data,
        commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }
}
