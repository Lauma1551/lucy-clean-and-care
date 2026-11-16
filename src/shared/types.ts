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

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

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
  whatsappConsent: boolean;
}

export interface BookingRecord extends BookingRequestPayload {
  id: string;
  referenceCode: string;
  status: BookingStatus;
  sentNotificationKeys?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type BookingChangeRequestType = 'reschedule' | 'cancel';
export type BookingChangeRequestStatus = 'pending' | 'reviewed' | 'completed';

export interface BookingChangeRequestPayload {
  referenceCode: string;
  phoneNumber: string;
  requestType: BookingChangeRequestType;
  requestedDate: string;
  requestedTime: string;
  reason: string;
}

export interface BookingChangeRequestRecord extends BookingChangeRequestPayload {
  id: string;
  status: BookingChangeRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export type WhatsAppNotificationEvent =
  | 'owner_new_booking'
  | 'owner_cancel_request'
  | 'owner_reschedule_request'
  | 'customer_confirmed'
  | 'customer_rescheduled'
  | 'customer_cancelled';

export interface WhatsAppNotificationRequest {
  event: WhatsAppNotificationEvent;
  idempotencyKey: string;
  referenceCode: string;
  customerName?: string;
  customerPhone?: string;
  locationEstate?: string;
  houseType?: string;
  cleaningType?: string;
  preferredDate?: string;
  preferredTime?: string;
  requestedDate?: string;
  requestedTime?: string;
  productPreference?: string;
  reason?: string;
  whatsappConsent?: boolean;
}

export interface WhatsAppNotificationResponse {
  ok: boolean;
  sent: boolean;
  status:
    | 'sent'
    | 'deduplicated'
    | 'skipped_no_consent'
    | 'provider_not_configured'
    | 'invalid_recipient'
    | 'provider_error';
  message: string;
  messageId?: string;
}

export interface PublicSiteData {
  config: SiteConfig;
  services: ServiceItem[];
  pricing: PricingCategory[];
}
