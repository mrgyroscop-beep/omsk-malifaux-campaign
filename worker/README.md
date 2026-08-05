# Malifaux Campaign Cloud Worker

Cloudflare API for the Malifaux Campaign Builder. The static site stays on
GitHub Pages; this Worker provides:

- DeepSeek access through Cloudflare AI Gateway with exact-request caching,
  metadata-only logs, automatic retries, and a direct emergency fallback;
- Turnstile-verified anonymous API sessions;
- password accounts with revocable D1 sessions and automatic private dossier sync;
- a KV read-through cache and Cron prewarming for BiggerHat;
- D1 cloud dossiers, a shared player table, and a shared chronicle;
- origin-bound feedback intake and a private leased automation queue.

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
npx wrangler secret put AI_GATEWAY_TOKEN
npx wrangler secret put SESSION_SIGNING_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put FEEDBACK_AUTOMATION_TOKEN
```

`AI_GATEWAY_TOKEN` is a Cloudflare API token with `AI Gateway: Run` permission.
It is sent in `cf-aig-authorization` when Authenticated Gateway is enabled.

`SESSION_SIGNING_KEY` should be a long random value. For local development,
place values in the ignored `worker/.dev.vars` file.
`FEEDBACK_AUTOMATION_TOKEN` must contain at least 32 characters.

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

The returned origin-bound bearer session is required for chat, feedback, and
every cloud mutation:

```text
POST   /api/chat
POST   /api/feedback
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

Account authentication uses a separate `X-Account-Session` header so it cannot
be confused with the anonymous Turnstile bearer. A raw account token is returned
only by register/login and is stored only in browser session storage; D1 stores
its SHA-256 hash. Passwords use versioned PBKDF2-SHA-256 with a per-user salt and
100,000 iterations so password hashing fits the Cloudflare Workers Free 10 ms CPU
budget. The iteration count remains stored per user: existing stronger hashes are
verified with their recorded work factor and are never downgraded on login.

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/account/campaign
PUT  /api/account/campaign
POST /api/account/campaign/claim
```

New account dossiers are private and every query is scoped by `owner_user_id`.
An existing public campaign can be claimed only with its organizer key; the same
row remains public-read/organizer-write compatible after the ownership upgrade.

`POST /api/feedback` accepts:

```json
{
  "requestId": "bd72f763-bbf4-45aa-a534-e47fb4e18f18",
  "category": "bug",
  "message": "At least ten and at most two thousand characters.",
  "contact": "optional, at most 180 characters",
  "appVersion": "2026.07.31",
  "locale": "en",
  "section": "chronicle"
}
```

The server creates the stable feedback ID with Web Crypto. `requestId` and a
SHA-256 payload hash make retries idempotent: the same payload returns the
existing receipt, while a changed payload returns `409 request_id_conflict`.
Feedback has no public read route.

## Feedback automation

Server-to-server automation uses
`Authorization: Bearer <FEEDBACK_AUTOMATION_TOKEN>`. These routes intentionally
do not return browser CORS headers:

```text
POST /api/feedback/automation/claim
POST /api/feedback/automation/:feedbackId/ack
POST /api/feedback/automation/:feedbackId/retry
POST /api/feedback/automation/:feedbackId/ignored
```

`claim` accepts an optional `limit` (1–25) and `leaseSeconds` (60–3600); the
default lease is 900 seconds. Each returned item contains a `claimToken`.
Outcome requests must send that token in JSON. `retry` additionally accepts
`retryAfterSeconds` and a bounded `error` string. Expired leases can be claimed
again; stale outcome tokens are rejected.

Cloud mutations additionally require `X-Organizer-Token`. Only its SHA-256 hash
is stored in D1. Public campaign links never contain the organizer token.

The Worker enforces exact origins, request-size limits, per-IP rate limits
(including a feedback-specific limiter),
strict Turnstile action/hostname binding, bounded D1 payloads, and structured
logs without prompts, responses, dossier contents, or credentials.
