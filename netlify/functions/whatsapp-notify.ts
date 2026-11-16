import type { WhatsAppNotificationRequest } from '../../src/shared/types.ts';
import {
  getWhatsAppReadiness,
  loadWhatsAppEnvConfig,
  processWhatsAppNotification,
} from '../../server/whatsappService.ts';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const readiness = getWhatsAppReadiness(loadWhatsAppEnvConfig());
    return new Response(JSON.stringify(readiness), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: WhatsAppNotificationRequest;
  try {
    payload = (await req.json()) as WhatsAppNotificationRequest;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await processWhatsAppNotification({
    payload,
    authorizationHeader: req.headers.get('authorization') || undefined,
  });

  return new Response(JSON.stringify(result.body), {
    status: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
