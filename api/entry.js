import { redis, cors, LIST_KEY } from '../lib/shared.js';

// DELETE /api/entry?id=<uuid>  — requires Authorization: Bearer $ADMIN_TOKEN
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'not your fire' });
  }

  const id = new URL(req.url, 'http://x').searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const db = redis();
    const raw = await db.lrange(LIST_KEY, 0, -1);
    const match = raw.find((e) => {
      const entry = typeof e === 'string' ? JSON.parse(e) : e;
      return entry.id === id;
    });
    if (!match) return res.status(404).json({ error: 'entry not found' });
    const removed = await db.lrem(LIST_KEY, 1, typeof match === 'string' ? match : JSON.stringify(match));
    return res.status(200).json({ removed });
  } catch (err) {
    console.error('delete error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}
