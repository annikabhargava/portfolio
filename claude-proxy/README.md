# Claude proxy (Cloudflare Worker)

This Worker keeps your Anthropic/Claude API key off the frontend.

## Deploy

1) Install Wrangler (Cloudflare’s CLI) if you don’t have it:

```bash
npm i -g wrangler
```

2) Login:

```bash
wrangler login
```

3) Configure CORS allowlist (recommended):

```bash
wrangler secret put ALLOWED_ORIGIN
```

Example value:
- `https://yourdomain.com`

You can also allow multiple origins (comma-separated), for example:

- `https://yourdomain.com,https://your-vercel-project.vercel.app,https://*.vercel.app`

4) Deploy:

```bash
wrangler deploy
```

Wrangler will print a URL like:
- `https://portfolio-claude-proxy.<your-subdomain>.workers.dev`

Your endpoint is:
- `https://...workers.dev/api/chat`

## Connect the portfolio frontend

In `index.html`, set:

```js
window.CLAUDE_PROXY_URL = "https://...workers.dev/api/chat";
```

## Models (Workers AI)

This proxy uses **Cloudflare Workers AI** (open models) by default.

- Default model: `@cf/meta/llama-3.1-8b-instruct`
- Optional override:

```bash
wrangler secret put WORKERS_AI_MODEL
```

