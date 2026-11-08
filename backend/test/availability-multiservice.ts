import { AppointmentsService } from '../src/appointments/appointments.service';

async function runTest() {
  console.log('--- TEST: AppointmentsService Disponibilidad y Multi-Servicio ---');

  const mockPrisma: any = {
    service: {
      findMany: async () => [
        { id: 'srv-1', name: 'Uñas Acrílicas', price: 90000, duration: 60, active: true },
        { id: 'srv-2', name: 'Lifting Pestañas', price: 60000, duration: 45, active: true },
      ],
      findUnique: async ({ where }: any) => ({
        id: where.id || 'srv-1',
        name: 'Uñas Acrílicas',
        price: 90000,
        duration: 60,
        active: true,
      }),
    },
    teamMember: {
      findMany: async () => [
        { id: 'spec-1', name: 'Catheryne Ríos', active: true, commissionRate: 45 },
        { id: 'spec-2', name: 'Valentina', active: true, commissionRate: 40 },
      ],
      findUnique: async ({ where }: any) => ({
        id: where.id || 'spec-1',
        name: 'Catheryne Ríos',
        active: true,
        commissionRate: 45,
      }),
    },
    appointment: {
      findMany: async () => [],
      findFirst: async () => null,
      create: async ({ data }: any) => ({ id: 'app-mock-123', ...data }),
    },
    client: {
      upsert: async () => ({ id: 'cli-mock-1', name: 'María Gómez', phone: '3001234567' }),
    },
  };

  const service = new AppointmentsService(mockPrisma);

  if (typeof (service as any).getAvailability !== 'function') {
    throw new Error('FAIL: getAvailability no está definido en AppointmentsService');
  }

  const avail = await (service as any).getAvailability('2026-11-20', 105, 'spec-1');
  console.log('Available slots count:', avail.availableSlots?.length);
  if (!avail.availableSlots || avail.availableSlots.length === 0) {
    throw new Error('FAIL: expected available slots');
  }

  const booked = await service.bookAppointment({
    clientName: 'María Gómez',
    clientPhone: '3001234567',
    serviceIds: ['srv-1', 'srv-2'],
    serviceId: 'srv-1',
    specialistId: 'spec-1',
    date: '2026-11-20',
    time: '10:00 AM',
  } as any);

  console.log('Booked Service Name:', booked.serviceName);
  console.log('Booked Price:', booked.price);
  if (!booked.serviceName.includes('Uñas Acrílicas') || !booked.serviceName.includes('Lifting Pestañas')) {
    throw new Error('FAIL: serviceName did not combine multi-services');
  }
  if (booked.price !== 150000) {
    throw new Error(`FAIL: expected price 150000, got ${booked.price}`);
  }

  console.log('SUCCESS: All tests in availability-multiservice passed!');
}

runTest().catch(err => {
  console.error(err.message);
  process.exit(1);
});
