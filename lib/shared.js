import { Redis } from '@upstash/redis';
import crypto from 'node:crypto';

export const LIST_KEY = 'campfire:entries';
export const MAX_NAME = 30;
export const MAX_MESSAGE = 140;
export const MAX_STORED = 200;
export const MIN_FILL_MS = 3000;

const ALLOWED_ORIGINS = [
  'https://risu.pl',
  'http://localhost:4321',
  'http://localhost:4399',
];

export function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return new Redis({ url, token });
}

export function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function hashIp(req) {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const salt = process.env.IP_SALT || 'campfire';
  return crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 24);
}

// Strip control chars, collapse whitespace/newlines to single spaces, trim.
export function clean(str) {
  return String(str ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function codePoints(str) {
  return Array.from(str).length;
}

export function hasUrl(str) {
  return /https?:\/\/|www\./i.test(str);
}

// Returns { ok: true, name, message } or { ok: false, error }
export function validateEntry(body) {
  const name = clean(body?.name);
  const message = clean(body?.message);
  if (!name || !message) return { ok: false, error: 'name and message are both required' };
  if (codePoints(name) > MAX_NAME) return { ok: false, error: `name is too long (max ${MAX_NAME} characters)` };
  if (codePoints(message) > MAX_MESSAGE) return { ok: false, error: `message is too long (max ${MAX_MESSAGE} characters)` };
  if (hasUrl(name) || hasUrl(message)) return { ok: false, error: 'no links at the campfire — just stories' };
  return { ok: true, name, message };
}
