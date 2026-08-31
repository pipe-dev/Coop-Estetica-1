import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos iniciales (Seed)...');

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const defaultMasterPinHash = await bcrypt.hash('2026', 10);

  // 1. Configuración del Negocio
  await prisma.businessConfig.upsert({
    where: { id: 'singleton' },
    update: {},
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
      masterPinHash: defaultMasterPinHash,
    },
  });

  // 2. Equipo de Especialistas
  const catheryneTeam = await prisma.teamMember.upsert({
    where: { id: 'team-1' },
    update: {},
    create: {
      id: 'team-1',
      name: 'Catheryne Ríos',
      role: 'Directora & Esteticista Máster',
      phone: '3006269056',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
      bio: 'Especialista en dermocosmética y estética avanzada con más de 10 años de experiencia.',
      experience: '10 años',
      color: '#D4AF37',
      commissionRate: 50,
      active: true,
    },
  });

  const valentinaTeam = await prisma.teamMember.upsert({
    where: { id: 'team-2' },
    update: {},
    create: {
      id: 'team-2',
      name: 'Valentina Silva',
      role: 'Especialista en Uñas & Manicura Rusa',
      phone: '3012345678',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop',
      bio: 'Máster en técnicas rusas, nivelación con rubber y diseño de autor.',
      experience: '6 años',
      color: '#EC4899',
      commissionRate: 40,
      active: true,
    },
  });

  const camilaTeam = await prisma.teamMember.upsert({
    where: { id: 'team-3' },
    update: {},
    create: {
      id: 'team-3',
      name: 'Camila Torres',
      role: 'Cosmiatra & Masajista Spa',
      phone: '3029876543',
      avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=400&auto=format&fit=crop',
      bio: 'Experta en masajes relajantes, drenaje linfático y aparatología estética.',
      experience: '5 años',
      color: '#8B5CF6',
      commissionRate: 45,
      active: true,
    },
  });

  // 3. Usuarios del Sistema (3 Roles)
  // Rol Dueña (Catheryne)
  await prisma.user.upsert({
    where: { email: 'duena@catherynerios.com' },
    update: {},
    create: {
      email: 'duena@catherynerios.com',
      passwordHash: defaultPasswordHash,
      name: 'Catheryne Ríos (Dueña)',
      role: Role.OWNER,
      teamMemberId: catheryneTeam.id,
      active: true,
    },
  });

  // Rol Administradora
  await prisma.user.upsert({
    where: { email: 'admin@catherynerios.com' },
    update: {},
    create: {
      email: 'admin@catherynerios.com',
      passwordHash: defaultPasswordHash,
      name: 'Recepcionista Encargada',
      role: Role.ADMIN,
      active: true,
    },
  });

  // Rol Especialista (Valentina)
  await prisma.user.upsert({
    where: { email: 'valentina@catherynerios.com' },
    update: {},
    create: {
      email: 'valentina@catherynerios.com',
      passwordHash: defaultPasswordHash,
      name: 'Valentina Silva',
      role: Role.SPECIALIST,
      teamMemberId: valentinaTeam.id,
      active: true,
    },
  });

  // 4. Categorías & Servicios
  const catUnas = await prisma.serviceCategory.upsert({
    where: { id: 'cat-unas' },
    update: {},
    create: {
      id: 'cat-unas',
      name: 'Manos & Uñas',
      description: 'Cuidado y embellecimiento de manos con técnicas europeas',
      image: '/images/service_nails.png',
      order: 1,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'srv-1' },
    update: {},
    create: {
      id: 'srv-1',
      categoryId: catUnas.id,
      name: 'Manicura Rusa VIP',
      price: 120000,
      duration: 60,
      description: 'Técnica en seco con torno de precisión, corte de cutícula milimétrico y esmaltado semipermanente bajo cutícula.',
      includes: 'Exfoliación con sales minerales, hidratación profunda con aceite de almendras y masaje manual.',
      active: true,
    },
  });

  const catFacial = await prisma.serviceCategory.upsert({
    where: { id: 'cat-facial' },
    update: {},
    create: {
      id: 'cat-facial',
      name: 'Rostro & Faciales',
      description: 'Tratamientos dermatológicos para revitalizar y rejuvenecer',
      image: '/images/service_facial.png',
      order: 2,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'srv-2' },
    update: {},
    create: {
      id: 'srv-2',
      categoryId: catFacial.id,
      name: 'Limpieza Facial Profunda',
      price: 180000,
      duration: 90,
      description: 'Desintoxicación cutánea con vapor de ozono, microdermoabrasión con punta de diamante y velo de colágeno.',
      includes: 'Diagnóstico facial con lámpara de Wood, extracción ultrasónica y fototerapia LED.',
      active: true,
    },
  });

  // 5. Productos de la Tienda
  await prisma.product.upsert({
    where: { id: 'prod-1' },
    update: {},
    create: {
      id: 'prod-1',
      name: 'Elixir Facial Oro & Ácido Hialurónico',
      brand: 'Catheryne Ríos Luxury',
      category: 'facial',
      price: 125000,
      salePrice: 110000,
      stock: 15,
      description: 'Sérum ultra concentrado con micropartículas de oro de 24k y ácido hialurónico multimolecular.',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
      featured: true,
      status: 'Disponible',
      active: true,
    },
  });

  // 6. Membresías VIP
  await prisma.membership.upsert({
    where: { id: 'plata' },
    update: {},
    create: {
      id: 'plata',
      name: 'Plata',
      price: 99900,
      popular: false,
      color: '#C0C0C0',
      features: [
        '1 servicio básico al mes (manicura o pedicura clásica)',
        '10% de descuento en servicios adicionales',
        'Acceso a promociones exclusivas para miembros',
        'Bebida de cortesía en cada visita',
        'Reserva prioritaria por WhatsApp',
      ],
      active: true,
    },
  });

  await prisma.membership.upsert({
    where: { id: 'oro' },
    update: {},
    create: {
      id: 'oro',
      name: 'Oro',
      price: 199900,
      popular: true,
      color: '#D4AF37',
      features: [
        '2 servicios al mes (manicura, pedicura o facial)',
        '20% de descuento en todos los servicios',
        'Acceso anticipado a nuevos tratamientos',
        '1 clase de automaquillaje gratis al trimestre',
        'Bebida premium y snack de cortesía',
        'Estacionamiento preferente',
        'Regalo sorpresa en tu cumpleaños',
      ],
      active: true,
    },
  });

  await prisma.membership.upsert({
    where: { id: 'platino' },
    update: {},
    create: {
      id: 'platino',
      name: 'Platino',
      price: 349900,
      popular: false,
      color: '#E5E4E2',
      features: [
        '4 servicios al mes de cualquier categoría',
        '30% de descuento en servicios adicionales',
        'Acceso ilimitado a tratamientos express',
        '1 Ritual Áureo Signature gratis al trimestre',
        'Suite privada para tus tratamientos',
        'Kit de productos profesionales de bienvenida',
        'Invitación a eventos VIP y lanzamientos',
        'Servicio de maquillaje de emergencia 24/7',
        'Programa de referidos con bonificación doble',
      ],
      active: true,
    },
  });

  // 7. Días de Cierre Iniciales
  await prisma.closedDate.upsert({
    where: { date: '2026-12-25' },
    update: {},
    create: {
      date: '2026-12-25',
      reason: 'Navidad (Festivo Nacional)',
      type: 'Festivo',
    },
  });

  await prisma.closedDate.upsert({
    where: { date: '2027-01-01' },
    update: {},
    create: {
      date: '2027-01-01',
      reason: 'Año Nuevo (Festivo Nacional)',
      type: 'Festivo',
    },
  });

  console.log('Seed completado exitosamente con 3 roles, catálogo inicial, membresías y festivos.');
}

main()
  .catch((e) => {
    console.error('Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
