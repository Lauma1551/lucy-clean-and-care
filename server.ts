import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  CLEANING_TYPES,
  DEFAULT_PRICING,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONFIG,
  HOUSE_TYPES,
  PRODUCT_PREFERENCES,
} from './src/shared/defaults.ts';
import type {
  BookingRecord,
  BookingStatus,
  PricingCategory,
  ServiceItem,
  SiteConfig,
} from './src/shared/types.ts';

interface PersistedStore {
  configVersion?: number;
  config: SiteConfig;
  services: ServiceItem[];
  pricing: PricingCategory[];
  bookings: BookingRecord[];
  ownerAuth: {
    salt: string;
    hash: string;
  } | null;
  sessionSecret: string;
}

const CURRENT_CONFIG_VERSION = 2;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createInitialStore(): PersistedStore {
  const envWhatsapp = (process.env.WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');
  const initialConfig: SiteConfig = {
    ...DEFAULT_SITE_CONFIG,
    whatsappNumber: envWhatsapp || DEFAULT_SITE_CONFIG.whatsappNumber,
  };

  return {
    configVersion: CURRENT_CONFIG_VERSION,
    config: initialConfig,
    services: DEFAULT_SERVICES,
    pricing: DEFAULT_PRICING,
    bookings: [],
    ownerAuth: null,
    sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  };
}

function readStore(): PersistedStore {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initial = createInitialStore();
    writeStore(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    const fallback = createInitialStore();

    // Upgrade legacy initial defaults if the previous placeholder business name is still stored
    const isLegacyPlaceholder =
      parsed.config?.businessName === "Lucy's Clean" &&
      !parsed.config?.email &&
      !parsed.config?.telephone;

    const needsTikTokBackfill =
      (parsed.configVersion ?? 1) < CURRENT_CONFIG_VERSION &&
      !parsed.config?.socialLinks?.tiktok;

    const mergedConfig: SiteConfig = isLegacyPlaceholder
      ? fallback.config
      : {
          ...fallback.config,
          ...(parsed.config || {}),
          socialLinks: {
            ...fallback.config.socialLinks,
            ...(parsed.config?.socialLinks || {}),
            tiktok: needsTikTokBackfill
              ? fallback.config.socialLinks.tiktok
              : parsed.config?.socialLinks?.tiktok ?? fallback.config.socialLinks.tiktok,
          },
        };

    const upgradedStore: PersistedStore = {
      configVersion: CURRENT_CONFIG_VERSION,
      config: mergedConfig,
      services:
        Array.isArray(parsed.services) && parsed.services.length > 0
          ? parsed.services
          : fallback.services,
      pricing:
        Array.isArray(parsed.pricing) && parsed.pricing.length > 0
          ? parsed.pricing
          : fallback.pricing,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      ownerAuth: parsed.ownerAuth ?? null,
      sessionSecret: parsed.sessionSecret || fallback.sessionSecret,
    };

    if (isLegacyPlaceholder || needsTikTokBackfill) {
      writeStore(upgradedStore);
    }

    return upgradedStore;
  } catch {
    const initial = createInitialStore();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: PersistedStore): void {
  ensureDataDir();
  const tmpFile = `${STORE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function hashPasscode(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

function isPasscodeConfigured(store: PersistedStore): boolean {
  return Boolean(
    (process.env.OWNER_PASSCODE && process.env.OWNER_PASSCODE.trim().length >= 4) ||
      store.ownerAuth
  );
}

function verifyPasscode(store: PersistedStore, candidate: string): boolean {
  const envPasscode = process.env.OWNER_PASSCODE?.trim();
  if (envPasscode && envPasscode.length >= 4) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(envPasscode);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  if (!store.ownerAuth) {
    return false;
  }
  const derived = hashPasscode(candidate, store.ownerAuth.salt);
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(store.ownerAuth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signSessionToken(secret: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: 'owner', exp: expiresAt })).toString(
    'base64url'
  );
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySessionToken(secret: string, token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'owner' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireOwnerAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const store = readStore();
  if (!token || !verifySessionToken(store.sessionSecret, token)) {
    res.status(401).json({ error: 'Owner authentication required.' });
    return;
  }
  next();
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

function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `LCC-${year}-${suffix}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  readStore();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/site', (_req, res) => {
    const store = readStore();
    res.json({
      config: store.config,
      services: store.services,
      pricing: store.pricing,
    });
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body as Record<string, unknown>;

    const fullName = sanitizeText(body.fullName, 120);
    const phoneNumber = sanitizeText(body.phoneNumber, 30);
    const email = sanitizeText(body.email, 120);
    const locationEstate = sanitizeText(body.locationEstate, 160);
    const houseType = sanitizeText(body.houseType, 60);
    const preferredDate = sanitizeText(body.preferredDate, 20);
    const preferredTime = sanitizeText(body.preferredTime, 60);
    const cleaningType = sanitizeText(body.cleaningType, 80);
    const productPreference = sanitizeText(body.productPreference, 120);
    const instructions = sanitizeText(body.instructions, 1000);

    const errors: Record<string, string> = {};

    if (fullName.length < 2) {
      errors.fullName = 'Please enter your full name.';
    }
    const phoneDigits = phoneNumber.replace(/[^\d]/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      errors.phoneNumber = 'Please enter a valid Kenyan or international phone number.';
    }
    if (locationEstate.length < 2) {
      errors.locationEstate = 'Please enter your estate or neighbourhood in Nairobi.';
    }
    if (!HOUSE_TYPES.includes(houseType as (typeof HOUSE_TYPES)[number])) {
      errors.houseType = 'Please select a valid house size.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errors.preferredDate = 'Please select a valid preferred cleaning date.';
    }
    if (!preferredTime) {
      errors.preferredTime = 'Please select a preferred time window.';
    }
    if (!CLEANING_TYPES.includes(cleaningType as (typeof CLEANING_TYPES)[number])) {
      errors.cleaningType = 'Please select the type of cleaning required.';
    }
    if (!PRODUCT_PREFERENCES.includes(productPreference as (typeof PRODUCT_PREFERENCES)[number])) {
      errors.productPreference = 'Please select your cleaning products preference.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Please review the highlighted fields.', fieldErrors: errors });
      return;
    }

    const store = readStore();
    const record: BookingRecord = {
      id: crypto.randomUUID(),
      referenceCode: generateReferenceCode(),
      fullName,
      phoneNumber,
      email,
      locationEstate,
      houseType,
      preferredDate,
      preferredTime,
      cleaningType,
      productPreference,
      instructions,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.bookings.unshift(record);
    writeStore(store);

    res.status(201).json({ booking: record });
  });

  app.get('/api/owner/status', (_req, res) => {
    const store = readStore();
    res.json({
      isPasscodeConfigured: isPasscodeConfigured(store),
    });
  });

  app.post('/api/owner/setup', (req, res) => {
    const store = readStore();
    if (isPasscodeConfigured(store)) {
      res.status(409).json({ error: 'An owner passcode is already configured. Please sign in.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 4 || passcode.length > 64) {
      res.status(400).json({ error: 'Passcode must be between 4 and 64 characters.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPasscode(passcode, salt);
    store.ownerAuth = { salt, hash };
    writeStore(store);

    const token = signSessionToken(store.sessionSecret);
    res.status(201).json({ token });
  });

  app.post('/api/owner/login', (req, res) => {
    const store = readStore();
    if (!isPasscodeConfigured(store)) {
      res.status(400).json({ error: 'Owner passcode has not been configured yet.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!verifyPasscode(store, passcode)) {
      res.status(401).json({ error: 'Incorrect passcode. Please try again.' });
      return;
    }
    const token = signSessionToken(store.sessionSecret);
    res.json({ token });
  });

  app.get('/api/owner/bookings', requireOwnerAuth, (_req, res) => {
    const store = readStore();
    res.json({ bookings: store.bookings });
  });

  app.patch('/api/owner/bookings/:id', requireOwnerAuth, (req, res) => {
    const bookingId = sanitizeText(req.params.id, 64);
    const status = sanitizeText(req.body?.status, 24) as BookingStatus;
    const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid booking status.' });
      return;
    }

    const store = readStore();
    const index = store.bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    store.bookings[index] = {
      ...store.bookings[index],
      status,
    };
    writeStore(store);
    res.json({ booking: store.bookings[index] });
  });

  app.put('/api/owner/pricing', requireOwnerAuth, (req, res) => {
    const incoming = req.body?.pricing;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ error: 'Invalid pricing payload.' });
      return;
    }

    const store = readStore();
    const updatedPricing: PricingCategory[] = store.pricing.map((existing) => {
      const match = incoming.find((item: unknown) => (item as PricingCategory)?.id === existing.id) as
        | Partial<PricingCategory>
        | undefined;
      if (!match) return existing;

      let priceKes: number | null = null;
      if (
        match.priceKes !== null &&
        match.priceKes !== undefined &&
        String(match.priceKes).trim() !== ''
      ) {
        const parsed = Number(match.priceKes);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) {
          priceKes = existing.priceKes;
        } else {
          priceKes = Math.round(parsed);
        }
      }

      return {
        ...existing,
        priceKes,
        note: sanitizeText(match.note, 180) || existing.note,
      };
    });

    store.pricing = updatedPricing;
    writeStore(store);
    res.json({ pricing: store.pricing });
  });

  app.put('/api/owner/config', requireOwnerAuth, (req, res) => {
    const body = (req.body?.config || {}) as Partial<SiteConfig>;
    const store = readStore();

    const rawWhatsapp = sanitizeText(body.whatsappNumber, 25).replace(/[^\d]/g, '');
    const updatedConfig: SiteConfig = {
      ...store.config,
      businessName: sanitizeText(body.businessName, 80) || store.config.businessName,
      logoText: sanitizeText(body.logoText, 80) || store.config.logoText,
      tagline: sanitizeText(body.tagline, 140) || store.config.tagline,
      founderName: sanitizeText(body.founderName, 100) || store.config.founderName,
      founderBio: sanitizeText(body.founderBio, 600) || store.config.founderBio,
      city: sanitizeText(body.city, 120) || store.config.city,
      whatsappNumber: rawWhatsapp,
      telephone: sanitizeText(body.telephone, 40),
      email: sanitizeText(body.email, 120),
      serviceAreas: sanitizeText(body.serviceAreas, 400) || store.config.serviceAreas,
      productsPolicyNote:
        sanitizeText(body.productsPolicyNote, 400) || store.config.productsPolicyNote,
      socialLinks: {
        instagram: sanitizeOptionalUrl(body.socialLinks?.instagram),
        facebook: sanitizeOptionalUrl(body.socialLinks?.facebook),
        tiktok: sanitizeOptionalUrl(body.socialLinks?.tiktok),
        x: sanitizeOptionalUrl(body.socialLinks?.x),
      },
    };

    store.config = updatedConfig;
    writeStore(store);
    res.json({ config: store.config });
  });

  app.put('/api/owner/services', requireOwnerAuth, (req, res) => {
    const incoming = req.body?.services;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ error: 'Invalid services payload.' });
      return;
    }

    const store = readStore();
    const updatedServices: ServiceItem[] = store.services.map((existing) => {
      const match = incoming.find((item: unknown) => (item as ServiceItem)?.id === existing.id) as
        | Partial<ServiceItem>
        | undefined;
      if (!match) return existing;

      return {
        ...existing,
        title: sanitizeText(match.title, 90) || existing.title,
        description: sanitizeText(match.description, 320) || existing.description,
      };
    });

    store.services = updatedServices;
    writeStore(store);
    res.json({ services: store.services });
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const isDev =
    process.env.VITE_DEV_SERVER === 'true' ||
    (process.env.NODE_ENV !== 'production' && !fs.existsSync(path.join(distDir, 'index.html')));

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Lucy Clean & Care server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
