export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  x: string;
}

export interface SiteConfig {
  businessName: string;
  logoText: string;
  tagline: string;
  founderName: string;
  founderBio: string;
  city: string;
  whatsappNumber: string;
  telephone: string;
  email: string;
  serviceAreas: string;
  productsPolicyNote: string;
  socialLinks: SocialLinks;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  order: number;
  title: string;
  houseTypeValue: string;
  cleaningTypeValue: string;
  description: string;
  imageUrl: string;
  available: boolean;
  pricingNote: string;
  updatedAt?: string;
}

export interface PricingCategory {
  id: string;
  order: number;
  label: string;
  houseTypeValue: string;
  priceKes: number | null;
  note: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingRequestPayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  locationEstate: string;
  houseType: string;
  preferredDate: string;
  preferredTime: string;
  cleaningType: string;
  productPreference: string;
  instructions: string;
}

export interface BookingRecord extends BookingRequestPayload {
  id: string;
  referenceCode: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PublicSiteData {
  config: SiteConfig;
  services: ServiceItem[];
  pricing: PricingCategory[];
}
