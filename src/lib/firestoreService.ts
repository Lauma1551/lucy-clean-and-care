import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  CLEANING_TYPES,
  DEFAULT_PRICING,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONFIG,
  HOUSE_TYPES,
  PRODUCT_PREFERENCES,
} from '../shared/defaults.ts';
import type {
  BookingChangeRequestPayload,
  BookingChangeRequestRecord,
  BookingChangeRequestStatus,
  BookingRecord,
  BookingRequestPayload,
  BookingStatus,
  PricingCategory,
  PublicSiteData,
  ServiceItem,
  SiteConfig,
  WhatsAppNotificationRequest,
  WhatsAppNotificationResponse,
} from '../shared/types.ts';
import {
  extractReadableError,
  googleProvider,
  handleFirestoreError,
  OperationType,
  requireAuth,
  requireFirestore,
} from './firebase.ts';

function toIsoString(value: unknown): string | undefined {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function sanitizeOptionalUrl(value: unknown): string {
  const raw = sanitizeText(value, 300);
  if (!raw) return '';
  try {
    const url = new URL(
      raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
    );
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
    return '';
  } catch {
    return '';
  }
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBookingReferenceCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `LCC-${suffix}`;
}

export interface LoadedSiteResult {
  data: PublicSiteData;
  hasFirestoreConfig: boolean;
  hasFirestoreServices: boolean;
  hasFirestorePricing: boolean;
}

export async function fetchPublicSiteData(): Promise<LoadedSiteResult> {
  const firestore = requireFirestore();

  let config = DEFAULT_SITE_CONFIG;
  let services = DEFAULT_SERVICES;
  let pricing = DEFAULT_PRICING;
  let hasFirestoreConfig = false;
  let hasFirestoreServices = false;
  let hasFirestorePricing = false;

  try {
    const configSnap = await getDoc(doc(firestore, 'siteConfig', 'main'));
    if (configSnap.exists()) {
      const raw = configSnap.data() as Partial<SiteConfig> & { updatedAt?: unknown };
      config = {
        ...DEFAULT_SITE_CONFIG,
        ...raw,
        socialLinks: {
          ...DEFAULT_SITE_CONFIG.socialLinks,
          ...(raw.socialLinks || {}),
        },
        updatedAt: toIsoString(raw.updatedAt),
      };
      hasFirestoreConfig = true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'siteConfig/main');
  }

  try {
    const servicesSnap = await getDocs(
      query(collection(firestore, 'services'), orderBy('order', 'asc'))
    );
    if (!servicesSnap.empty) {
      services = servicesSnap.docs.map((snap) => {
        const raw = snap.data() as Partial<ServiceItem> & { updatedAt?: unknown };
        return {
          id: raw.id || snap.id,
          order: typeof raw.order === 'number' ? raw.order : 99,
          title: raw.title || 'Residential Cleaning',
          houseTypeValue: raw.houseTypeValue || HOUSE_TYPES[0],
          cleaningTypeValue: raw.cleaningTypeValue || CLEANING_TYPES[0],
          description: raw.description || '',
          imageUrl: raw.imageUrl || DEFAULT_SERVICES[0].imageUrl,
          available: typeof raw.available === 'boolean' ? raw.available : true,
          pricingNote: typeof raw.pricingNote === 'string' ? raw.pricingNote : '',
          updatedAt: toIsoString(raw.updatedAt),
        };
      });
      hasFirestoreServices = true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
  }

  try {
    const pricingSnap = await getDocs(
      query(collection(firestore, 'pricing'), orderBy('order', 'asc'))
    );
    if (!pricingSnap.empty) {
      pricing = pricingSnap.docs.map((snap) => {
        const raw = snap.data() as Partial<PricingCategory> & { updatedAt?: unknown };
        return {
          id: raw.id || snap.id,
          order: typeof raw.order === 'number' ? raw.order : 99,
          label: raw.label || snap.id,
          houseTypeValue: raw.houseTypeValue || HOUSE_TYPES[0],
          priceKes: typeof raw.priceKes === 'number' ? raw.priceKes : null,
          note: raw.note || '',
          updatedAt: toIsoString(raw.updatedAt),
        };
      });
      hasFirestorePricing = true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'pricing');
  }

  return {
    data: { config, services, pricing },
    hasFirestoreConfig,
    hasFirestoreServices,
    hasFirestorePricing,
  };
}

export function validateBookingPayload(
  payload: BookingRequestPayload
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (payload.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  const phoneDigits = payload.phoneNumber.replace(/[^\d]/g, '');
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phoneNumber = 'Please enter a valid Kenyan or international phone number.';
  }
  const emailTrimmed = payload.email.trim();
  if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'Please enter a valid email address or leave this field blank.';
  }
  if (payload.locationEstate.trim().length < 2) {
    errors.locationEstate = 'Please enter your estate or neighbourhood in Nairobi.';
  }
  if (!HOUSE_TYPES.includes(payload.houseType as (typeof HOUSE_TYPES)[number])) {
    errors.houseType = 'Please select a valid house size.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.preferredDate)) {
    errors.preferredDate = 'Please select a valid preferred cleaning date.';
  }
  if (!payload.preferredTime.trim()) {
    errors.preferredTime = 'Please select a preferred time window.';
  }
  if (!CLEANING_TYPES.includes(payload.cleaningType as (typeof CLEANING_TYPES)[number])) {
    errors.cleaningType = 'Please select the type of cleaning required.';
  }
  if (
    !PRODUCT_PREFERENCES.includes(
      payload.productPreference as (typeof PRODUCT_PREFERENCES)[number]
    )
  ) {
    errors.productPreference = 'Please select your cleaning products preference.';
  }
  return errors;
}

export async function submitCustomerBooking(
  payload: BookingRequestPayload
): Promise<BookingRecord> {
  const firestore = requireFirestore();
  const sanitized: BookingRequestPayload = {
    fullName: sanitizeText(payload.fullName, 120),
    phoneNumber: sanitizeText(payload.phoneNumber, 30),
    email: sanitizeText(payload.email, 120),
    locationEstate: sanitizeText(payload.locationEstate, 160),
    houseType: sanitizeText(payload.houseType, 60),
    preferredDate: sanitizeText(payload.preferredDate, 20),
    preferredTime: sanitizeText(payload.preferredTime, 60),
    cleaningType: sanitizeText(payload.cleaningType, 80),
    productPreference: sanitizeText(payload.productPreference, 120),
    instructions: sanitizeText(payload.instructions, 1000),
    whatsappConsent: Boolean(payload.whatsappConsent),
  };

  const bookingId = crypto.randomUUID();
  const referenceCode = generateBookingReferenceCode();

  try {
    await setDoc(doc(firestore, 'bookings', bookingId), {
      referenceCode,
      ...sanitized,
      sentNotificationKeys: [],
      status: 'pending' as BookingStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookings/${bookingId}`);
  }

  return {
    id: bookingId,
    referenceCode,
    ...sanitized,
    sentNotificationKeys: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function validateBookingChangeRequestPayload(
  payload: BookingChangeRequestPayload
): Record<string, string> {
  const errors: Record<string, string> = {};
  const ref = payload.referenceCode.trim().toUpperCase();
  if (!/^LCC-([A-Z0-9]{6}|[0-9]{4}-[A-Z0-9]{4,8})$/.test(ref)) {
    errors.referenceCode = 'Enter your booking reference in the format LCC-XXXXXX.';
  }
  const phoneDigits = payload.phoneNumber.replace(/[^\d]/g, '');
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phoneNumber = 'Enter the phone number used when booking.';
  }
  if (payload.requestType === 'reschedule') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.requestedDate)) {
      errors.requestedDate = 'Please choose your new preferred date.';
    }
    if (!payload.requestedTime.trim()) {
      errors.requestedTime = 'Please choose your new preferred time window.';
    }
  }
  return errors;
}

export async function submitBookingChangeRequest(
  payload: BookingChangeRequestPayload
): Promise<BookingChangeRequestRecord> {
  const firestore = requireFirestore();
  const requestId = crypto.randomUUID();
  const cleanPayload: BookingChangeRequestPayload = {
    referenceCode: sanitizeText(payload.referenceCode.toUpperCase(), 24),
    phoneNumber: sanitizeText(payload.phoneNumber, 30),
    requestType: payload.requestType === 'cancel' ? 'cancel' : 'reschedule',
    requestedDate:
      payload.requestType === 'reschedule' ? sanitizeText(payload.requestedDate, 10) : '',
    requestedTime:
      payload.requestType === 'reschedule' ? sanitizeText(payload.requestedTime, 60) : '',
    reason: sanitizeText(payload.reason, 500),
  };

  try {
    await setDoc(doc(firestore, 'bookingChangeRequests', requestId), {
      ...cleanPayload,
      status: 'pending' as BookingChangeRequestStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookingChangeRequests/${requestId}`);
  }

  return {
    id: requestId,
    ...cleanPayload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function triggerWhatsAppNotification(
  payload: WhatsAppNotificationRequest,
  options?: { requireOwnerAuth?: boolean }
): Promise<WhatsAppNotificationResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.requireOwnerAuth) {
      const firebaseAuth = requireAuth();
      const user = firebaseAuth.currentUser;
      if (!user) {
        return {
          ok: false,
          sent: false,
          status: 'provider_error',
          message: 'Owner authentication session required to notify customers.',
        };
      }
      const idToken = await user.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }

    const res = await fetch('/api/whatsapp/notify', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => null)) as WhatsAppNotificationResponse | null;
    if (!data) {
      return {
        ok: false,
        sent: false,
        status: 'provider_error',
        message: `Notification service returned HTTP ${res.status}.`,
      };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      sent: false,
      status: 'provider_error',
      message:
        error instanceof Error
          ? error.message
          : 'Could not reach server-side WhatsApp notification endpoint.',
    };
  }
}

export const AUTHORIZED_OWNER_EMAIL = 'aumalucy015@gmail.com';

export function isAuthorizedOwnerAccount(user: User | null | undefined): boolean {
  if (!user || !user.email || user.emailVerified !== true) {
    return false;
  }
  return user.email.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL;
}

function requireAuthorizedOwner(): void {
  const firebaseAuth = requireAuth();
  if (!isAuthorizedOwnerAccount(firebaseAuth.currentUser)) {
    throw new Error(
      'Access denied. Only the authorized business owner account can access or modify private data.'
    );
  }
}

export async function verifyOwnerAccess(): Promise<boolean> {
  const firebaseAuth = requireAuth();
  const firestore = requireFirestore();
  const user = firebaseAuth.currentUser;
  if (!isAuthorizedOwnerAccount(user)) {
    return false;
  }

  try {
    await getDocs(query(collection(firestore, 'bookings'), limit(1)));
    return true;
  } catch {
    return false;
  }
}

export async function signInOwnerWithGoogle(): Promise<{
  email: string;
  authorized: boolean;
}> {
  const firebaseAuth = requireAuth();
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  const signedInEmail = result.user.email || result.user.uid;
  const authorized = await verifyOwnerAccess();
  if (!authorized) {
    await signOut(firebaseAuth).catch(() => {});
    return { email: signedInEmail, authorized: false };
  }
  return { email: signedInEmail, authorized: true };
}

export async function signOutOwner(): Promise<void> {
  const firebaseAuth = requireAuth();
  await signOut(firebaseAuth);
}

export async function ensureInitialFirestoreSeed(): Promise<PublicSiteData | null> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  const status = await fetchPublicSiteData();

  if (status.hasFirestoreConfig && status.hasFirestoreServices && status.hasFirestorePricing) {
    return null;
  }

  const batch = writeBatch(firestore);

  if (!status.hasFirestoreConfig) {
    batch.set(doc(firestore, 'siteConfig', 'main'), {
      ...DEFAULT_SITE_CONFIG,
      updatedAt: serverTimestamp(),
    });
  }

  if (!status.hasFirestoreServices) {
    for (const service of DEFAULT_SERVICES) {
      batch.set(doc(firestore, 'services', service.id), {
        ...service,
        updatedAt: serverTimestamp(),
      });
    }
  }

  if (!status.hasFirestorePricing) {
    for (const tier of DEFAULT_PRICING) {
      batch.set(doc(firestore, 'pricing', tier.id), {
        ...tier,
        updatedAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
    const refreshed = await fetchPublicSiteData();
    return refreshed.data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteConfig/services/pricing');
  }
}

export async function fetchOwnerBookings(): Promise<BookingRecord[]> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  try {
    const snapshot = await getDocs(
      query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map((snap) => {
      const raw = snap.data() as Partial<BookingRecord> & {
        createdAt?: unknown;
        updatedAt?: unknown;
      };
      return {
        id: snap.id,
        referenceCode: raw.referenceCode || snap.id,
        fullName: raw.fullName || '',
        phoneNumber: raw.phoneNumber || '',
        email: raw.email || '',
        locationEstate: raw.locationEstate || '',
        houseType: raw.houseType || HOUSE_TYPES[0],
        preferredDate: raw.preferredDate || '',
        preferredTime: raw.preferredTime || '',
        cleaningType: raw.cleaningType || CLEANING_TYPES[0],
        productPreference: raw.productPreference || PRODUCT_PREFERENCES[0],
        instructions: raw.instructions || '',
        whatsappConsent: Boolean(raw.whatsappConsent),
        sentNotificationKeys: Array.isArray(raw.sentNotificationKeys)
          ? raw.sentNotificationKeys.filter((k): k is string => typeof k === 'string')
          : [],
        status:
          raw.status === 'pending' ||
          raw.status === 'confirmed' ||
          raw.status === 'completed' ||
          raw.status === 'cancelled' ||
          raw.status === 'rejected'
            ? raw.status
            : 'pending',
        createdAt: toIsoString(raw.createdAt) || new Date().toISOString(),
        updatedAt: toIsoString(raw.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookings');
  }
}

export async function fetchOwnerChangeRequests(): Promise<BookingChangeRequestRecord[]> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  try {
    const snapshot = await getDocs(
      query(collection(firestore, 'bookingChangeRequests'), orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map((snap) => {
      const raw = snap.data() as Partial<BookingChangeRequestRecord> & {
        createdAt?: unknown;
        updatedAt?: unknown;
      };
      return {
        id: snap.id,
        referenceCode: raw.referenceCode || '',
        phoneNumber: raw.phoneNumber || '',
        requestType: raw.requestType === 'cancel' ? 'cancel' : 'reschedule',
        requestedDate: raw.requestedDate || '',
        requestedTime: raw.requestedTime || '',
        reason: raw.reason || '',
        status: (raw.status as BookingChangeRequestStatus) || 'pending',
        createdAt: toIsoString(raw.createdAt) || new Date().toISOString(),
        updatedAt: toIsoString(raw.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookingChangeRequests');
  }
}

export async function updateOwnerBookingDetails(
  booking: BookingRecord,
  updates: {
    status?: BookingStatus;
    preferredDate?: string;
    preferredTime?: string;
    appendNotificationKey?: string;
  }
): Promise<BookingRecord> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  const existingKeys = Array.isArray(booking.sentNotificationKeys)
    ? booking.sentNotificationKeys
    : [];
  const nextKeys =
    updates.appendNotificationKey && !existingKeys.includes(updates.appendNotificationKey)
      ? [...existingKeys, updates.appendNotificationKey].slice(-30)
      : existingKeys;

  const allowedStatuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'rejected',
  ];
  const candidateStatus = updates.status ?? booking.status;
  const nextStatus: BookingStatus = allowedStatuses.includes(candidateStatus)
    ? candidateStatus
    : booking.status;
  const nextDate = updates.preferredDate ?? booking.preferredDate;
  const nextTime = updates.preferredTime ?? booking.preferredTime;

  try {
    await updateDoc(doc(firestore, 'bookings', booking.id), {
      status: nextStatus,
      preferredDate: nextDate,
      preferredTime: nextTime,
      whatsappConsent: Boolean(booking.whatsappConsent),
      sentNotificationKeys: nextKeys,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
  }

  return {
    ...booking,
    status: nextStatus,
    preferredDate: nextDate,
    preferredTime: nextTime,
    whatsappConsent: Boolean(booking.whatsappConsent),
    sentNotificationKeys: nextKeys,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateOwnerBookingStatus(
  booking: BookingRecord,
  status: BookingStatus,
  appendNotificationKey?: string
): Promise<BookingRecord> {
  return updateOwnerBookingDetails(booking, { status, appendNotificationKey });
}

export async function updateOwnerChangeRequestStatus(
  requestId: string,
  status: BookingChangeRequestStatus
): Promise<void> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  try {
    await updateDoc(doc(firestore, 'bookingChangeRequests', requestId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookingChangeRequests/${requestId}`);
  }
}

export async function deleteOwnerBooking(bookingId: string): Promise<void> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  try {
    await deleteDoc(doc(firestore, 'bookings', bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `bookings/${bookingId}`);
  }
}

export async function saveOwnerPricing(
  tiers: PricingCategory[],
  deletedIds: string[] = []
): Promise<PricingCategory[]> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  const batch = writeBatch(firestore);
  const nowIso = new Date().toISOString();

  for (const tier of tiers) {
    if (tier.label.trim().length < 2) {
      throw new Error('Each pricing category label must be at least 2 characters.');
    }
    if (tier.priceKes !== null && (!Number.isFinite(tier.priceKes) || tier.priceKes < 0 || tier.priceKes > 1000000)) {
      throw new Error(`Invalid price for "${tier.label}". Enter a value between 0 and 1,000,000 KES or leave blank for Request a Quote.`);
    }
  }

  const sanitizedTiers: PricingCategory[] = tiers.map((tier, idx) => {
    const cleanId =
      sanitizeText(tier.id, 64).replace(/[^a-zA-Z0-9_-]/g, '-') || `tier-${idx + 1}`;
    const priceKes =
      tier.priceKes !== null && Number.isFinite(tier.priceKes) && tier.priceKes >= 0
        ? Math.min(1000000, Math.round(tier.priceKes))
        : null;
    const cleanTier: PricingCategory = {
      id: cleanId,
      order: idx + 1,
      label: sanitizeText(tier.label, 80) || 'Custom Home Size',
      houseTypeValue: sanitizeText(tier.houseTypeValue, 60) || HOUSE_TYPES[0],
      priceKes,
      note: sanitizeText(tier.note, 180),
    };
    batch.set(doc(firestore, 'pricing', cleanId), {
      ...cleanTier,
      updatedAt: serverTimestamp(),
    });
    return { ...cleanTier, updatedAt: nowIso };
  });

  for (const id of deletedIds) {
    const cleanId = sanitizeText(id, 64);
    if (cleanId && /^[a-zA-Z0-9_-]+$/.test(cleanId)) {
      batch.delete(doc(firestore, 'pricing', cleanId));
    }
  }

  try {
    await batch.commit();
    return sanitizedTiers;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'pricing');
  }
}

export async function saveOwnerConfig(input: SiteConfig): Promise<SiteConfig> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();

  if (input.businessName.trim().length < 2) {
    throw new Error('Business name must be at least 2 characters.');
  }
  if (input.founderName.trim().length < 2) {
    throw new Error('Founder name must be at least 2 characters.');
  }
  if (input.founderBio.trim().length < 10) {
    throw new Error('Founder biography must be at least 10 characters.');
  }
  if (input.serviceAreas.trim().length < 2) {
    throw new Error('Service areas must be at least 2 characters.');
  }

  const rawWhatsapp = sanitizeText(input.whatsappNumber, 25).replace(/[^\d]/g, '');

  const cleanConfig: Omit<SiteConfig, 'updatedAt'> = {
    businessName: sanitizeText(input.businessName, 80) || DEFAULT_SITE_CONFIG.businessName,
    logoText: sanitizeText(input.logoText, 80) || DEFAULT_SITE_CONFIG.logoText,
    tagline: sanitizeText(input.tagline, 140) || DEFAULT_SITE_CONFIG.tagline,
    founderName: sanitizeText(input.founderName, 100) || DEFAULT_SITE_CONFIG.founderName,
    founderBio: sanitizeText(input.founderBio, 1500) || DEFAULT_SITE_CONFIG.founderBio,
    city: sanitizeText(input.city, 120) || DEFAULT_SITE_CONFIG.city,
    whatsappNumber: rawWhatsapp,
    telephone: sanitizeText(input.telephone, 40),
    email: sanitizeText(input.email, 120),
    serviceAreas: sanitizeText(input.serviceAreas, 400) || DEFAULT_SITE_CONFIG.serviceAreas,
    productsPolicyNote:
      sanitizeText(input.productsPolicyNote, 400) || DEFAULT_SITE_CONFIG.productsPolicyNote,
    socialLinks: {
      instagram: sanitizeOptionalUrl(input.socialLinks?.instagram),
      facebook: sanitizeOptionalUrl(input.socialLinks?.facebook),
      tiktok: sanitizeOptionalUrl(input.socialLinks?.tiktok),
      x: sanitizeOptionalUrl(input.socialLinks?.x),
    },
  };

  try {
    await setDoc(doc(firestore, 'siteConfig', 'main'), {
      ...cleanConfig,
      updatedAt: serverTimestamp(),
    });
    return {
      ...cleanConfig,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteConfig/main');
  }
}

export async function saveOwnerServices(
  services: ServiceItem[],
  deletedIds: string[] = []
): Promise<ServiceItem[]> {
  requireAuthorizedOwner();
  const firestore = requireFirestore();
  const batch = writeBatch(firestore);
  const nowIso = new Date().toISOString();

  for (const service of services) {
    if (service.title.trim().length < 2) {
      throw new Error('Each service title must be at least 2 characters.');
    }
    if (service.description.trim().length < 5) {
      throw new Error(`Description for "${service.title}" must be at least 5 characters.`);
    }
  }

  const sanitized: ServiceItem[] = services.map((service, idx) => {
    const cleanId =
      sanitizeText(service.id, 64).replace(/[^a-zA-Z0-9_-]/g, '-') || `service-${idx + 1}`;
    const cleanService: ServiceItem = {
      id: cleanId,
      order: idx + 1,
      title: sanitizeText(service.title, 90) || 'Residential Cleaning',
      houseTypeValue: sanitizeText(service.houseTypeValue, 60) || HOUSE_TYPES[0],
      cleaningTypeValue: sanitizeText(service.cleaningTypeValue, 80) || CLEANING_TYPES[0],
      description: sanitizeText(service.description, 320) || 'Residential cleaning care.',
      imageUrl: sanitizeText(service.imageUrl, 300) || DEFAULT_SERVICES[0].imageUrl,
      available: typeof service.available === 'boolean' ? service.available : true,
      pricingNote: sanitizeText(service.pricingNote, 180),
    };
    batch.set(doc(firestore, 'services', cleanId), {
      ...cleanService,
      updatedAt: serverTimestamp(),
    });
    return { ...cleanService, updatedAt: nowIso };
  });

  for (const id of deletedIds) {
    const cleanId = sanitizeText(id, 64);
    if (cleanId && /^[a-zA-Z0-9_-]+$/.test(cleanId)) {
      batch.delete(doc(firestore, 'services', cleanId));
    }
  }

  try {
    await batch.commit();
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'services');
  }
}

export function mapAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Authentication failed. Please try again.';
  }
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not yet authorized in Firebase Authentication. Add this domain under Firebase Console -> Authentication -> Settings -> Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase Authentication. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    default:
      return extractReadableError(error, 'Sign-in failed. Please try again.');
  }
}

export { extractReadableError };
