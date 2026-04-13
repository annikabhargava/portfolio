function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function corsHeaders(origin) {
  const allowOrigin = origin === "*" ? "*" : origin;
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin",
    "access-control-max-age": "86400"
  };
}

function pickAllowedOrigin(requestOrigin, allowedOrigins) {
  if (allowedOrigins.length === 0) return null;
  // If "*" is allowed, accept requests even when Origin is missing or "null".
  // For CORS responses, we can safely respond with "*" in that case.
  if (allowedOrigins.includes("*")) return requestOrigin || "*";
  if (!requestOrigin) return null;
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin;

  // Allow simple wildcard suffix patterns like: https://*.vercel.app
  for (const entry of allowedOrigins) {
    const trimmed = entry.trim();
    if (!trimmed.includes("*")) continue;
    const [prefix, suffix] = trimmed.split("*");
    if (requestOrigin.startsWith(prefix) && requestOrigin.endsWith(suffix)) return requestOrigin;
  }
  return null;
}

function extractTextFromAnthropic(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((c) => c && c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

function extractTextFromWorkersAI(result) {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (Array.isArray(result)) return result.map(extractTextFromWorkersAI).join("\n");
  return "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const allowedOriginsRaw = (env.ALLOWED_ORIGIN || "*")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const corsOrigin = pickAllowedOrigin(origin, allowedOriginsRaw);
    const cors = corsOrigin ? corsHeaders(corsOrigin) : {};

    if (request.method === "OPTIONS") {
      // Always answer preflight with CORS headers if allowed; otherwise 204 without CORS.
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/api/debug") {
      // Safe debugging info (never returns secrets).
      return json(
        {
          ok: true,
          receivedOrigin: origin || null,
          allowedOriginConfig: env.ALLOWED_ORIGIN || null,
          allowedOriginParsed: allowedOriginsRaw,
          corsOrigin: corsOrigin || null,
          hasWorkersAI: Boolean(env.AI)
        },
        { status: 200, headers: corsOrigin ? cors : { "content-type": "application/json; charset=utf-8" } }
      );
    }

    if (url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    if (!corsOrigin) {
      // No CORS match -> browsers surface this as "Failed to fetch"
      // (the response may be blocked). We still return CORS-less 403.
      return new Response("Forbidden", { status: 403 });
    }

    if (!env.AI) {
      return new Response("Server is missing Workers AI binding (env.AI)", { status: 500, headers: cors });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: cors });
    }

    const incoming = Array.isArray(payload?.messages) ? payload.messages : [];
    const messages = incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-20);

    if (messages.length === 0) {
      return new Response("Missing messages", { status: 400, headers: cors });
    }

    const system = [
      "You are Annika Bhargava’s portfolio assistant.",
      "Be concise, warm, and specific.",
      "Answer questions about Annika’s UX writing/content design work, approach, and case studies.",
      "If asked for private info or anything not in the portfolio, say you don’t know and offer what you can share."
    ].join(" ");

    // Workers AI chat models use a different schema than Anthropic.
    // We'll map our (role, content) messages into a single prompt.
    const transcript = messages
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
      .join("\n");
    const prompt = `${system}\n\n${transcript}\nAssistant:`;

    let result;
    try {
      result = await env.AI.run(env.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 300
      });
    } catch (e) {
      return new Response(`Workers AI error: ${e?.message || String(e)}`, { status: 502, headers: cors });
    }

    const reply = extractTextFromWorkersAI(result).trim();

    return json(
      { reply: reply || "" },
      { status: 200, headers: cors }
    );
  }
};

