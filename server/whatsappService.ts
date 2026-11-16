import fs from 'node:fs';
import path from 'node:path';
import type {
  WhatsAppNotificationEvent,
  WhatsAppNotificationRequest,
  WhatsAppNotificationResponse,
} from '../src/shared/types.ts';

const AUTHORIZED_OWNER_EMAIL = 'aumalucy015@gmail.com';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;

interface CacheEntry {
  expiresAt: number;
  response: WhatsAppNotificationResponse;
}

const idempotencyCache = new Map<string, CacheEntry>();

export interface WhatsAppEnvConfig {
  accessToken: string;
  phoneNumberId: string;
  ownerPhone: string;
  apiVersion: string;
  defaultCountryCode: string;
  messageMode: 'template' | 'text';
  templateLanguage: string;
  templates: Record<WhatsAppNotificationEvent, string>;
  firebaseApiKey: string;
}

function readBundledFirebaseApiKey(): string {
  const candidates = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(process.cwd(), '..', 'firebase-applet-config.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { apiKey?: string };
        if (parsed.apiKey) return parsed.apiKey;
      }
    } catch {
      // Ignore fallback lookup errors
    }
  }
  return '';
}

export function loadWhatsAppEnvConfig(
  env: Record<string, string | undefined> = process.env
): WhatsAppEnvConfig {
  return {
    accessToken: (env.WHATSAPP_ACCESS_TOKEN || '').trim(),
    phoneNumberId: (env.WHATSAPP_PHONE_NUMBER_ID || '').trim(),
    ownerPhone: (env.WHATSAPP_OWNER_PHONE || '254746022851').trim(),
    apiVersion: (env.WHATSAPP_API_VERSION || 'v21.0').trim(),
    defaultCountryCode: (env.WHATSAPP_DEFAULT_COUNTRY_CODE || '254').trim(),
    messageMode: (env.WHATSAPP_MESSAGE_MODE || 'template').trim().toLowerCase() === 'text'
      ? 'text'
      : 'template',
    templateLanguage: (env.WHATSAPP_TEMPLATE_LANGUAGE || 'en').trim(),
    templates: {
      owner_new_booking: (env.WHATSAPP_TEMPLATE_OWNER_NEW_BOOKING || '').trim(),
      owner_cancel_request: (env.WHATSAPP_TEMPLATE_OWNER_CANCEL_REQUEST || '').trim(),
      owner_reschedule_request: (env.WHATSAPP_TEMPLATE_OWNER_RESCHEDULE_REQUEST || '').trim(),
      customer_confirmed: (env.WHATSAPP_TEMPLATE_CUSTOMER_CONFIRMED || '').trim(),
      customer_rescheduled: (env.WHATSAPP_TEMPLATE_CUSTOMER_RESCHEDULED || '').trim(),
      customer_cancelled: (env.WHATSAPP_TEMPLATE_CUSTOMER_CANCELLED || '').trim(),
    },
    firebaseApiKey:
      (env.FIREBASE_WEB_API_KEY || env.VITE_FIREBASE_API_KEY || '').trim() ||
      readBundledFirebaseApiKey(),
  };
}

export function normalizeWhatsAppPhone(
  rawPhone: string | undefined,
  defaultCountryCode = '254'
): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/[^\d]/g, '');
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith('0') && normalized.length >= 9 && normalized.length <= 10) {
    normalized = `${defaultCountryCode}${normalized.slice(1)}`;
  }

  if (normalized.length < 10 || normalized.length > 15) {
    return null;
  }
  return normalized;
}

export function isOwnerTriggeredEvent(event: WhatsAppNotificationEvent): boolean {
  return (
    event === 'customer_confirmed' ||
    event === 'customer_rescheduled' ||
    event === 'customer_cancelled'
  );
}

function getTemplateParameters(req: WhatsAppNotificationRequest): string[] {
  const ref = req.referenceCode;
  const serviceSummary = [req.houseType, req.cleaningType].filter(Boolean).join(' - ') || 'Residential Cleaning';

  switch (req.event) {
    case 'owner_new_booking':
      return [
        ref,
        req.customerName || 'Customer',
        req.customerPhone || 'Not provided',
        req.locationEstate || 'Nairobi',
        serviceSummary,
        `${req.preferredDate || ''} ${req.preferredTime || ''}`.trim() || 'TBD',
      ];
    case 'owner_cancel_request':
      return [
        ref,
        req.customerPhone || 'Not provided',
        req.reason || 'No reason provided',
      ];
    case 'owner_reschedule_request':
      return [
        ref,
        req.customerPhone || 'Not provided',
        `${req.requestedDate || ''} ${req.requestedTime || ''}`.trim() || 'TBD',
        req.reason || 'No additional notes',
      ];
    case 'customer_confirmed':
      return [
        req.customerName || 'Customer',
        ref,
        serviceSummary,
        req.preferredDate || 'TBD',
        req.preferredTime || 'TBD',
      ];
    case 'customer_rescheduled':
      return [
        req.customerName || 'Customer',
        ref,
        serviceSummary,
        req.preferredDate || 'TBD',
        req.preferredTime || 'TBD',
      ];
    case 'customer_cancelled':
      return [
        req.customerName || 'Customer',
        ref,
        serviceSummary,
        req.preferredDate || 'Scheduled date',
      ];
  }
}

function buildTextBody(req: WhatsAppNotificationRequest): string {
  const ref = req.referenceCode;
  const serviceSummary = [req.houseType, req.cleaningType].filter(Boolean).join(' - ') || 'Residential Cleaning';

  switch (req.event) {
    case 'owner_new_booking':
      return [
        `Lucy Clean & Care - New Booking (${ref})`,
        `Customer: ${req.customerName || 'Customer'} (${req.customerPhone || 'No phone'})`,
        `Location: ${req.locationEstate || 'Nairobi'}`,
        `Service: ${serviceSummary}`,
        `Date & Time: ${req.preferredDate || 'TBD'} (${req.preferredTime || 'TBD'})`,
        `Products: ${req.productPreference || 'Standard'}`,
      ].join('\n');
    case 'owner_cancel_request':
      return [
        `Lucy Clean & Care - Cancellation Request (${ref})`,
        `Customer Phone: ${req.customerPhone || 'Not provided'}`,
        `Reason: ${req.reason || 'Customer requested cancellation.'}`,
      ].join('\n');
    case 'owner_reschedule_request':
      return [
        `Lucy Clean & Care - Reschedule Request (${ref})`,
        `Customer Phone: ${req.customerPhone || 'Not provided'}`,
        `Requested Date & Time: ${req.requestedDate || 'TBD'} (${req.requestedTime || 'TBD'})`,
        `Note: ${req.reason || 'Customer requested a new appointment slot.'}`,
      ].join('\n');
    case 'customer_confirmed':
      return [
        `Hello ${req.customerName || 'Valued Customer'}, your Lucy Clean & Care booking is CONFIRMED.`,
        `Reference: ${ref}`,
        `Service: ${serviceSummary}`,
        `Appointment: ${req.preferredDate || 'TBD'} at ${req.preferredTime || 'TBD'}`,
        `Location: ${req.locationEstate || 'As requested'}`,
      ].join('\n');
    case 'customer_rescheduled':
      return [
        `Hello ${req.customerName || 'Valued Customer'}, your Lucy Clean & Care appointment has been UPDATED.`,
        `Reference: ${ref}`,
        `Service: ${serviceSummary}`,
        `New Appointment: ${req.preferredDate || 'TBD'} at ${req.preferredTime || 'TBD'}`,
      ].join('\n');
    case 'customer_cancelled':
      return [
        `Hello ${req.customerName || 'Valued Customer'}, your Lucy Clean & Care appointment (${ref}) for ${serviceSummary} on ${req.preferredDate || 'your scheduled date'} has been CANCELLED.`,
        `If you would like to rebook, please reply or submit a new request on our website.`,
      ].join('\n');
  }
}

export async function verifyOwnerFirebaseIdToken(
  authorizationHeader: string | undefined,
  firebaseApiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<{ ok: boolean; statusCode: number; error?: string }> {
  const token =
    authorizationHeader && authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice(7).trim()
      : '';

  if (!token) {
    return { ok: false, statusCode: 401, error: 'Owner authentication token required.' };
  }
  if (!firebaseApiKey) {
    return {
      ok: false,
      statusCode: 500,
      error: 'Firebase Web API key is not configured on the server.',
    };
  }

  try {
    const res = await fetchFn(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!res.ok) {
      return { ok: false, statusCode: 401, error: 'Invalid or expired owner authentication token.' };
    }

    const data = (await res.json()) as {
      users?: Array<{ email?: string; emailVerified?: boolean }>;
    };
    const user = data.users?.[0];
    if (
      !user ||
      user.emailVerified !== true ||
      !user.email ||
      user.email.trim().toLowerCase() !== AUTHORIZED_OWNER_EMAIL
    ) {
      return {
        ok: false,
        statusCode: 403,
        error: 'Access denied. Only the authorized owner account can trigger customer notifications.',
      };
    }

    return { ok: true, statusCode: 200 };
  } catch {
    return {
      ok: false,
      statusCode: 502,
      error: 'Could not verify owner authentication token with Firebase.',
    };
  }
}

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (entry.expiresAt <= now) {
      idempotencyCache.delete(key);
    }
  }
  if (idempotencyCache.size > MAX_CACHE_ENTRIES) {
    const excess = idempotencyCache.size - MAX_CACHE_ENTRIES;
    let deleted = 0;
    for (const key of idempotencyCache.keys()) {
      idempotencyCache.delete(key);
      deleted += 1;
      if (deleted >= excess) break;
    }
  }
}

export function clearWhatsAppIdempotencyCache(): void {
  idempotencyCache.clear();
}

export function getWhatsAppReadiness(config: WhatsAppEnvConfig) {
  return {
    provider: 'Meta WhatsApp Cloud API',
    hasAccessToken: Boolean(config.accessToken),
    hasPhoneNumberId: Boolean(config.phoneNumberId),
    hasOwnerPhone: Boolean(normalizeWhatsAppPhone(config.ownerPhone, config.defaultCountryCode)),
    messageMode: config.messageMode,
    templatesConfigured: {
      owner_new_booking: Boolean(config.templates.owner_new_booking),
      owner_cancel_request: Boolean(config.templates.owner_cancel_request),
      owner_reschedule_request: Boolean(config.templates.owner_reschedule_request),
      customer_confirmed: Boolean(config.templates.customer_confirmed),
      customer_rescheduled: Boolean(config.templates.customer_rescheduled),
      customer_cancelled: Boolean(config.templates.customer_cancelled),
    },
  };
}

export async function processWhatsAppNotification(options: {
  payload: WhatsAppNotificationRequest;
  authorizationHeader?: string;
  config?: WhatsAppEnvConfig;
  fetchFn?: typeof fetch;
}): Promise<{ statusCode: number; body: WhatsAppNotificationResponse }> {
  const config = options.config || loadWhatsAppEnvConfig();
  const fetchFn = options.fetchFn || fetch;
  const payload = options.payload;

  const validEvents: WhatsAppNotificationEvent[] = [
    'owner_new_booking',
    'owner_cancel_request',
    'owner_reschedule_request',
    'customer_confirmed',
    'customer_rescheduled',
    'customer_cancelled',
  ];

  if (!payload || !validEvents.includes(payload.event)) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        sent: false,
        status: 'provider_error',
        message: 'Invalid WhatsApp notification event.',
      },
    };
  }

  if (
    !payload.referenceCode ||
    !/^LCC-([A-Z0-9]{6}|[0-9]{4}-[A-Z0-9]{4,8})$/.test(payload.referenceCode.trim())
  ) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        sent: false,
        status: 'provider_error',
        message: 'Valid booking reference (LCC-XXXXXX) is required.',
      },
    };
  }

  const idempotencyKey = (payload.idempotencyKey || '').trim();
  if (!idempotencyKey || idempotencyKey.length > 160) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        sent: false,
        status: 'provider_error',
        message: 'A valid idempotencyKey is required to prevent duplicate notifications.',
      },
    };
  }

  // Enforce server-side Firebase ID token check for owner-triggered customer notifications
  const ownerOnly = isOwnerTriggeredEvent(payload.event);
  if (ownerOnly) {
    const authResult = await verifyOwnerFirebaseIdToken(
      options.authorizationHeader,
      config.firebaseApiKey,
      fetchFn
    );
    if (!authResult.ok) {
      return {
        statusCode: authResult.statusCode,
        body: {
          ok: false,
          sent: false,
          status: 'provider_error',
          message: authResult.error || 'Unauthorized.',
        },
      };
    }

    // Strict WhatsApp customer consent enforcement
    if (payload.whatsappConsent !== true) {
      return {
        statusCode: 200,
        body: {
          ok: true,
          sent: false,
          status: 'skipped_no_consent',
          message: 'WhatsApp notification skipped because the customer did not opt in to WhatsApp updates.',
        },
      };
    }
  }

  // Deduplication check
  pruneCache();
  const cacheKey = `${payload.event}:${idempotencyKey}`;
  const cached = idempotencyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      statusCode: 200,
      body: {
        ok: true,
        sent: false,
        status: 'deduplicated',
        message: 'Duplicate WhatsApp notification prevented.',
      },
    };
  }

  // Resolve target recipient (owner vs consented customer)
  const recipient = ownerOnly
    ? normalizeWhatsAppPhone(payload.customerPhone, config.defaultCountryCode)
    : normalizeWhatsAppPhone(config.ownerPhone, config.defaultCountryCode);

  if (!recipient) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        sent: false,
        status: 'invalid_recipient',
        message: ownerOnly
          ? 'Customer phone number is not valid for WhatsApp delivery.'
          : 'Owner WhatsApp phone number (WHATSAPP_OWNER_PHONE) is not configured.',
      },
    };
  }

  if (!config.accessToken || !config.phoneNumberId) {
    return {
      statusCode: 200,
      body: {
        ok: false,
        sent: false,
        status: 'provider_not_configured',
        message:
          'WhatsApp Business Platform credentials (WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID) are not configured yet.',
      },
    };
  }

  const templateName = config.templates[payload.event];
  let messageBody: Record<string, unknown>;

  if (config.messageMode === 'template') {
    if (!templateName) {
      return {
        statusCode: 200,
        body: {
          ok: false,
          sent: false,
          status: 'provider_not_configured',
          message: `Meta approved template name for "${payload.event}" is not configured yet.`,
        },
      };
    }

    const params = getTemplateParameters(payload);
    messageBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: config.templateLanguage || 'en' },
        components: [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    };
  } else {
    messageBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: buildTextBody(payload),
      },
    };
  }

  try {
    const graphUrl = `https://graph.facebook.com/${encodeURIComponent(config.apiVersion)}/${encodeURIComponent(config.phoneNumberId)}/messages`;
    const apiRes = await fetchFn(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const apiJson = (await apiRes.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!apiRes.ok) {
      return {
        statusCode: 502,
        body: {
          ok: false,
          sent: false,
          status: 'provider_error',
          message:
            apiJson.error?.message ||
            `WhatsApp Business API returned HTTP ${apiRes.status}.`,
        },
      };
    }

    const response: WhatsAppNotificationResponse = {
      ok: true,
      sent: true,
      status: 'sent',
      message: 'WhatsApp notification sent via Meta Cloud API.',
      messageId: apiJson.messages?.[0]?.id,
    };

    idempotencyCache.set(cacheKey, {
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      response,
    });

    return { statusCode: 200, body: response };
  } catch (error) {
    return {
      statusCode: 502,
      body: {
        ok: false,
        sent: false,
        status: 'provider_error',
        message:
          error instanceof Error
            ? `Failed to reach WhatsApp Business API: ${error.message}`
            : 'Failed to reach WhatsApp Business API.',
      },
    };
  }
}
