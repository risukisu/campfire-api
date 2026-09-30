import { redis, cors, isAdmin, parseEntry, LIST_KEY, FEATURED_KEY, MAX_FEATURED } from '../lib/shared.js';

// POST   /api/feature?id=<uuid>  — feature a story (max MAX_FEATURED at once)
// DELETE /api/feature?id=<uuid>  — unfeature it
// Both require Authorization: Bearer $ADMIN_TOKEN
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).json({ error: 'method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'not your fire' });

  const id = new URL(req.url, 'http://x').searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const db = redis();

    if (req.method === 'DELETE') {
      const removed = await db.hdel(FEATURED_KEY, id);
      if (!removed) return res.status(404).json({ error: 'that story is not featured' });
      return res.status(200).json({ removed });
    }

    const current = await db.hkeys(FEATURED_KEY);
    if (current.includes(id)) return res.status(200).json({ featured: parseEntry(await db.hget(FEATURED_KEY, id)), already: true });
    if (current.length >= MAX_FEATURED) {
      return res.status(409).json({ error: `already ${MAX_FEATURED} featured — unfeature one first`, featured: current });
    }

    const raw = await db.lrange(LIST_KEY, 0, -1);
    const entry = raw.map(parseEntry).find((e) => e.id === id);
    if (!entry) return res.status(404).json({ error: 'entry not found' });
    await db.hset(FEATURED_KEY, { [id]: JSON.stringify(entry) });
    return res.status(201).json({ featured: entry });
  } catch (err) {
    console.error('feature error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}
