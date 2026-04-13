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

3) Configure secrets (from inside `claude-proxy/`):

```bash
cd claude-proxy
wrangler secret put ANTHROPIC_API_KEY
```

Optional (recommended): restrict who can call the Worker:

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

