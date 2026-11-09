import { ServicesService } from '../src/services/services.service';
import { AppointmentsService } from '../src/appointments/appointments.service';

async function testSchemaExtensions() {
  console.log('=== TEST: Extensiones de Esquema para la Suite Financiera ===');

  let savedService: any = null;
  let savedAppointment: any = {
    id: 'app-1',
    serviceName: 'Manos Tradicional',
    price: 34000,
    specialistId: 'spec-1',
    status: 'Reservada',
  };

  const mockPrisma: any = {
    service: {
      create: async ({ data }: any) => {
        savedService = { id: 'srv-1', ...data };
        return savedService;
      },
      update: async ({ data }: any) => {
        savedService = { ...savedService, ...data };
        return savedService;
      },
      findUnique: async () => savedService,
    },
    appointment: {
      findUnique: async () => savedAppointment,
      update: async ({ data }: any) => {
        savedAppointment = { ...savedAppointment, ...data };
        return savedAppointment;
      },
    },
  };

  const servicesService = new ServicesService(mockPrisma);
  const created = await servicesService.createService({
    name: 'Press On',
    categoryId: 'cat-unas',
    price: 80000,
    duration: 90,
    supplyCost: 2000,
  });

  if (created.supplyCost !== 2000) {
    throw new Error('FAIL: supplyCost en Service debe ser 2000');
  }
  console.log('✓ Creación de Servicio con supplyCost verificado:', created.supplyCost);

  const appointmentsService = new AppointmentsService(mockPrisma);

  const updatedApp = await appointmentsService.updateStatus(
    'app-1',
    'Pagada',
    { role: 'OWNER' },
    {
      commissionAmount: 40000,
      commissionRate: 50,
      supplyCost: 2000,
      aestheticAmount: 40000,
      paymentMethod: 'Transferencia',
    }
  );

  if (updatedApp.status !== 'Pagada') throw new Error('FAIL: Status debe ser Pagada');
  if (updatedApp.supplyCost !== 2000) throw new Error('FAIL: supplyCost debe ser 2000');
  if (updatedApp.aestheticAmount !== 40000) throw new Error('FAIL: aestheticAmount debe ser 40000');
  if (updatedApp.paymentMethod !== 'Transferencia') throw new Error('FAIL: paymentMethod debe ser Transferencia');

  console.log('✓ Cobro de Cita con metadatos financieros verificado:', updatedApp);
  console.log('🎉 TEST DE ESQUEMA COMPLETADO CON ÉXITO');
}

testSchemaExtensions().catch(err => {
  console.error('ERROR EN TEST DE ESQUEMA:', err);
  process.exit(1);
});
