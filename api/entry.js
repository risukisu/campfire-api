import { redis, cors, isAdmin, parseEntry, LIST_KEY, FEATURED_KEY } from '../lib/shared.js';

// DELETE /api/entry?id=<uuid>  — requires Authorization: Bearer $ADMIN_TOKEN
// Also unfeatures the story, including one already trimmed out of the list.
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'not your fire' });

  const id = new URL(req.url, 'http://x').searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const db = redis();
    const raw = await db.lrange(LIST_KEY, 0, -1);
    const match = raw.find((e) => parseEntry(e).id === id);
    const removed = match ? await db.lrem(LIST_KEY, 1, typeof match === 'string' ? match : JSON.stringify(match)) : 0;
    const unfeatured = await db.hdel(FEATURED_KEY, id);
    if (!removed && !unfeatured) return res.status(404).json({ error: 'entry not found' });
    return res.status(200).json({ removed, unfeatured });
  } catch (err) {
    console.error('delete error', err);
    return res.status(500).json({ error: 'the fire crackles but does not answer' });
  }
}
