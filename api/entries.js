import { redis, cors, parseEntry, LIST_KEY, FEATURED_KEY } from '../lib/shared.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const db = redis();
    const [raw, rawFeatured] = await Promise.all([db.lrange(LIST_KEY, 0, 99), db.hvals(FEATURED_KEY)]);
    const entries = raw.map(parseEntry);
    // full entries, so a featured story older than the newest 100 still reaches the page
    const featured = (rawFeatured || []).map(parseEntry).sort((a, b) => b.ts - a.ts);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ entries, featured });
  } catch (err) {
    console.error('entries error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}
