# The Campfire — Design (approved 2026-08-12)

Guestbook for [risu.pl/campfire](https://risu.pl/campfire) — old internet style, no login.

## Decisions (made with the site owner)

| Question | Decision |
|---|---|
| Publish model | **Instant publish**, owner deletes via token |
| Entry fields | name (≤30) + message (≤140 code points) + server timestamp; nothing else |
| Entry point | animated 16×16 campfire in the blog nav, icon-only → `/campfire` |
| Backend | Vercel serverless + Upstash Redis (this repo); blog stays static on GitHub Pages |
| Greeting | "welcome to the campfire — stay awhile and share your stories." |

## Architecture

- **This repo** deploys to Vercel: three plain serverless functions, storage in one Upstash Redis list (`campfire:entries`, capped at 200).
- **The blog** (`risukisu/blog`) renders `/campfire` statically; the browser fetches/posts to this API.

## API

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/entries` | GET | last 100 entries, newest first |
| `/api/sign` | POST | validate + rate limit + LPUSH; returns created entry |
| `/api/entry?id=` | DELETE | Bearer `ADMIN_TOKEN`; removes one entry (and unfeatures it) |
| `/api/feature?id=` | POST | Bearer `ADMIN_TOKEN`; features one entry, max 3 at once (409 past that) |
| `/api/feature?id=` | DELETE | Bearer `ADMIN_TOKEN`; unfeatures one entry |

## Featured stories (added 2026-09-30)

The owner can feature up to 3 stories. On the page they are gold, slightly bigger, shimmer, and keep their card open. They always show in the sky, however old.

- Stored as full entry copies in the hash `campfire:featured` (id → entry JSON), so the 200-entry list trim never drops them.
- `GET /api/entries` returns them as `featured` next to `entries`; clients that don't know the field ignore it.
- Deleting an entry via `/api/entry` also removes its featured copy.
- Agent workflow ("feature X's story on the campfire") is documented in the blog repo's `CLAUDE.md` and in this repo's `CLAUDE.md`.

## Spam defense (instant publish, so layered)

1. Honeypot `website` field — bots that fill it get a fake 201, nothing stored
2. Minimum 3s between page load and submit (`t` field)
3. No URLs — `https?://` or `www.` anywhere in name/message → 400
4. Rate limit 3 posts/hour per IP (sliding window, hashed IP, auto-expiring key)
5. Length caps + control-char stripping; entries rendered with `textContent` on the client (no HTML path)

Escalation path if spam ever wins: pre-moderation queue or a proof-of-work challenge. Not built (YAGNI).

## Privacy

No raw IPs stored — only salted SHA-256 prefixes as rate-limit keys, which expire within the hour. Entries hold name + message + timestamp, nothing else.

## Env vars (Vercel)

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or `KV_*` aliases) — from the Upstash integration
- `ADMIN_TOKEN` — moderation secret
- `IP_SALT` — salt for IP hashing
