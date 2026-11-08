import { AppointmentsService } from '../src/appointments/appointments.service';

async function runE2EVerification() {
  console.log('=====================================================');
  console.log('⚡ E2E VERIFICACIÓN: MULTI-SERVICIO & COMISIONES VARIABLES');
  console.log('=====================================================');

  const mockDbAppointments: any[] = [];

  const mockPrisma: any = {
    service: {
      findMany: async ({ where }: any) => {
        const allServices = [
          { id: 'srv-uñas', name: 'Uñas Acrílicas Esculpidas', price: 95000, duration: 60, active: true },
          { id: 'srv-pestañas', name: 'Lifting de Pestañas', price: 65000, duration: 45, active: true },
          { id: 'srv-facial', name: 'Limpieza Facial Profunda', price: 120000, duration: 60, active: true },
        ];
        if (where?.id?.in) {
          return allServices.filter(s => where.id.in.includes(s.id));
        }
        return allServices;
      },
      findUnique: async ({ where }: any) => ({
        id: where.id,
        name: 'Uñas Acrílicas Esculpidas',
        price: 95000,
        duration: 60,
        active: true,
      }),
    },
    teamMember: {
      findMany: async () => [
        { id: 'spec-cathy', name: 'Catheryne Ríos', active: true, commissionRate: 50 },
        { id: 'spec-vale', name: 'Valentina Rodríguez', active: true, commissionRate: 40 },
      ],
      findUnique: async ({ where }: any) => {
        if (where.id === 'spec-vale') {
          return { id: 'spec-vale', name: 'Valentina Rodríguez', active: true, commissionRate: 40 };
        }
        return { id: 'spec-cathy', name: 'Catheryne Ríos', active: true, commissionRate: 50 };
      },
    },
    appointment: {
      findMany: async ({ where }: any) => {
        return mockDbAppointments.filter(a => {
          if (where?.date && a.date !== where.date) return false;
          if (where?.status?.notIn && where.status.notIn.includes(a.status)) return false;
          if (where?.specialistId?.in && !where.specialistId.in.includes(a.specialistId)) return false;
          if (where?.specialistId && typeof where.specialistId === 'string' && a.specialistId !== where.specialistId) return false;
          return true;
        });
      },
      findUnique: async ({ where }: any) => {
        return mockDbAppointments.find(a => a.id === where.id) || null;
      },
      findFirst: async () => null,
      create: async ({ data }: any) => {
        const record = { id: `app-e2e-${Date.now()}`, ...data };
        mockDbAppointments.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const item = mockDbAppointments.find(a => a.id === where.id);
        if (item) {
          Object.assign(item, data);
          return item;
        }
        return { id: where.id, ...data };
      },
    },
    client: {
      upsert: async () => ({ id: 'cli-test-1', name: 'Alejandra Pérez', phone: '3157894561' }),
    },
  };

  const service = new AppointmentsService(mockPrisma);

  // PRUEBA 1: Disponibilidad Continua (105 minutos = Uñas + Pestañas)
  console.log('\n[1/3] Consultando horarios continuos para 105 min (Uñas + Pestañas)...');
  const availability = await service.getAvailability('2026-11-25', 105, 'any');
  console.log('✓ Ranuras continuas encontradas:', availability.availableSlots.length);
  console.log('✓ Especialista recomendada por balance de citas:', availability.suggestedSpecialistId);
  if (!availability.availableSlots.includes('10:00 AM')) {
    throw new Error('FALLO: 10:00 AM debería estar disponible en horario laboral');
  }

  // PRUEBA 2: Reserva Atómica Multi-Servicio
  console.log('\n[2/3] Registrando reserva multi-servicio (Uñas + Pestañas)...');
  const appointment = await service.bookAppointment({
    clientName: 'Alejandra Pérez',
    clientPhone: '3157894561',
    clientEmail: 'alejandra@ejemplo.com',
    serviceIds: ['srv-uñas', 'srv-pestañas'],
    specialistId: 'any',
    date: '2026-11-25',
    time: '10:00 AM',
    notes: 'Clienta prefiere tono nude y lifting suave',
  });

  console.log('✓ Cita creada ID:', appointment.id);
  console.log('✓ Tratamientos combinados:', appointment.serviceName);
  console.log('✓ Precio acumulado COP:', appointment.price);
  console.log('✓ Especialista asignada:', appointment.specialistName);

  if (appointment.price !== 160000) {
    throw new Error(`FALLO: Precio esperado 160000, obtenido ${appointment.price}`);
  }
  if (!appointment.serviceName.includes('Uñas Acrílicas') || !appointment.serviceName.includes('Lifting de Pestañas')) {
    throw new Error('FALLO: El nombre no combina los dos tratamientos correctamente');
  }

  // PRUEBA 3: Cobro en Caja con Comisión Variable
  console.log('\n[3/3] Cobrando cita en caja con comisión personalizada ($55.000 COP)...');
  const customCommissionAmount = 55000;
  const customCommissionRate = 34.4;

  const paidAppointment = await service.updateStatus(
    appointment.id,
    'Pagada',
    { role: 'OWNER' },
    { commissionAmount: customCommissionAmount, commissionRate: customCommissionRate, paymentMethod: 'Nequi' }
  );

  console.log('✓ Estado de la cita:', paidAppointment.status);
  console.log('✓ Comisión asignada a especialista:', paidAppointment.commissionAmount);
  console.log('✓ Margen neto para la estética:', paidAppointment.price - paidAppointment.commissionAmount);

  if (paidAppointment.status !== 'Pagada') {
    throw new Error('FALLO: Estado esperado "Pagada"');
  }
  if (paidAppointment.commissionAmount !== customCommissionAmount) {
    throw new Error(`FALLO: Comisión esperada ${customCommissionAmount}, obtenida ${paidAppointment.commissionAmount}`);
  }

  console.log('\n=====================================================');
  console.log('🎉 TODAS LAS PRUEBAS E2E PASARON SATISFACTORIAMENTE!');
  console.log('=====================================================');
}

runE2EVerification().catch(err => {
  console.error('ERROR EN E2E:', err.message);
  process.exit(1);
});
