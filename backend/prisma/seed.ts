import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando reseteo 100% Virgen (Campos en blanco)...');

  // 1. Eliminar datos operativos
  await prisma.transaction.deleteMany();
  await prisma.cashSession.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.closedDate.deleteMany();
  await prisma.securityAuditLog.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teamMember.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const defaultMasterPinHash = await bcrypt.hash('202626', 10);

  // 2. Configuración Base 100% Virgen (Todo en blanco para llenado de la dueña)
  await prisma.businessConfig.upsert({
    where: { id: 'singleton' },
    update: {
      businessName: '',
      whatsappNumber: '',
      phone: '',
      address: '',
      openingHours: '',
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      promoBanner: '',
      ownerEmail: '',
      adminEmail: '',
      masterPinHash: defaultMasterPinHash,
      masterPin: '202626',
      adminPin: '123456',
      specialistPin: '777777',
    },
    create: {
      id: 'singleton',
      businessName: '',
      whatsappNumber: '',
      phone: '',
      address: '',
      openingHours: '',
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      promoBanner: '',
      ownerEmail: '',
      adminEmail: '',
      masterPinHash: defaultMasterPinHash,
      masterPin: '202626',
      adminPin: '123456',
      specialistPin: '777777',
    },
  });

  // 3. No se crean usuarios con correos inventados (Modo 100% Virgen).
  // El acceso al sistema se realiza mediante los PINs maestros configurables (202626 / 123456 / 777777).

  console.log('Base de datos 100% Virgen: Todos los campos en blanco y 0 registros ficticios.');
}

main()
  .catch((e) => {
    console.error('Error al inicializar base de datos limpia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
