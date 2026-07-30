# Campaign Archivist Worker

Cloudflare Worker for the Malifaux Campaign Builder. It keeps the DeepSeek key
server-side, retrieves relevant passages from the bundled Campaign Mode pages,
and returns an answer plus printed source-page numbers.

## Local checks

```powershell
npm install
npm test
npm run check
```

Rebuild the generated rules module after replacing the source PDF:

```powershell
python scripts/extract-rules.py
```

## Secrets

Never put the real key in `wrangler.jsonc`, source code, or Git. Set it directly
in Cloudflare:

```powershell
npx wrangler secret put DEEPSEEK_API_KEY
```

For local Worker development, create an ignored `worker/.dev.vars`:

```text
DEEPSEEK_API_KEY=your-local-key
```

## Deploy

```powershell
npx wrangler login
npx wrangler deploy
```

After deployment, place the resulting `/api/chat` URL in the
`chat-api-url` meta element in the root `index.html`.

## Public request

`POST /api/chat`

```json
{
  "message": "How do Barter Flips work?",
  "history": [],
  "locale": "en",
  "sessionId": "browser-session-id"
}
```

The Worker accepts only configured origins, limits request and history sizes,
applies the Cloudflare rate-limit binding, hides upstream errors, and never
returns the DeepSeek credential.
