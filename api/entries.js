import { redis, cors, LIST_KEY } from '../lib/shared.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const raw = await redis().lrange(LIST_KEY, 0, 99);
    // @upstash/redis auto-deserializes JSON values; tolerate strings too.
    const entries = raw.map((e) => (typeof e === 'string' ? JSON.parse(e) : e));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ entries });
  } catch (err) {
    console.error('entries error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}
