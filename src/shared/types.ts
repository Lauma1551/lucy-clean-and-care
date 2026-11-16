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
}

export interface ServiceItem {
  id: string;
  order: number;
  title: string;
  houseTypeValue: string;
  cleaningTypeValue: string;
  description: string;
  imageUrl: string;
}

export interface PricingCategory {
  id: string;
  label: string;
  houseTypeValue: string;
  priceKes: number | null;
  note: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingRequestPayload {
  fullName: string;
  phoneNumber: string;
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
}

export interface PublicSiteData {
  config: SiteConfig;
  services: ServiceItem[];
  pricing: PricingCategory[];
}
