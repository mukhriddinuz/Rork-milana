/**
 * MILANA AI Stylist — Vercel serverless proxy.
 *
 * Client calls POST /api/stylist with { messages: [...] }.
 * This function attaches the secret toolkit key server-side and forwards to
 * the Rork toolkit chat-completions endpoint. The secret never reaches the
 * browser bundle.
 *
 * Required server-side env vars (set in Vercel → Settings → Environment Variables):
 console.log("=== MANA MENING KALITLARIM ===");
console.log("URL:", process.env.EXPO_PUBLIC_TOOLKIT_URL);
console.log("SECRET:", process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY);
import type { VercelRequest, VercelResponse } from '@vercel/node';

type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type StylistRequestBody = {
  messages?: ApiMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';
const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 4000;

function getEnv(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback) {
    const fb = process.env[fallback];
    if (fb && fb.length > 0) return fb;
  }
  return undefined;
}

function isMessage(m: unknown): m is ApiMessage {
  if (!m || typeof m !== 'object') return false;
  const r = (m as { role?: unknown }).role;
  const c = (m as { content?: unknown }).content;
  if (r !== 'system' && r !== 'user' && r !== 'assistant') return false;
  if (typeof c !== 'string') return false;
  return c.length > 0 && c.length <= MAX_CONTENT_LENGTH;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const toolkitUrl = getEnv('TOOLKIT_URL', 'EXPO_PUBLIC_TOOLKIT_URL');
  const secretKey = getEnv('RORK_TOOLKIT_SECRET_KEY', 'EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY');

  if (!toolkitUrl || !secretKey) {
    console.error('[api/stylist] missing TOOLKIT_URL or RORK_TOOLKIT_SECRET_KEY env');
    res.status(500).json({ error: 'Stylist service is not configured.' });
    return;
  }

  let body: StylistRequestBody;
  try {
    body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as StylistRequestBody)
        : ((req.body ?? {}) as StylistRequestBody);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages.filter(isMessage) : [];
  if (messages.length === 0) {
    res.status(400).json({ error: 'No valid messages provided.' });
    return;
  }
  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: 'Too many messages.' });
    return;
  }

  const model = typeof body.model === 'string' && body.model.length < 80 ? body.model : DEFAULT_MODEL;
  const temperature =
    typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 2
      ? body.temperature
      : 0.6;
  const maxTokens =
    typeof body.max_tokens === 'number' && body.max_tokens > 0 && body.max_tokens <= 1500
      ? body.max_tokens
      : 400;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const preview = lastUserMsg?.content.slice(0, 80).replace(/\s+/g, ' ') ?? '';
  const startedAt = Date.now();
  console.log(
    `[api/stylist] stylist is thinking... model=${model} msgs=${messages.length} temp=${temperature} maxTokens=${maxTokens} preview="${preview}"`,
  );

  try {
    const upstream = await fetch(`${toolkitUrl}/v2/vercel/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error(
        `[api/stylist] upstream error status=${upstream.status} took=${Date.now() - startedAt}ms body=${errText.slice(0, 200)}`,
      );
      res.status(502).json({ error: 'Upstream stylist service error.' });
      return;
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? '';
    console.log(
      `[api/stylist] reply ready took=${Date.now() - startedAt}ms chars=${reply.length}`,
    );
    res.status(200).json({ reply });
  } catch (err) {
    console.error(`[api/stylist] fetch failed after ${Date.now() - startedAt}ms:`, err);
    res.status(500).json({ error: 'Stylist temporarily unavailable.' });
  }
}
