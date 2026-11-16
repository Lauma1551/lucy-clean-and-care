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
  BookingRecord,
  BookingRequestPayload,
  BookingStatus,
  PricingCategory,
  PublicSiteData,
  ServiceItem,
  SiteConfig,
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

export function generateBookingReferenceCode(): string {
  const year = new Date().getFullYear();
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `LCC-${year}-${suffix}`;
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
  };

  const bookingId = crypto.randomUUID();
  const referenceCode = generateBookingReferenceCode();

  try {
    await setDoc(doc(firestore, 'bookings', bookingId), {
      referenceCode,
      ...sanitized,
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
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function verifyOwnerAccess(): Promise<boolean> {
  const firebaseAuth = requireAuth();
  const firestore = requireFirestore();
  const user = firebaseAuth.currentUser;
  if (!user) return false;

  try {
    await getDocs(query(collection(firestore, 'bookings'), limit(1)));
    return true;
  } catch {
    return false;
  }
}

export async function signInOwnerWithGoogle(): Promise<{
  user: User;
  authorized: boolean;
}> {
  const firebaseAuth = requireAuth();
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  const authorized = await verifyOwnerAccess();
  if (!authorized) {
    return { user: result.user, authorized: false };
  }
  return { user: result.user, authorized: true };
}

export async function signOutOwner(): Promise<void> {
  const firebaseAuth = requireAuth();
  await signOut(firebaseAuth);
}

export async function ensureInitialFirestoreSeed(): Promise<PublicSiteData | null> {
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
        status: (raw.status as BookingStatus) || 'pending',
        createdAt: toIsoString(raw.createdAt) || new Date().toISOString(),
        updatedAt: toIsoString(raw.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookings');
  }
}

export async function updateOwnerBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const firestore = requireFirestore();
  try {
    await updateDoc(doc(firestore, 'bookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function deleteOwnerBooking(bookingId: string): Promise<void> {
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
