import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const DEFAULT_LOCAL_URL = process.env.LOCAL_LLM_URL || "http://localhost:11434";
const PROVIDER_ORDER = ["google", "openai", "anthropic"];
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "http://localhost:5173",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function send(res, status, body) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (raw.length > 1_000_000) throw new Error("Request is too large.");
  return raw ? JSON.parse(raw) : {};
}
function estimateTokens(text) {
  return Math.max(0, Math.ceil(String(text || "").length / 4));
}
function compressionStats(original, compressed) {
  const originalTokens = estimateTokens(original);
  const compressedTokens = estimateTokens(compressed);
  return {
    originalTokens,
    compressedTokens,
    suppressedTokens: Math.max(0, originalTokens - compressedTokens),
  };
}

async function localGenerate(localUrl, model, prompt) {
  const r = await fetch(`${localUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1 },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Local LLM returned ${r.status}`);
  if (!data.response)
    throw new Error("The local LLM returned an empty response.");
  return data.response.trim();
}

async function compressWithLocal({
  localUrl,
  localModel,
  text,
  direction,
  targetRatio = 0.55,
}) {
  const task =
    direction === "request"
      ? "Rewrite the request compactly while preserving every requirement, constraint, number, named entity, and desired output format."
      : "Rewrite the answer compactly while preserving facts, caveats, steps, code, and formatting needed by the user.";
  return localGenerate(
    localUrl,
    localModel,
    `You are a lossless token-compression layer. ${task}\n\nRules:\n- Return only the rewritten content.\n- Do not invent, remove, or change facts.\n- Keep code valid and identifiers exact.\n- Aim for about ${Math.round(targetRatio * 100)}% of the original tokens; preserve meaning over the target.\n\nContent:\n${text}`,
  );
}

async function callProvider(provider, apiKey, model, messages) {
  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(d.error?.message || `OpenAI returned ${r.status}`);
    return d.choices?.[0]?.message?.content || "";
  }
  if (provider === "anthropic") {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-haiku-latest",
        max_tokens: 4096,
        ...(system ? { system } : {}),
        messages: messages.filter((m) => m.role !== "system"),
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(d.error?.message || `Anthropic returned ${r.status}`);
    return d.content?.map((x) => x.text || "").join("") || "";
  }
  if (provider === "google") {
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents }),
      },
    );
    const d = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(d.error?.message || `Google AI returned ${r.status}`);
    return (
      d.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || ""
    );
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function requestWithAvailableProvider({
  provider,
  apiKeys,
  models,
  messages,
}) {
  const candidates =
    provider && provider !== "auto" ? [provider] : PROVIDER_ORDER;
  const failures = [];
  for (const candidate of candidates) {
    const key =
      typeof apiKeys?.[candidate] === "string" ? apiKeys[candidate].trim() : "";
    if (!key) continue;
    try {
      const text = await callProvider(
        candidate,
        key,
        models?.[candidate],
        messages,
      );
      if (!text) throw new Error("Provider returned an empty response.");
      return { provider: candidate, text };
    } catch (error) {
      failures.push(`${candidate}: ${error.message}`);
    }
  }
  if (
    !candidates.some(
      (candidate) =>
        typeof apiKeys?.[candidate] === "string" && apiKeys[candidate].trim(),
    )
  )
    throw new Error(
      "No provider API key is configured. Add at least one key in Settings.",
    );
  throw new Error(`All configured providers failed. ${failures.join(" | ")}`);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (
    req.method === "GET" &&
    (req.url === "/api/health" || req.url === "/api/version")
  )
    return send(res, 200, {
      ok: true,
      version: "auto-routing-v2",
      localUrl: DEFAULT_LOCAL_URL,
    });
  if (req.method !== "POST" || !req.url.startsWith("/api/chat"))
    return send(res, 404, { error: "Not found" });
  try {
    const body = await readBody(req);
    const {
      provider = "auto",
      apiKeys,
      apiKey,
      model,
      models,
      localUrl = DEFAULT_LOCAL_URL,
      localModel = "llama3.2:3b",
      messages,
      compress = true,
      targetRatio = 0.55,
    } = body;
    // Accept both the current apiKeys object and the older single-provider apiKey format.
    const normalizedKeys =
      apiKeys && typeof apiKeys === "object"
        ? apiKeys
        : provider !== "auto" && apiKey
          ? { [provider]: apiKey }
          : {};
    if (!Array.isArray(messages) || !messages.length)
      return send(res, 400, { error: "At least one message is required." });
    const cleanMessages = messages
      .map((m) => ({ role: m.role, content: String(m.content || "") }))
      .filter(
        (m) => ["system", "user", "assistant"].includes(m.role) && m.content,
      );
    if (!cleanMessages.length)
      return send(res, 400, {
        error: "At least one non-empty message is required.",
      });
    const requestMessages = compress
      ? await Promise.all(
          cleanMessages.map(async (m) =>
            m.role === "user"
              ? {
                  ...m,
                  content: await compressWithLocal({
                    localUrl,
                    localModel,
                    text: m.content,
                    direction: "request",
                    targetRatio,
                  }),
                }
              : m,
          ),
        )
      : cleanMessages;
    const result = await requestWithAvailableProvider({
      provider,
      apiKeys: normalizedKeys,
      models: models || { [provider]: model },
      messages: requestMessages,
    });
    const responseText = compress
      ? await compressWithLocal({
          localUrl,
          localModel,
          text: result.text,
          direction: "response",
          targetRatio,
        })
      : result.text;
    const originalRequest = cleanMessages
      .filter(({ role }) => role === "user")
      .map(({ content }) => content)
      .join("\n");
    const compressedRequest = requestMessages
      .filter(({ role }) => role === "user")
      .map(({ content }) => content)
      .join("\n");
    send(res, 200, {
      provider: result.provider,
      response: responseText,
      originalResponse: result.text,
      compressed: compress,
      request: { original: originalRequest, compressed: compressedRequest },
      tokenStats: {
        request: compressionStats(originalRequest, compressedRequest),
        response: compressionStats(result.text, responseText),
      },
    });
  } catch (error) {
    send(res, 502, { error: error.message || "Request failed." });
  }
});
server.listen(PORT, () =>
  console.log(
    `API server listening on http://localhost:${PORT} (automatic provider routing enabled)`,
  ),
);
