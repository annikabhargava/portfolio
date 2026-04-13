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
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}

function extractTextFromAnthropic(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((c) => c && c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "*";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsOrigin = allowedOrigin === "*" ? origin : allowedOrigin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    }

    if (url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (allowedOrigin !== "*" && origin !== allowedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response("Server is missing ANTHROPIC_API_KEY", { status: 500 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders(corsOrigin) });
    }

    const incoming = Array.isArray(payload?.messages) ? payload.messages : [];
    const messages = incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-20);

    if (messages.length === 0) {
      return new Response("Missing messages", { status: 400, headers: corsHeaders(corsOrigin) });
    }

    const system = [
      "You are Annika Bhargava’s portfolio assistant.",
      "Be concise, warm, and specific.",
      "Answer questions about Annika’s UX writing/content design work, approach, and case studies.",
      "If asked for private info or anything not in the portfolio, say you don’t know and offer what you can share."
    ].join(" ");

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 400,
        temperature: 0.4,
        system,
        messages
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      return new Response(`Anthropic error (${anthropicRes.status}): ${errText}`, {
        status: 502,
        headers: corsHeaders(corsOrigin)
      });
    }

    const data = await anthropicRes.json();
    const reply = extractTextFromAnthropic(data?.content);

    return json(
      { reply: reply || "" },
      { status: 200, headers: corsHeaders(corsOrigin) }
    );
  }
};

