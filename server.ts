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
  WhatsAppNotificationRequest,
} from './src/shared/types.ts';
import {
  getWhatsAppReadiness,
  loadWhatsAppEnvConfig,
  processWhatsAppNotification,
} from './server/whatsappService.ts';

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

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferenceCode(): string {
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `LCC-${suffix}`;
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
      whatsappConsent: Boolean(body.whatsappConsent),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.bookings.unshift(record);
    writeStore(store);

    res.status(201).json({ booking: record });
  });

  app.get('/api/whatsapp/status', (_req, res) => {
    const readiness = getWhatsAppReadiness(loadWhatsAppEnvConfig());
    res.json(readiness);
  });

  app.post('/api/whatsapp/notify', async (req, res) => {
    const payload = req.body as WhatsAppNotificationRequest;
    const result = await processWhatsAppNotification({
      payload,
      authorizationHeader: req.headers.authorization,
    });
    res.status(result.statusCode).json(result.body);
  });

  app.all('/api/owner*', (_req, res) => {
    res.status(403).json({ error: 'Access denied.' });
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
