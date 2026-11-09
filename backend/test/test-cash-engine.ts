import { CashService } from '../src/cash/cash.service';

async function testCashEngine() {
  console.log('=== TEST: Motor de Agregación Financiera (Excel a Web) ===');

  const sampleDate = '2026-09-12';

  // Datos idénticos a la imagen de Excel del 12 de septiembre de 2026:
  // Procedimientos:
  // Peinado ($50k, Edith $25k, Estética $25k)
  // Press on ($80k, Diana $40k, Estética $40k, Insumo $2k, Transf)
  // Manos y pies ($34k, Leidy $17k, Estética $17k, Insumo $2k, Transf)
  const mockAppointments: any[] = [
    {
      id: 'app-1',
      date: sampleDate,
      time: '09:00 AM',
      clientName: 'Cliente 1',
      serviceName: 'Peinado',
      price: 50000,
      commissionAmount: 25000,
      supplyCost: 0,
      aestheticAmount: 25000,
      specialistId: 'spec-edith',
      specialistName: 'Edith',
      paymentMethod: 'Efectivo',
      status: 'Pagada',
      service: { category: { id: 'cat-otros', name: 'OTROS' } },
    },
    {
      id: 'app-2',
      date: sampleDate,
      time: '10:30 AM',
      clientName: 'Cliente 2',
      serviceName: 'Press On',
      price: 80000,
      commissionAmount: 40000,
      supplyCost: 2000,
      aestheticAmount: 40000,
      specialistId: 'spec-diana',
      specialistName: 'Diana',
      paymentMethod: 'Transferencia',
      status: 'Pagada',
      service: { category: { id: 'cat-unas', name: 'UÑAS' } },
    },
    {
      id: 'app-3',
      date: sampleDate,
      time: '12:00 PM',
      clientName: 'Cliente 3',
      serviceName: 'Manos y Pies Trad.',
      price: 34000,
      commissionAmount: 17000,
      supplyCost: 2000,
      aestheticAmount: 17000,
      specialistId: 'spec-leidy',
      specialistName: 'Leidy',
      paymentMethod: 'Transferencia',
      status: 'Pagada',
      service: { category: { id: 'cat-unas', name: 'UÑAS' } },
    },
  ];

  const mockSpecialists: any[] = [
    { id: 'spec-diana', name: 'Diana', active: true },
    { id: 'spec-leidy', name: 'Leidy', active: true },
    { id: 'spec-edith', name: 'Edith', active: true },
  ];

  const mockCategories: any[] = [
    { id: 'cat-unas', name: 'UÑAS', order: 1, services: [{ id: 'srv-press' }, { id: 'srv-trad' }] },
    { id: 'cat-otros', name: 'OTROS', order: 2, services: [{ id: 'srv-pein' }] },
  ];

  // Gastos de la imagen: $9.000 bolsas de basura + $40.000 bono = $49.000
  const mockTransactions: any[] = [
    {
      id: 'tx-1',
      date: new Date(`${sampleDate}T14:00:00`),
      type: 'Egreso',
      amount: 9000,
      description: 'AMBIE, BOLSAS BASURA',
      category: 'Gastos Operativos',
      paymentMethod: 'Efectivo',
    },
    {
      id: 'tx-2',
      date: new Date(`${sampleDate}T16:00:00`),
      type: 'Egreso',
      amount: 40000,
      description: 'BONO',
      category: 'Gastos Operativos',
      paymentMethod: 'Efectivo',
    },
    {
      id: 'tx-3',
      date: new Date(`${sampleDate}T17:00:00`),
      type: 'Egreso',
      amount: 5000,
      description: 'Anticipo de caja a Edith',
      category: 'Anticipo Especialista',
      specialistId: 'spec-edith',
      specialistName: 'Edith',
      paymentMethod: 'Efectivo',
    },
  ];

  const mockPrisma: any = {
    appointment: {
      findMany: async () => mockAppointments,
    },
    teamMember: {
      findMany: async () => mockSpecialists,
    },
    serviceCategory: {
      findMany: async () => mockCategories,
    },
    transaction: {
      findMany: async () => mockTransactions,
      create: async ({ data }: any) => ({ id: `tx-${Date.now()}`, ...data }),
    },
    cashSession: {
      findFirst: async () => ({ id: 'session-1' }),
    },
  };

  const cashService = new CashService(mockPrisma);

  // 1. Probar Planilla Diaria
  console.log('1. Probando cálculo de Planilla Diaria (Daily Matrix)...');
  const dailyMatrix = await cashService.getDailyMatrix(sampleDate);

  // Verificaciones matemáticas
  if (dailyMatrix.summary.totalGross !== 164000) {
    throw new Error(`FAIL: totalGross esperado 164000, obtenido ${dailyMatrix.summary.totalGross}`);
  }
  if (dailyMatrix.summary.totalSpecialists !== 82000) {
    throw new Error(`FAIL: totalSpecialists esperado 82000, obtenido ${dailyMatrix.summary.totalSpecialists}`);
  }
  if (dailyMatrix.summary.subtotalAesthetic !== 82000) {
    throw new Error(`FAIL: subtotalAesthetic esperado 82000, obtenido ${dailyMatrix.summary.subtotalAesthetic}`);
  }
  if (dailyMatrix.summary.totalExpenses !== 49000) {
    throw new Error(`FAIL: totalExpenses esperado 49000, obtenido ${dailyMatrix.summary.totalExpenses}`);
  }
  if (dailyMatrix.summary.netAesthetic !== (82000 - 49000)) {
    throw new Error(`FAIL: netAesthetic esperado 33000, obtenido ${dailyMatrix.summary.netAesthetic}`);
  }
  if (dailyMatrix.advances.length !== 1 || dailyMatrix.advances[0].amount !== 5000) {
    throw new Error('FAIL: Anticipos de especialistas debe contener 1 por $5.000');
  }
  console.log('✓ Planilla Diaria verificada con exactitud matemática:', dailyMatrix.summary);

  // 2. Probar Libro Mensual
  console.log('2. Probando cálculo de Libro Mensual de Tesorería...');
  const monthlyLedger = await cashService.getMonthlyLedger(2026, 9);
  if (!monthlyLedger.days || monthlyLedger.days.length !== 30) {
    throw new Error('FAIL: Septiembre debe tener 30 días en el libro mensual');
  }
  const day12 = monthlyLedger.days.find((d: any) => d.day === 12);
  if (!day12) throw new Error('FAIL: Día 12 no encontrado en libro mensual');
  console.log('✓ Día 12 en Libro Mensual:', {
    totalDia: day12.totalDia,
    transaccion: day12.transaccion,
    gastosDia: day12.gastosDia,
    efectivoDia: day12.efectivoDia,
  });

  // 3. Probar Flujo por Categorías
  console.log('3. Probando Flujo por Categorías...');
  const categoryFlow = await cashService.getCategoryFlow('2026-09-10', '2026-09-15');
  if (!categoryFlow.categories || categoryFlow.categories.length === 0) {
    throw new Error('FAIL: Debe retornar categorías en el flujo');
  }
  const unas = categoryFlow.categories.find((c: any) => c.name === 'UÑAS');
  if (!unas || unas.totalIncome !== 114000) {
    throw new Error(`FAIL: Ingresos de UÑAS esperado 114000, obtenido ${unas?.totalIncome}`);
  }
  console.log('✓ Flujo de UÑAS verificado:', unas);

  console.log('🎉 TODOS LOS TESTS DEL MOTOR FINANCIERO PASARON SATISFACTORIAMENTE');
}

testCashEngine().catch(err => {
  console.error('ERROR EN MOTOR FINANCIERO:', err);
  process.exit(1);
});
