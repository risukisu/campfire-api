# campfire-api

The tiny guestbook API behind [risu.pl/campfire](https://risu.pl/campfire) 🔥

Three Vercel serverless functions + one Upstash Redis list. No accounts, no cookies, no tracking — name, 140 characters, timestamp, done. See [DESIGN.md](DESIGN.md) for the full design.

## Endpoints

```
GET    /api/entries         → { entries: [{ id, name, message, ts }, ...] }   (last 100, newest first)
POST   /api/sign            → { entry }    body: { name, message, t }
DELETE /api/entry?id=<uuid> → { removed, unfeatured }  header: Authorization: Bearer $ADMIN_TOKEN
POST   /api/feature?id=<uuid> → { featured }  header: Authorization: Bearer $ADMIN_TOKEN   (max 3 at once, 409 past that)
DELETE /api/feature?id=<uuid> → { removed }   header: Authorization: Bearer $ADMIN_TOKEN
```

`GET /api/entries` also returns `featured: [{ id, name, message, ts }, ...]` — full entries, newest first, kept outside the 200-entry trim.

## Moderation (owner)

List entries with ids:

```powershell
curl -s https://<deployment>/api/entries | ConvertFrom-Json | Select-Object -ExpandProperty entries
```

Delete one:

```powershell
curl -X DELETE "https://<deployment>/api/entry?id=<uuid>" -H "Authorization: Bearer $env:CAMPFIRE_ADMIN_TOKEN"
```

Feature one (a gold star with its card always open on risu.pl/campfire), then unfeature it:

```powershell
curl -X POST "https://<deployment>/api/feature?id=<uuid>" -H "Authorization: Bearer $env:CAMPFIRE_ADMIN_TOKEN"
curl -X DELETE "https://<deployment>/api/feature?id=<uuid>" -H "Authorization: Bearer $env:CAMPFIRE_ADMIN_TOKEN"
```

## Deploy

Deploys by CLI, not on push: `npx vercel --prod --yes` from this folder. Vercel project with the Upstash Redis integration attached. Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (integration sets these), `ADMIN_TOKEN`, `IP_SALT`.

## License

MIT. The campfire pixel art on the site is by [krial](https://opengameart.org/content/16x16-animated-campfire) (CC0).
