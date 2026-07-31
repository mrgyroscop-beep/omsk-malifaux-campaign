# Malifaux Campaign Cloud Worker

Cloudflare API for the Malifaux Campaign Builder. The static site stays on
GitHub Pages; this Worker provides:

- DeepSeek access through Cloudflare AI Gateway with exact-request caching,
  metadata-only logs, automatic retries, and a direct emergency fallback;
- Turnstile-verified anonymous API sessions;
- a KV read-through cache and Cron prewarming for BiggerHat;
- D1 cloud dossiers, a shared player table, and a shared chronicle.

## Local checks

```powershell
npm install
npm test
npm run check
npx wrangler deploy --dry-run
```

Rebuild the generated rules module after replacing the source PDF:

```powershell
python scripts/extract-rules.py
```

## Secrets

Never put real secret values in `wrangler.jsonc`, source code, or Git:

```powershell
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put SESSION_SIGNING_KEY
npx wrangler secret put TURNSTILE_SECRET
```

`SESSION_SIGNING_KEY` should be a long random value. For local development,
place values in the ignored `worker/.dev.vars` file.

## Deploy

Apply D1 migrations before the first production deployment:

```powershell
npx wrangler login
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

`wrangler.jsonc` contains the non-secret KV/D1 IDs, Turnstile-compatible origin
allowlist, AI binding, rate-limit bindings, and the six-hour Cron schedule.

## API

Public reads:

```text
GET /api/biggerhat/v1/characters
GET /api/biggerhat/v1/keywords
GET /api/biggerhat/v1/characters/:slug
GET /api/campaigns/:campaignId
```

Turnstile exchange:

```text
POST /api/session
```

The returned origin-bound bearer session is required for chat and every cloud
mutation:

```text
POST   /api/chat
POST   /api/campaigns
POST   /api/campaigns/:campaignId/organizer
PUT    /api/campaigns/:campaignId
DELETE /api/campaigns/:campaignId
POST   /api/campaigns/:campaignId/players
PATCH  /api/campaigns/:campaignId/players/:playerId
DELETE /api/campaigns/:campaignId/players/:playerId
POST   /api/campaigns/:campaignId/events
PATCH  /api/campaigns/:campaignId/events/:eventId
DELETE /api/campaigns/:campaignId/events/:eventId
```

Cloud mutations additionally require `X-Organizer-Token`. Only its SHA-256 hash
is stored in D1. Public campaign links never contain the organizer token.

The Worker enforces exact origins, request-size limits, per-IP rate limits,
strict Turnstile action/hostname binding, bounded D1 payloads, and structured
logs without prompts, responses, dossier contents, or credentials.
