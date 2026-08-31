import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  async getActiveSession() {
    return this.prisma.cashSession.findFirst({
      where: { status: 'Abierta' },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async getAllSessions() {
    return this.prisma.cashSession.findMany({
      include: {
        transactions: true,
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
  }

  async openSession(data: { responsibleId: string; responsibleName: string; initialBase: number; notes?: string }) {
    const active = await this.getActiveSession();
    if (active) {
      throw new BadRequestException('Ya existe un turno de caja abierto en el sistema.');
    }

    return this.prisma.cashSession.create({
      data: {
        responsibleId: data.responsibleId,
        responsibleName: data.responsibleName,
        initialBase: Number(data.initialBase) || 0,
        closingNotes: data.notes || 'Apertura de Turno',
        status: 'Abierta',
      },
    });
  }

  // ----------------------------------------------------
  // ARQUEO CIEGO: Cierre de Turno
  // ----------------------------------------------------
  async closeSession(data: { actualCash: number; notes?: string }) {
    const active = await this.getActiveSession();
    if (!active) {
      throw new BadRequestException('No hay ningún turno de caja abierto para cerrar.');
    }

    // Calcular entradas y salidas en efectivo de este turno
    const cashInflows = active.transactions
      .filter(t => t.type === 'Ingreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((acc, t) => acc + t.amount, 0);

    const cashOutflows = active.transactions
      .filter(t => t.type === 'Egreso' && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((acc, t) => acc + t.amount, 0);

    const expectedCash = active.initialBase + cashInflows - cashOutflows;
    const realCash = Number(data.actualCash) || 0;
    const difference = realCash - expectedCash;
    const isPerfect = difference === 0;

    return this.prisma.cashSession.update({
      where: { id: active.id },
      data: {
        actualCash: realCash,
        difference,
        status: 'Cerrada',
        isReconciled: isPerfect,
        reconciliationStatus: isPerfect ? 'Cuadrada Perfecta' : 'Pendiente Reconciliación',
        closingNotes: data.notes || '',
        closedAt: new Date(),
      },
    });
  }

  async reconcileSession(id: string, data: { resolutionType: string; amount: number; reason: string; resolvedBy: string }) {
    const session = await this.prisma.cashSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión de caja no encontrada.');

    const recId = `rec-${Date.now()}`;

    // Registrar transacción de ajuste en caja
    await this.prisma.transaction.create({
      data: {
        sessionId: session.id,
        type: data.resolutionType.includes('Sobrante') || data.resolutionType.includes('Reposición') ? 'Ingreso' : 'Egreso',
        amount: Number(data.amount) || 0,
        description: `[Reconciliación de Caja] ${data.resolutionType}: ${data.reason}`,
        category: 'Ajuste de Caja',
        paymentMethod: 'Efectivo',
      },
    });

    return this.prisma.cashSession.update({
      where: { id },
      data: {
        isReconciled: true,
        reconciliationId: recId,
        reconciliationStatus: 'Reconciliada & Cuadrada',
      },
    });
  }

  // ----------------------------------------------------
  // TRANSACCIONES (Ingresos / Egresos)
  // ----------------------------------------------------
  async getTransactions(limit = 100) {
    return this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async createTransaction(data: {
    type: string;
    amount: number;
    description: string;
    category: string;
    paymentMethod: string;
  }) {
    const active = await this.getActiveSession();

    return this.prisma.transaction.create({
      data: {
        sessionId: active?.id || null,
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        category: data.category || 'Servicios',
        paymentMethod: data.paymentMethod || 'Efectivo',
      },
    });
  }
}
