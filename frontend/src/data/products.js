export const categories = [
  { id: 'facial', name: 'Cuidado Facial' },
  { id: 'corporal', name: 'Cuidado Corporal' },
  { id: 'sueros', name: 'Sueros & Elixires' },
  { id: 'kits', name: 'Kits de Regalo' },
];

export const products = [
  {
    id: 1,
    name: 'Elixir Renovador Oro 24K',
    brand: 'ÁUREA LUXURY',
    price: 180000,
    category: 'sueros',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop', // Luxury serum bottle
    rating: 4.9,
    reviews: 128,
    isNew: true,
    isBestseller: true,
    description: 'Nuestro suero estrella infundido con partículas de oro puro para una regeneración celular profunda y un resplandor instantáneo.',
  },
  {
    id: 2,
    name: 'Crema Hidratante de Noche',
    brand: 'LUMIÈRE',
    price: 120000,
    category: 'facial',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop', // Elegant cream jar
    rating: 4.7,
    reviews: 84,
    isNew: false,
    isBestseller: true,
    description: 'Fórmula rica y envolvente que restaura la barrera de hidratación mientras duermes. Amanece con una piel tersa y rejuvenecida.',
  },
  {
    id: 3,
    name: 'Exfoliante Corporal de Perlas',
    brand: 'ÁUREA LUXURY',
    price: 65000,
    category: 'corporal',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop', // Aesthetic scrub
    rating: 4.5,
    reviews: 42,
    isNew: false,
    isBestseller: false,
    description: 'Polvo de perlas micro-molidas que remueven impurezas gentilmente dejando la piel del cuerpo como la seda.',
  },
  {
    id: 4,
    name: 'Aceite Botánico Relajante',
    brand: 'BOTANICA ESSENCE',
    price: 85000,
    category: 'corporal',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop', // Oil bottle
    rating: 4.8,
    reviews: 56,
    isNew: true,
    isBestseller: false,
    description: 'Una mezcla exclusiva de aceites esenciales puros diseñados para relajar los músculos y calmar la mente tras un día largo.',
  },
  {
    id: 5,
    name: 'Mascarilla Detox Arcilla Negra',
    brand: 'LUMIÈRE',
    price: 75000,
    category: 'facial',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop', // Clay mask
    rating: 4.6,
    reviews: 91,
    isNew: false,
    isBestseller: true,
    description: 'Purifica los poros profundamente y extrae toxinas con la arcilla mineral más pura obtenida del fondo marino.',
  },
  {
    id: 6,
    name: 'Kit Experiencia Spa en Casa',
    brand: 'ÁUREA LUXURY',
    price: 280000,
    category: 'kits',
    image: 'https://images.unsplash.com/photo-1608248593856-11f2a333f2c5?q=80&w=600&auto=format&fit=crop', // Spa kit / Gift box
    rating: 5.0,
    reviews: 210,
    isNew: false,
    isBestseller: true,
    description: 'El regalo perfecto. Incluye todos nuestros best-sellers en versión viaje para una experiencia de relajación total en tu propio hogar.',
  },
  {
    id: 7,
    name: 'Contorno de Ojos Iluminador',
    brand: 'LUMIÈRE',
    price: 95000,
    category: 'facial',
    image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop', // Eye cream tube
    rating: 4.4,
    reviews: 38,
    isNew: true,
    isBestseller: false,
    description: 'Reduce la apariencia de ojeras y líneas de expresión con nuestra fórmula de péptidos activos y cafeína pura.',
  }
];
