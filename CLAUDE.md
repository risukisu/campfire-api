# campfire-api

Guestbook API behind https://risu.pl/campfire/ — three Vercel functions plus one Upstash Redis list. The page itself lives in the blog repo (`D:\AI_WORKSPACE_Personal\projects\blog`). See `DESIGN.md` for decisions, `README.md` for endpoints.

## Deploy — not on push

The Vercel project (`campfire-api`) has no Git integration. Deploy with `npx vercel --prod --yes` from this folder. Production URL the blog uses: `https://campfire-api-nine.vercel.app`. Changes to `GET /api/entries` must stay backward compatible: the live page reads it.

## Featuring stories (owner request)

"Feature X's story on the campfire" / "unfeature X" / "what's featured" = the `/api/feature` endpoint. The step-by-step agent workflow (matching the story, the token file at `$CLAUDE_SYSTEM/credentials/personal/campfire-admin-token.txt`, status codes, verification) is in the blog repo's `CLAUDE.md`, section "Campfire: featured stories". Follow that; it needs no deploy.

## Local testing

No test suite. Handlers can be run against an in-memory stand-in for `@upstash/redis` through a Node module `resolve` hook — never point tests at the production Redis.
