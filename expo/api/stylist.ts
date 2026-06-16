/**
 * MILANA AI Stylist — Vercel serverless proxy.
 *
 * Client calls POST /api/stylist with { messages: [...] }.
 * This function attaches the secret toolkit key server-side and forwards to
 * the Rork toolkit chat-completions endpoint. The secret never reaches the
 * browser bundle.
 *
 * Required server-side env vars (set in Vercel → Settings → Environment Variables):
 *   - TOOLKIT_URL (fallback: EXPO_PUBLIC_TOOLKIT_URL)
 *   - RORK_TOOLKIT_SECRET_KEY (fallback: EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY)
 */
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

// Simple in-memory rate limit. Serverless instances are short-lived, so
// this throttles bursts per warm instance rather than enforcing a global
// quota — good enough to blunt obvious abuse without external state.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function allowedOrigins(): string[] {
  return (process.env.STYLIST_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

function resolveOrigin(reqOrigin: string | undefined): string {
  const allow = allowedOrigins();
  if (allow.length === 0) return '*';
  if (reqOrigin && allow.includes(reqOrigin)) return reqOrigin;
  return allow[0];
}

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
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
  const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  res.setHeader('Access-Control-Allow-Origin', resolveOrigin(reqOrigin));
  res.setHeader('Vary', 'Origin');
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

  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const toolkitUrl = process.env.TOOLKIT_URL || process.env.EXPO_PUBLIC_TOOLKIT_URL;
  const secretKey =
    process.env.RORK_TOOLKIT_SECRET_KEY || process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;

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
    const cleanBase = toolkitUrl.replace(/\/$/, '');
    const upstream = await fetch(`${cleanBase}/llm/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
        'x-rork-toolkit-secret': secretKey,
      },
      body: JSON.stringify({ messages }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error(
        `[api/stylist] upstream error status=${upstream.status} took=${Date.now() - startedAt}ms body=${errText.slice(0, 200)}`,
      );
      res.status(502).json({ error: 'Upstream stylist service error.' });
      return;
    }

    const data = (await upstream.json()) as { completion?: string };
    const reply = (data?.completion ?? '').trim();
    console.log(
      `[api/stylist] reply ready took=${Date.now() - startedAt}ms chars=${reply.length}`,
    );
    res.status(200).json({ reply });
  } catch (err) {
    console.error(`[api/stylist] fetch failed after ${Date.now() - startedAt}ms:`, err);
    res.status(500).json({ error: 'Stylist temporarily unavailable.' });
  }
}
