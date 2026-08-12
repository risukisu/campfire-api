import { Ratelimit } from '@upstash/ratelimit';
import crypto from 'node:crypto';
import { redis, cors, hashIp, validateEntry, LIST_KEY, MAX_STORED, MIN_FILL_MS } from '../lib/shared.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  // Honeypot: the visible form has no "website" field. Bots fill it.
  // Pretend success, store nothing.
  if (body.website) {
    return res.status(201).json({ entry: fakeEntry(body) });
  }

  // Too fast: humans need a moment to type.
  const fillMs = Number(body.t);
  if (!Number.isFinite(fillMs) || fillMs < MIN_FILL_MS) {
    return res.status(400).json({ error: 'that was fast — warm your hands by the fire a little first' });
  }

  const check = validateEntry(body);
  if (!check.ok) return res.status(400).json({ error: check.error });

  try {
    const db = redis();
    const limiter = new Ratelimit({
      redis: db,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'campfire:rl',
    });
    const { success } = await limiter.limit(hashIp(req));
    if (!success) {
      return res.status(429).json({ error: 'the fire needs a moment — three stories an hour is plenty' });
    }

    const entry = {
      id: crypto.randomUUID(),
      name: check.name,
      message: check.message,
      ts: Date.now(),
    };
    await db.lpush(LIST_KEY, JSON.stringify(entry));
    await db.ltrim(LIST_KEY, 0, MAX_STORED - 1);
    return res.status(201).json({ entry });
  } catch (err) {
    console.error('sign error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

function fakeEntry(body) {
  return {
    id: crypto.randomUUID(),
    name: String(body.name || '').slice(0, 30),
    message: String(body.message || '').slice(0, 140),
    ts: Date.now(),
  };
}
