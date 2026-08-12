# campfire-api

The tiny guestbook API behind [risu.pl/campfire](https://risu.pl/campfire) 🔥

Three Vercel serverless functions + one Upstash Redis list. No accounts, no cookies, no tracking — name, 140 characters, timestamp, done. See [DESIGN.md](DESIGN.md) for the full design.

## Endpoints

```
GET    /api/entries         → { entries: [{ id, name, message, ts }, ...] }   (last 100, newest first)
POST   /api/sign            → { entry }    body: { name, message, t }
DELETE /api/entry?id=<uuid> → { removed }  header: Authorization: Bearer $ADMIN_TOKEN
```

## Moderation (owner)

List entries with ids:

```powershell
curl -s https://<deployment>/api/entries | ConvertFrom-Json | Select-Object -ExpandProperty entries
```

Delete one:

```powershell
curl -X DELETE "https://<deployment>/api/entry?id=<uuid>" -H "Authorization: Bearer $env:CAMPFIRE_ADMIN_TOKEN"
```

## Deploy

Vercel project with the Upstash Redis integration attached. Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (integration sets these), `ADMIN_TOKEN`, `IP_SALT`.

## License

MIT. The campfire pixel art on the site is by [krial](https://opengameart.org/content/16x16-animated-campfire) (CC0).
