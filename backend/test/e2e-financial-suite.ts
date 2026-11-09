import { CashService } from '../src/cash/cash.service';
import { ServicesService } from '../src/services/services.service';
import { AppointmentsService } from '../src/appointments/appointments.service';

async function runE2EFinancialSuite() {
  console.log('=== E2E TEST: Suite Financiera y Operativa Completa ===');

  const testDate = '2026-09-12';
  let serviceStore: any[] = [];
  let appointmentStore: any[] = [];
  let transactionStore: any[] = [];

  const mockPrisma: any = {
    service: {
      create: async ({ data }: any) => {
        const s = { id: `srv-${Date.now()}`, ...data };
        serviceStore.push(s);
        return s;
      },
      findUnique: async ({ where }: any) => serviceStore.find(s => s.id === where.id),
      findMany: async () => serviceStore,
    },
    serviceCategory: {
      findMany: async () => [
        { id: 'cat-unas', name: 'UÑAS', order: 1, services: serviceStore },
        { id: 'cat-peluqueria', name: 'PELUQUERÍA', order: 2, services: [] },
      ],
    },
    teamMember: {
      findMany: async () => [
        { id: 'spec-diana', name: 'Diana', active: true, commissionRate: 50 },
        { id: 'spec-edith', name: 'Edith', active: true, commissionRate: 50 },
      ],
    },
    appointment: {
      create: async (args: any) => {
        const payload = args.data || args;
        const a = { id: `app-${Date.now()}`, ...payload };
        appointmentStore.push(a);
        return a;
      },
      findUnique: async ({ where }: any) => appointmentStore.find(a => a.id === where.id),
      findMany: async (args: any) => {
        const where = args?.where;
        return appointmentStore.filter(a => {
          if (where?.status?.notIn && Array.isArray(where.status.notIn) && where.status.notIn.includes(a.status)) {
            return false;
          }
          if (where?.date) {
            if (typeof where.date === 'string' && a.date !== where.date) return false;
            if (typeof where.date === 'object') {
              if (where.date.gte && a.date < where.date.gte) return false;
              if (where.date.lte && a.date > where.date.lte) return false;
              if (where.date.startsWith && !a.date.startsWith(where.date.startsWith)) return false;
            }
          }
          return true;
        }).map(a => ({
          ...a,
          service: serviceStore.find(s => s.id === a.serviceId) || {
            categoryId: 'cat-unas',
            category: { id: 'cat-unas', name: 'UÑAS' }
          },
        }));
      },
      update: async ({ where, data }: any) => {
        const idx = appointmentStore.findIndex(a => a.id === where.id);
        if (idx >= 0) {
          appointmentStore[idx] = { ...appointmentStore[idx], ...data };
          return appointmentStore[idx];
        }
        return null;
      },
    },
    transaction: {
      create: async ({ data }: any) => {
        const t = { id: `tx-${Date.now()}`, ...data, date: new Date(data.date || `${testDate}T12:00:00`) };
        transactionStore.push(t);
        return t;
      },
      findMany: async () => transactionStore,
    },
    cashSession: {
      findFirst: async () => ({ id: 'session-e2e', status: 'Abierta', initialBase: 100000 }),
    },
  };

  const servicesService = new ServicesService(mockPrisma);
  const appointmentsService = new AppointmentsService(mockPrisma);
  const cashService = new CashService(mockPrisma);

  // 1. Crear Servicio con supplyCost ($2.000)
  console.log('Paso 1: Creando servicio "Press On" con costo de insumo de $2.000...');
  const service = await servicesService.createService({
    name: 'Press On',
    categoryId: 'cat-unas',
    price: 80000,
    duration: 90,
    supplyCost: 2000,
  });
  if (service.supplyCost !== 2000) throw new Error('FAIL: Costo de insumo debe ser 2000');
  console.log('✓ Servicio creado:', service.name, 'Precio:', service.price, 'Insumo:', service.supplyCost);

  // 2. Registrar Cita y Cobrarla
  console.log('Paso 2: Agendando y cobrando cita con comisión 50% e insumos...');
  const app = await mockPrisma.appointment.create({
    data: {
      clientName: 'Camila Torres',
      clientPhone: '3001234567',
      serviceId: service.id,
      serviceName: service.name,
      specialistId: 'spec-diana',
      specialistName: 'Diana',
      date: testDate,
      time: '10:00 AM',
      price: 80000,
      commissionAmount: 0,
      status: 'Reservada',
    },
  });

  const checkedOutApp = await appointmentsService.updateStatus(
    app.id,
    'Pagada',
    { role: 'OWNER' },
    {
      commissionRate: 50,
      commissionAmount: 40000,
      supplyCost: 2000,
      aestheticAmount: 40000,
      paymentMethod: 'Transferencia',
    }
  );
  if (checkedOutApp.status !== 'Pagada' || checkedOutApp.commissionAmount !== 40000) {
    throw new Error('FAIL: Cita no liquidada correctamente');
  }
  console.log('✓ Cita cobrada:', checkedOutApp.serviceName, 'Diana:', checkedOutApp.commissionAmount, 'Estética:', checkedOutApp.aestheticAmount);

  // 3. Registrar Gasto Operativo de Caja
  console.log('Paso 3: Registrando gasto operativo de $9.000 (Ambientador y bolsas)...');
  const expense = await cashService.createExpense({
    amount: 9000,
    description: 'AMBIE, BOLSAS BASURA',
    category: 'Gastos Operativos',
    paymentMethod: 'Efectivo',
  });
  if (expense.amount !== 9000) throw new Error('FAIL: Gasto debe ser 9000');
  console.log('✓ Gasto registrado:', expense.description, expense.amount);

  // 4. Registrar Anticipo a Especialista
  console.log('Paso 4: Entregando anticipo de $15.000 a Diana...');
  const advance = await cashService.createAdvance({
    specialistId: 'spec-diana',
    specialistName: 'Diana',
    amount: 15000,
    notes: 'Transporte y almuerzo',
  });
  if (advance.amount !== 15000) throw new Error('FAIL: Anticipo debe ser 15000');
  console.log('✓ Anticipo registrado a:', advance.specialistName, advance.amount);

  // 5. Consultar y Verificar Planilla Diaria
  console.log('Paso 5: Consultando Planilla Diaria...');
  const matrix = await cashService.getDailyMatrix(testDate);
  console.log('Summary Planilla Diaria:', matrix.summary);
  if (matrix.summary.totalGross !== 80000) throw new Error('FAIL: totalGross debe ser 80000');
  if (matrix.summary.totalSpecialists !== 40000) throw new Error('FAIL: totalSpecialists debe ser 40000');
  if (matrix.summary.totalSupplies !== 2000) throw new Error('FAIL: totalSupplies debe ser 2000');
  if (matrix.summary.subtotalAesthetic !== 40000) throw new Error('FAIL: subtotalAesthetic debe ser 40000');
  if (matrix.summary.totalExpenses !== 9000) throw new Error('FAIL: totalExpenses debe ser 9000');
  if (matrix.summary.netAesthetic !== 31000) throw new Error('FAIL: netAesthetic debe ser 31000');
  if (matrix.summary.electronicTotal !== 80000) throw new Error('FAIL: electronicTotal debe ser 80000');
  if (matrix.advances.length !== 1 || matrix.advances[0].amount !== 15000) {
    throw new Error('FAIL: Anticipos debe contener 1 por $15.000');
  }
  console.log('✓ Planilla Diaria validada al 100%');

  // 6. Consultar y Verificar Libro Mensual
  console.log('Paso 6: Consultando Libro Mensual de Septiembre 2026...');
  const ledger = await cashService.getMonthlyLedger(2026, 9);
  const day12 = ledger.days.find((d: any) => d.day === 12);
  if (!day12) throw new Error('FAIL: Día 12 no existe en el libro mensual');
  if (day12.totalDia !== 40000) throw new Error(`FAIL: totalDia esperado 40000, obtenido ${day12.totalDia}`);
  if (day12.transaccion !== 80000) throw new Error(`FAIL: transaccion esperado 80000, obtenido ${day12.transaccion}`);
  if (day12.gastosDia !== 9000) throw new Error(`FAIL: gastosDia esperado 9000, obtenido ${day12.gastosDia}`);
  console.log('✓ Libro Mensual validado al 100%');

  // 7. Consultar y Verificar Flujo por Categorías
  console.log('Paso 7: Consultando Flujo por Categorías...');
  const categoryFlow = await cashService.getCategoryFlow('2026-09-01', '2026-09-30');
  const unas = categoryFlow.categories.find((c: any) => c.name === 'UÑAS');
  if (!unas || unas.totalIncome !== 80000) {
    throw new Error(`FAIL: Ingresos de UÑAS esperado 80000, obtenido ${unas?.totalIncome}`);
  }
  console.log('✓ Flujo por Categorías validado al 100%');

  console.log('🎉 TODOS LOS TESTS E2E DE LA SUITE FINANCIERA PASARON CON ÉXITO ROTUNDO');
}

runE2EFinancialSuite().catch(err => {
  console.error('ERROR EN TEST E2E:', err);
  process.exit(1);
});
