import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza total del ecosistema (Modo Virgen)...');

  // 1. Eliminar datos operativos en orden de dependencias
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
  await prisma.user.deleteMany();
  await prisma.teamMember.deleteMany();

  console.log('Tablas operativas vaciadas con éxito.');

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const defaultMasterPinHash = await bcrypt.hash('2026', 10);

  // 2. Configuración Base del Negocio
  await prisma.businessConfig.upsert({
    where: { id: 'singleton' },
    update: {
      businessName: 'Catheryne Ríos Estética',
      whatsappNumber: '3006269056',
      phone: '3006269056',
      address: 'Calle 123 #45-67, Barrio El Prado',
      openingHours: 'Lunes a Sábado: 8:00 AM - 7:00 PM',
      instagramUrl: 'https://instagram.com',
      tiktokUrl: 'https://tiktok.com',
      facebookUrl: 'https://facebook.com',
      promoBanner: 'Reserva tu experiencia de lujo este mes y recibe asesoría facial personalizada.',
      ownerEmail: 'duena@catherynerios.com',
      adminEmail: 'admin@catherynerios.com',
      masterPinHash: defaultMasterPinHash,
    },
    create: {
      id: 'singleton',
      businessName: 'Catheryne Ríos Estética',
      whatsappNumber: '3006269056',
      phone: '3006269056',
      address: 'Calle 123 #45-67, Barrio El Prado',
      openingHours: 'Lunes a Sábado: 8:00 AM - 7:00 PM',
      instagramUrl: 'https://instagram.com',
      tiktokUrl: 'https://tiktok.com',
      facebookUrl: 'https://facebook.com',
      promoBanner: 'Reserva tu experiencia de lujo este mes y recibe asesoría facial personalizada.',
      ownerEmail: 'duena@catherynerios.com',
      adminEmail: 'admin@catherynerios.com',
      masterPinHash: defaultMasterPinHash,
    },
  });

  // 3. Usuarios Administradores Base (Sin datos de prueba asociados)
  await prisma.user.create({
    data: {
      email: 'duena@catherynerios.com',
      passwordHash: defaultPasswordHash,
      name: 'Catheryne Ríos (Dueña)',
      role: Role.OWNER,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@catherynerios.com',
      passwordHash: defaultPasswordHash,
      name: 'Administración & Recepción',
      role: Role.ADMIN,
      active: true,
    },
  });

  console.log('Base de datos en Modo Virgen: Lista para ser alimentada desde el Panel de Administración.');
}

main()
  .catch((e) => {
    console.error('Error al inicializar base de datos limpia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
