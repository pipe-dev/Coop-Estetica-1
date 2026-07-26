// ─────────────────────────────────────────────
// Catheryne Ríos Estética – Catálogo de Servicios (COP - Pesos Colombianos)
// ─────────────────────────────────────────────

export const serviceCategories = [
  // ── Manos & Uñas ──────────────────────────
  {
    id: 'manos-unas',
    name: 'Manos & Uñas',
    description:
      'Tratamientos de manicura profesional y arte en uñas para lucir manos impecables.',
    image: '/images/service_nails.png',
    services: [
      {
        id: 'manicura-clasica',
        name: 'Manicura Clásica',
        description:
          'Limado, cutículas, hidratación y esmaltado tradicional para unas manos cuidadas y elegantes.',
        duration: '45 min',
        price: 35000,
      },
      {
        id: 'manicura-gel',
        name: 'Manicura en Gel',
        description:
          'Aplicación de gel semipermanente con secado UV para un acabado brillante que dura hasta 3 semanas.',
        duration: '60 min',
        price: 55000,
      },
      {
        id: 'unas-acrilicas',
        name: 'Uñas Acrílicas',
        description:
          'Extensión y esculpido de uñas acrílicas personalizadas con diseño a tu elección.',
        duration: '90 min',
        price: 85000,
      },
      {
        id: 'nail-art',
        name: 'Nail Art & Diseño',
        description:
          'Diseños exclusivos con piedras, foil, degradados y técnicas de arte avanzado en uñas.',
        duration: '75 min',
        price: 65000,
      },
      {
        id: 'tratamiento-fortalecedor',
        name: 'Tratamiento Fortalecedor',
        description:
          'Tratamiento intensivo con queratina y vitaminas para reparar y fortalecer uñas débiles o quebradizas.',
        duration: '30 min',
        price: 30000,
      },
    ],
  },

  // ── Pies ───────────────────────────────────
  {
    id: 'pies',
    name: 'Pies',
    description:
      'Pedicura y tratamientos especializados para el cuidado integral de tus pies.',
    image: '/images/service_nails.png',
    services: [
      {
        id: 'pedicura-clasica',
        name: 'Pedicura Clásica',
        description:
          'Corte, limado, exfoliación, hidratación profunda y esmaltado para unos pies suaves y cuidados.',
        duration: '50 min',
        price: 40000,
      },
      {
        id: 'pedicura-spa',
        name: 'Pedicura Spa Premium',
        description:
          'Experiencia completa con baño aromático, mascarilla de parafina, masaje relajante y esmaltado.',
        duration: '75 min',
        price: 65000,
      },
      {
        id: 'pedicura-gel',
        name: 'Pedicura en Gel',
        description:
          'Pedicura completa con aplicación de esmaltado semipermanente de larga duración.',
        duration: '60 min',
        price: 55000,
      },
      {
        id: 'tratamiento-callosidades',
        name: 'Tratamiento de Callosidades',
        description:
          'Eliminación profesional de callosidades y durezas con hidratación intensiva restauradora.',
        duration: '40 min',
        price: 45000,
      },
    ],
  },

  // ── Cabello ────────────────────────────────
  {
    id: 'cabello',
    name: 'Cabello',
    description:
      'Cortes, coloración y tratamientos capilares para transformar tu cabello.',
    image: '/images/service_hair.png',
    services: [
      {
        id: 'corte-dama',
        name: 'Corte & Estilizado',
        description:
          'Corte personalizado con lavado, acondicionamiento y peinado profesional adaptado a tu estilo.',
        duration: '60 min',
        price: 50000,
      },
      {
        id: 'coloracion-completa',
        name: 'Coloración Completa',
        description:
          'Tinte profesional de raíz a puntas con productos de alta gama que protegen la fibra capilar.',
        duration: '120 min',
        price: 120000,
      },
      {
        id: 'balayage-highlights',
        name: 'Balayage & Mechas',
        description:
          'Técnica de iluminación a mano alzada para un efecto natural y dimensional de alto impacto.',
        duration: '150 min',
        price: 180000,
      },
      {
        id: 'tratamiento-keratina',
        name: 'Tratamiento de Keratina',
        description:
          'Alisado y restauración profunda con keratina brasileña para un cabello liso, brillante y sin frizz.',
        duration: '120 min',
        price: 250000,
      },
      {
        id: 'hidratacion-profunda',
        name: 'Hidratación Profunda',
        description:
          'Mascarilla nutritiva con aceites esenciales y vapor de ozono para revitalizar el cabello dañado.',
        duration: '45 min',
        price: 60000,
      },
      {
        id: 'peinado-evento',
        name: 'Peinado para Evento',
        description:
          'Peinado elaborado para bodas, graduaciones y eventos especiales con fijación duradera.',
        duration: '90 min',
        price: 90000,
      },
    ],
  },

  // ── Rostro ─────────────────────────────────
  {
    id: 'rostro',
    name: 'Rostro',
    description:
      'Faciales rejuvenecedores y tratamientos de piel para un rostro radiante.',
    image: '/images/service_facial.png',
    services: [
      {
        id: 'facial-limpieza',
        name: 'Limpieza Facial Profunda',
        description:
          'Extracción, exfoliación enzimática y mascarilla purificante para una piel limpia y renovada.',
        duration: '60 min',
        price: 70000,
      },
      {
        id: 'facial-antiedad',
        name: 'Facial Anti-Edad',
        description:
          'Tratamiento con ácido hialurónico, colágeno y vitamina C para reducir líneas de expresión.',
        duration: '75 min',
        price: 120000,
      },
      {
        id: 'facial-hidratante',
        name: 'Facial Hidratante Áureo',
        description:
          'Hidratación intensiva con partículas de oro y sérum de rosa mosqueta para luminosidad extrema.',
        duration: '60 min',
        price: 95000,
      },
      {
        id: 'microdermoabrasion',
        name: 'Microdermoabrasión',
        description:
          'Renovación celular con cristales de diamante para mejorar textura, tono y reducir manchas.',
        duration: '45 min',
        price: 80000,
      },
      {
        id: 'facial-peeling',
        name: 'Peeling Químico',
        description:
          'Exfoliación química controlada con ácidos AHA/BHA para unificar el tono y estimular la regeneración.',
        duration: '40 min',
        price: 90000,
      },
    ],
  },

  // ── Maquillaje ─────────────────────────────
  {
    id: 'maquillaje',
    name: 'Maquillaje',
    description:
      'Maquillaje profesional para cada ocasión, desde lo natural hasta lo más glamuroso.',
    image: '/images/service_makeup.png',
    services: [
      {
        id: 'maquillaje-social',
        name: 'Maquillaje Social',
        description:
          'Look elegante y sofisticado perfecto para reuniones, cenas y compromisos sociales.',
        duration: '45 min',
        price: 60000,
      },
      {
        id: 'maquillaje-novia',
        name: 'Maquillaje de Novia',
        description:
          'Maquillaje nupcial de larga duración con prueba previa incluida y productos de alta gama.',
        duration: '90 min',
        price: 150000,
      },
      {
        id: 'maquillaje-editorial',
        name: 'Maquillaje Editorial',
        description:
          'Look creativo y artístico para sesiones fotográficas, pasarelas y producciones editoriales.',
        duration: '75 min',
        price: 120000,
      },
      {
        id: 'maquillaje-express',
        name: 'Maquillaje Express',
        description:
          'Retoque rápido y profesional para verte radiante en cualquier momento del día.',
        duration: '25 min',
        price: 35000,
      },
      {
        id: 'clase-automaquillaje',
        name: 'Clase de Automaquillaje',
        description:
          'Sesión personalizada donde aprenderás técnicas profesionales adaptadas a tu tipo de rostro.',
        duration: '120 min',
        price: 100000,
      },
    ],
  },

  // ── Cuerpo ─────────────────────────────────
  {
    id: 'cuerpo',
    name: 'Cuerpo',
    description:
      'Masajes, envolturas y tratamientos corporales para relajar y revitalizar.',
    image: '/images/service_body.png',
    services: [
      {
        id: 'masaje-relajante',
        name: 'Masaje Relajante',
        description:
          'Masaje sueco con aceites esenciales de lavanda para liberar tensión y alcanzar la calma total.',
        duration: '60 min',
        price: 80000,
      },
      {
        id: 'masaje-piedras-calientes',
        name: 'Masaje con Piedras Calientes',
        description:
          'Terapia con piedras volcánicas que combina calor profundo y presión para aliviar contracturas.',
        duration: '75 min',
        price: 110000,
      },
      {
        id: 'exfoliacion-corporal',
        name: 'Exfoliación Corporal',
        description:
          'Scrub con sales minerales del Mar Muerto y aceites nutritivos para una piel sedosa y renovada.',
        duration: '45 min',
        price: 65000,
      },
      {
        id: 'envoltura-chocolate',
        name: 'Envoltura de Chocolate',
        description:
          'Envoltura corporal con cacao puro y manteca de karité que nutre, desintoxica y suaviza la piel.',
        duration: '60 min',
        price: 90000,
      },
      {
        id: 'drenaje-linfatico',
        name: 'Drenaje Linfático',
        description:
          'Masaje especializado de baja presión para estimular la circulación y reducir la retención de líquidos.',
        duration: '60 min',
        price: 95000,
      },
      {
        id: 'ritual-aureo',
        name: 'Ritual Áureo Signature',
        description:
          'Nuestra experiencia insignia: exfoliación con oro, envoltura nutritiva y masaje final con aromaterapia.',
        duration: '120 min',
        price: 280000,
      },
    ],
  },
];
