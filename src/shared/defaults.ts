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

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  businessName: 'Lucy Clean & Care',
  logoText: 'LUCY CLEAN & CARE',
  tagline: 'A cleaner home, a happier you.',
  founderName: 'Lucy Auma Aluoch',
  founderBio:
    'Lucy Clean & Care is led directly by its founder, Lucy Auma Aluoch, starting as a small, dedicated residential cleaning operation in Roysambu, Nairobi. Every booking receives personal attention, respectful home care, and clear communication from start to finish.',
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
  },
];

export const DEFAULT_PRICING: PricingCategory[] = [
  {
    id: 'bedsitter',
    label: 'Bedsitter',
    houseTypeValue: 'Bedsitter',
    priceKes: null,
    note: 'Covers main living space, kitchenette, and bathroom',
  },
  {
    id: 'one-bedroom',
    label: 'One bedroom',
    houseTypeValue: 'One Bedroom',
    priceKes: null,
    note: 'Covers bedroom, living room, kitchen, and bathroom',
  },
  {
    id: 'two-bedrooms',
    label: 'Two bedrooms',
    houseTypeValue: 'Two Bedrooms',
    priceKes: null,
    note: 'Covers two bedrooms, lounge/dining, kitchen, and bathrooms',
  },
  {
    id: 'three-bedrooms',
    label: 'Three bedrooms',
    houseTypeValue: 'Three Bedrooms',
    priceKes: null,
    note: 'Covers three bedrooms, living areas, kitchen, and bathrooms',
  },
  {
    id: 'four-bedrooms-plus',
    label: 'Four bedrooms and above',
    houseTypeValue: 'Four Bedrooms and Above',
    priceKes: null,
    note: 'Tailored quotation based on rooms, floors, and requirements',
  },
];
