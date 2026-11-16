import type { PricingCategory, ServiceItem, SiteConfig } from './types.ts';

export const HERO_IMAGE_URL = '/src/assets/images/hero_founder_cleaning.jpg';
export const FOUNDER_IMAGE_URL = '/src/assets/images/founder_lucy_auma_aluoch.jpg';
export const LOGO_IMAGE_URL = '/src/assets/images/logo_lucy_clean_care_sq.jpg';

export const HOUSE_TYPES = [
  'Bedsitter',
  'One Bedroom',
  'Two Bedrooms',
  'Three Bedrooms',
  'Four Bedrooms and Above',
] as const;

export const CLEANING_TYPES = [
  'Standard Home Cleaning',
  'Deep Cleaning',
  'Kitchen and Bathroom Cleaning',
  'Move-In and Move-Out Cleaning',
] as const;

export const PRODUCT_PREFERENCES = [
  'Lucy Clean & Care brings cleaning products and equipment',
  'Customer provides cleaning products',
] as const;

export const PREFERRED_TIMES = [
  'Morning (8:00 AM – 11:00 AM)',
  'Midday (11:00 AM – 2:00 PM)',
  'Afternoon (2:00 PM – 5:00 PM)',
] as const;

export const DEFAULT_FOUNDER_BIO = [
  "Hello, I'm Lucy, the founder of Lucy Clean & Care.",
  'I started this business with a simple vision: to make homes cleaner, fresher and more comfortable through reliable and thoughtful cleaning services.',
  "I believe every home deserves care and attention, whether it's a bedsitter, a family apartment or a larger residential space.",
  'My goal is to build a cleaning service that customers can trust, one home and one satisfied customer at a time.',
  'Thank you for considering Lucy Clean & Care. I look forward to making your home a little brighter.',
].join('\n\n');

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  businessName: 'Lucy Clean & Care',
  logoText: 'LUCY CLEAN & CARE',
  tagline: 'A cleaner home, a happier you.',
  founderName: 'Lucy Auma Aluoch',
  founderBio: DEFAULT_FOUNDER_BIO,
  city: 'Roysambu, Nairobi, Kenya',
  whatsappNumber: '254746022851',
  telephone: '0746022851',
  email: 'lucycleanandcare@gmail.com',
  serviceAreas: 'Roysambu and nearby estates in Nairobi',
  productsPolicyNote:
    'Choose whether Lucy Clean & Care brings the cleaning products and equipment, or whether you prefer to provide your own cleaning products. Pricing may differ depending on the selected option.',
  socialLinks: {
    instagram: '',
    facebook: '',
    tiktok: 'https://www.tiktok.com/@lucycleanandcare',
    x: '',
  },
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bedsitter',
    order: 1,
    title: 'Bedsitter Cleaning',
    houseTypeValue: 'Bedsitter',
    cleaningTypeValue: 'Standard Home Cleaning',
    description:
      'Thorough care for compact studio living—sweeping, mopping, surface dusting, kitchenette wipe-down, and bathroom sanitising.',
    imageUrl: '/src/assets/images/service_bedsitter_1794804173398.jpg',
    available: true,
    pricingNote: 'Quoted in KES based on condition & supplies',
  },
  {
    id: 'one-bedroom',
    order: 2,
    title: 'One-Bedroom Apartment Cleaning',
    houseTypeValue: 'One Bedroom',
    cleaningTypeValue: 'Standard Home Cleaning',
    description:
      'Complete room-by-room cleaning covering your bedroom, lounge, kitchen counters, and bathroom for an effortlessly tidy week.',
    imageUrl: '/src/assets/images/service_one_bedroom_1794804173510.jpg',
    available: true,
    pricingNote: 'Quoted in KES based on condition & supplies',
  },
  {
    id: 'two-bedroom',
    order: 3,
    title: 'Two-Bedroom Apartment Cleaning',
    houseTypeValue: 'Two Bedrooms',
    cleaningTypeValue: 'Standard Home Cleaning',
    description:
      'Structured cleaning tailored for shared homes and small families, keeping high-traffic living areas, bedrooms, and baths fresh.',
    imageUrl: '/src/assets/images/service_two_bedroom_1794804173770.jpg',
    available: true,
    pricingNote: 'Quoted in KES based on condition & supplies',
  },
  {
    id: 'three-bedroom',
    order: 4,
    title: 'Three-Bedroom Apartment Cleaning',
    houseTypeValue: 'Three Bedrooms',
    cleaningTypeValue: 'Standard Home Cleaning',
    description:
      'Detailed upkeep across spacious apartments—furniture dusting, floor care, dining spaces, kitchen surfaces, and all washrooms.',
    imageUrl: '/src/assets/images/service_three_bedroom_1794804174653.jpg',
    available: true,
    pricingNote: 'Quoted in KES based on condition & supplies',
  },
  {
    id: 'four-bedroom',
    order: 5,
    title: 'Four-Bedroom and Larger House Cleaning',
    houseTypeValue: 'Four Bedrooms and Above',
    cleaningTypeValue: 'Standard Home Cleaning',
    description:
      'Methodical full-house cleaning for townhouses, maisonettes, and family homes, including staircases, hallways, and utility areas.',
    imageUrl: '/src/assets/images/service_four_bedroom_1794804174694.jpg',
    available: true,
    pricingNote: 'Custom KES quotation by rooms & floors',
  },
  {
    id: 'deep-cleaning',
    order: 6,
    title: 'Deep Cleaning',
    houseTypeValue: 'Two Bedrooms',
    cleaningTypeValue: 'Deep Cleaning',
    description:
      'Top-to-bottom intensive cleaning reaching baseboards, window tracks, vents, hard-to-reach corners, and built-up grime.',
    imageUrl: '/src/assets/images/service_deep_cleaning_1794804174520.jpg',
    available: true,
    pricingNote: 'Quoted by home size & intensity',
  },
  {
    id: 'kitchen-bathroom',
    order: 7,
    title: 'Kitchen and Bathroom Cleaning',
    houseTypeValue: 'One Bedroom',
    cleaningTypeValue: 'Kitchen and Bathroom Cleaning',
    description:
      'Focused degreasing and descaling for hobs, hoods, countertops, tiles, sinks, showers, and sanitary fixtures.',
    imageUrl: '/src/assets/images/service_kitchen_bathroom_1794804175765.jpg',
    available: true,
    pricingNote: 'Quoted by room count & condition',
  },
  {
    id: 'move-in-out',
    order: 8,
    title: 'Move-In and Move-Out Cleaning',
    houseTypeValue: 'Two Bedrooms',
    cleaningTypeValue: 'Move-In and Move-Out Cleaning',
    description:
      'Detailed empty-home preparation inside wardrobes, cabinets, walls, windows, and floors before keys are handed over.',
    imageUrl: '/src/assets/images/service_move_in_out_1794804175840.jpg',
    available: true,
    pricingNote: 'Quoted by empty unit size',
  },
];

export const DEFAULT_PRICING: PricingCategory[] = [
  {
    id: 'bedsitter',
    order: 1,
    label: 'Bedsitter',
    houseTypeValue: 'Bedsitter',
    priceKes: null,
    note: 'Covers main living space, kitchenette, and bathroom',
  },
  {
    id: 'one-bedroom',
    order: 2,
    label: 'One bedroom',
    houseTypeValue: 'One Bedroom',
    priceKes: null,
    note: 'Covers bedroom, living room, kitchen, and bathroom',
  },
  {
    id: 'two-bedrooms',
    order: 3,
    label: 'Two bedrooms',
    houseTypeValue: 'Two Bedrooms',
    priceKes: null,
    note: 'Covers two bedrooms, lounge/dining, kitchen, and bathrooms',
  },
  {
    id: 'three-bedrooms',
    order: 4,
    label: 'Three bedrooms',
    houseTypeValue: 'Three Bedrooms',
    priceKes: null,
    note: 'Covers three bedrooms, living areas, kitchen, and bathrooms',
  },
  {
    id: 'four-bedrooms-plus',
    order: 5,
    label: 'Four bedrooms and above',
    houseTypeValue: 'Four Bedrooms and Above',
    priceKes: null,
    note: 'Tailored quotation based on rooms, floors, and requirements',
  },
];
