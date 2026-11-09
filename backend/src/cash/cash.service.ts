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
    specialistId?: string;
    specialistName?: string;
    serviceCategoryId?: string;
    serviceCategoryName?: string;
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
        specialistId: data.specialistId || null,
        specialistName: data.specialistName || null,
        serviceCategoryId: data.serviceCategoryId || null,
        serviceCategoryName: data.serviceCategoryName || null,
      },
    });
  }

  // ----------------------------------------------------
  // SUITE FINANCIERA: 1. PLANILLA DIARIA DE LIQUIDACIÓN
  // ----------------------------------------------------
  async getDailyMatrix(date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const [appointments, specialists, categories, dayTransactions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          date: targetDate,
          status: { notIn: ['Cancelada'] },
        },
        include: {
          service: {
            include: { category: true },
          },
          specialist: true,
        },
        orderBy: { time: 'asc' },
      }),
      this.prisma.teamMember.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceCategory.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: {
          date: {
            gte: new Date(`${targetDate}T00:00:00`),
            lte: new Date(`${targetDate}T23:59:59.999`),
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Mapear filas por procedimiento
    const rows = appointments.map(app => {
      const price = Number(app.price) || 0;
      const commissionAmount = Number(app.commissionAmount) || 0;
      const supplyCost = Number(app.supplyCost) || 0;
      const aestheticAmount = app.aestheticAmount !== null && app.aestheticAmount !== undefined
        ? Number(app.aestheticAmount)
        : (price - commissionAmount);
      const paymentMethod = app.paymentMethod || 'Efectivo';
      const categoryName = app.service?.category?.name || 'Otros';

      return {
        id: app.id,
        clientName: app.clientName,
        serviceName: app.serviceName,
        categoryName,
        categoryId: app.service?.categoryId || null,
        price,
        commissionAmount,
        commissionRate: app.commissionRate,
        supplyCost,
        aestheticAmount,
        specialistId: app.specialistId,
        specialistName: app.specialistName,
        paymentMethod,
        time: app.time,
        status: app.status,
      };
    });

    // Subtotales por especialista
    const specialistTotals: Record<string, { id: string; name: string; totalCommission: number; count: number }> = {};
    specialists.forEach(s => {
      specialistTotals[s.id] = { id: s.id, name: s.name, totalCommission: 0, count: 0 };
    });
    rows.forEach(r => {
      if (specialistTotals[r.specialistId]) {
        specialistTotals[r.specialistId].totalCommission += r.commissionAmount;
        specialistTotals[r.specialistId].count += 1;
      }
    });

    // Gastos y anticipos del día
    const expenses = dayTransactions.filter(
      t => t.type === 'Egreso' && t.category !== 'Anticipo Especialista' && t.category !== 'Liquidación Nómina'
    );
    const advances = dayTransactions.filter(t => t.category === 'Anticipo Especialista');

    const totalGross = rows.reduce((acc, r) => acc + r.price, 0);
    const totalSpecialists = rows.reduce((acc, r) => acc + r.commissionAmount, 0);
    const totalSupplies = rows.reduce((acc, r) => acc + r.supplyCost, 0);
    const subtotalAesthetic = rows.reduce((acc, r) => acc + r.aestheticAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netAesthetic = subtotalAesthetic - totalExpenses;

    const electronicTotal = rows
      .filter(r => r.paymentMethod !== 'Efectivo')
      .reduce((acc, r) => acc + r.price, 0);
    const cashTotal = rows
      .filter(r => r.paymentMethod === 'Efectivo')
      .reduce((acc, r) => acc + r.price, 0);
    const efectivoDelDia = subtotalAesthetic - electronicTotal; // Idéntico a fórmula Excel (Total Día - Transacción)

    return {
      date: targetDate,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      specialists: specialists.map(s => ({ id: s.id, name: s.name })),
      rows,
      specialistTotals,
      expenses,
      advances,
      summary: {
        totalGross,
        totalSpecialists,
        totalSupplies,
        subtotalAesthetic,
        totalExpenses,
        netAesthetic,
        electronicTotal,
        cashTotal,
        efectivoDelDia,
      },
    };
  }

  // ----------------------------------------------------
  // SUITE FINANCIERA: 2. LIBRO MAYOR MENSUAL DE TESORERÍA
  // ----------------------------------------------------
  async getMonthlyLedger(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);

    const monthStr = String(targetMonth).padStart(2, '0');
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    const [appointments, transactions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          date: { startsWith: `${targetYear}-${monthStr}` },
          status: { notIn: ['Cancelada'] },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          date: {
            gte: new Date(`${targetYear}-${monthStr}-01T00:00:00`),
            lte: new Date(`${targetYear}-${monthStr}-${daysInMonth}T23:59:59.999`),
          },
        },
      }),
    ]);

    let runningCash = 0;
    const days: any[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${targetYear}-${monthStr}-${String(d).padStart(2, '0')}`;
      const dayApps = appointments.filter(a => a.date === dayStr);

      const dayTx = transactions.filter(t => {
        const txDateStr = t.date.toISOString().slice(0, 10);
        return txDateStr === dayStr;
      });

      const totalDia = dayApps.reduce((acc, a) => {
        const aesthetic = a.aestheticAmount !== null && a.aestheticAmount !== undefined
          ? Number(a.aestheticAmount)
          : (Number(a.price) - Number(a.commissionAmount));
        return acc + aesthetic;
      }, 0);

      const transaccion = dayApps
        .filter(a => a.paymentMethod !== 'Efectivo')
        .reduce((acc, a) => acc + Number(a.price), 0);

      const gastosDia = dayTx
        .filter(t => t.type === 'Egreso' && t.category !== 'Anticipo Especialista' && t.category !== 'Liquidación Nómina' && t.category !== 'Insumos')
        .reduce((acc, t) => acc + t.amount, 0);

      const gastosSinRegistrar = dayTx
        .filter(t => t.category === 'Ajuste de Caja')
        .reduce((acc, t) => acc + t.amount, 0);

      const payrollCuts = dayTx
        .filter(t => t.category === 'Liquidación Nómina' || t.category === 'Anticipo Especialista')
        .map(t => ({ specialistName: t.specialistName || 'Especialista', amount: t.amount, description: t.description }));

      const supplyRestocks = dayTx
        .filter(t => t.category === 'Insumos')
        .map(t => ({ description: t.description, amount: t.amount }));

      const efectivoDia = (totalDia > 0 || transaccion > 0 || gastosDia > 0)
        ? (totalDia - transaccion - gastosDia)
        : 0;

      const payrollDeductions = payrollCuts.reduce((acc, p) => acc + p.amount, 0);
      const supplyDeductions = supplyRestocks.reduce((acc, s) => acc + s.amount, 0);

      runningCash += (efectivoDia - payrollDeductions - supplyDeductions);

      days.push({
        day: d,
        date: dayStr,
        totalDia,
        transaccion,
        gastosDia,
        gastosSinRegistrar,
        efectivoDia,
        efectivoReal: runningCash,
        payrollCuts,
        supplyRestocks,
        hasActivity: totalDia > 0 || transaccion > 0 || gastosDia > 0 || payrollCuts.length > 0 || supplyRestocks.length > 0,
      });
    }

    const totalMesEstetica = days.reduce((acc, d) => acc + d.totalDia, 0);
    const totalMesTransacciones = days.reduce((acc, d) => acc + d.transaccion, 0);
    const totalMesGastos = days.reduce((acc, d) => acc + d.gastosDia, 0);
    const totalMesEfectivo = days.reduce((acc, d) => acc + d.efectivoDia, 0);

    return {
      year: targetYear,
      month: targetMonth,
      days,
      totals: {
        totalMesEstetica,
        totalMesTransacciones,
        totalMesGastos,
        totalMesEfectivo,
        finalCashBalance: runningCash,
      },
    };
  }

  // ----------------------------------------------------
  // SUITE FINANCIERA: 3. FLUJO PERIÓDICO POR CATEGORÍAS
  // ----------------------------------------------------
  async getCategoryFlow(startDate?: string, endDate?: string) {
    const now = new Date();
    const end = endDate || now.toISOString().slice(0, 10);
    // 7 días atrás por defecto
    const startObj = new Date(now);
    startObj.setDate(startObj.getDate() - 6);
    const start = startDate || startObj.toISOString().slice(0, 10);

    const [categories, appointments, transactions] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: { active: true },
        include: { services: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          date: { gte: start, lte: end },
          status: { notIn: ['Cancelada'] },
        },
        include: {
          service: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          date: {
            gte: new Date(`${start}T00:00:00`),
            lte: new Date(`${end}T23:59:59.999`),
          },
          type: 'Egreso',
        },
      }),
    ]);

    const resultCategories = categories.map(cat => {
      const serviceIds = new Set((cat.services || []).map(s => s.id));
      const catApps = appointments.filter(
        a => serviceIds.has(a.serviceId) || 
             a.service?.categoryId === cat.id || 
             (a.service as any)?.category?.id === cat.id
      );

      // Ingresos por fecha
      const incomeEntries: { date: string; amount: number }[] = [];
      const incomeByDate: Record<string, number> = {};
      catApps.forEach(a => {
        incomeByDate[a.date] = (incomeByDate[a.date] || 0) + Number(a.price);
      });
      Object.keys(incomeByDate).sort().forEach(d => {
        incomeEntries.push({ date: d, amount: incomeByDate[d] });
      });

      // Egresos atribuidos a esta categoría
      const catTransactions = transactions.filter(
        t => t.serviceCategoryId === cat.id || 
             (t.serviceCategoryName && t.serviceCategoryName.toLowerCase().includes(cat.name.toLowerCase())) ||
             (t.description && t.description.toLowerCase().includes(cat.name.toLowerCase()))
      );

      const expenseEntries = catTransactions.map(t => ({
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        amount: t.amount,
      }));

      const totalIncome = incomeEntries.reduce((acc, i) => acc + i.amount, 0);
      const totalExpenses = expenseEntries.reduce((acc, e) => acc + e.amount, 0);
      const netMargin = totalIncome - totalExpenses;

      return {
        id: cat.id,
        name: cat.name,
        totalIncome,
        totalExpenses,
        netMargin,
        incomeEntries,
        expenseEntries,
      };
    });

    const grandTotalIncome = resultCategories.reduce((acc, c) => acc + c.totalIncome, 0);
    const grandTotalExpenses = resultCategories.reduce((acc, c) => acc + c.totalExpenses, 0);
    const grandTotalNet = resultCategories.reduce((acc, c) => acc + c.netMargin, 0);

    return {
      startDate: start,
      endDate: end,
      categories: resultCategories,
      grandTotals: {
        income: grandTotalIncome,
        expenses: grandTotalExpenses,
        net: grandTotalNet,
      },
    };
  }

  // ----------------------------------------------------
  // SUITE FINANCIERA: 4. GASTOS Y ANTICIPOS HELPER METHODS
  // ----------------------------------------------------
  async createExpense(data: {
    amount: number;
    description: string;
    category?: string;
    paymentMethod?: string;
    serviceCategoryId?: string;
    serviceCategoryName?: string;
  }) {
    return this.createTransaction({
      type: 'Egreso',
      amount: data.amount,
      description: data.description,
      category: data.category || 'Gastos Operativos',
      paymentMethod: data.paymentMethod || 'Efectivo',
      serviceCategoryId: data.serviceCategoryId,
      serviceCategoryName: data.serviceCategoryName,
    });
  }

  async createAdvance(data: {
    specialistId: string;
    specialistName: string;
    amount: number;
    notes?: string;
  }) {
    const desc = data.notes ? `Anticipo a ${data.specialistName}: ${data.notes}` : `Anticipo de caja a ${data.specialistName}`;
    return this.createTransaction({
      type: 'Egreso',
      amount: data.amount,
      description: desc,
      category: 'Anticipo Especialista',
      paymentMethod: 'Efectivo',
      specialistId: data.specialistId,
      specialistName: data.specialistName,
    });
  }
}
