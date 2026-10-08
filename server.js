import http from "node:http";

const PORT = Number(process.env.API_PORT || 8787);
const DEFAULT_LOCAL_URL = process.env.LOCAL_LLM_URL || "http://localhost:11434";
const PROVIDER_ORDER = ["google", "openai", "anthropic", "local"];
const MODEL_REGISTRY = {
  google: {
    context_window: 1_048_576,
    max_output_tokens: 8192,
    supports_tools: true,
    default_model: "gemini-2.0-flash",
  },
  openai: {
    context_window: 128000,
    max_output_tokens: 4096,
    supports_tools: true,
    default_model: "gpt-4o-mini",
  },
  anthropic: {
    context_window: 200000,
    max_output_tokens: 8192,
    supports_tools: true,
    default_model: "claude-3-5-haiku-latest",
  },
  local: {
    context_window: 32768,
    max_output_tokens: 4096,
    supports_tools: false,
    default_model: "llama3:8b",
  },
};
const CONVERSATIONS = new Map();
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

function normalizeLocalUrl(localUrl) {
  const value = String(localUrl || "").trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `http://${value}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`Invalid Ollama URL: ${value || "(empty)"}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Ollama URL must use http:// or https://.");
  }
  return parsed.href.replace(/\/+$/, "");
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

function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => ({
      role: String(message?.role || "user"),
      content: String(message?.content || ""),
      model: typeof message?.model === "string" ? message.model : undefined,
    }))
    .filter(
      (message) => ["system", "user", "assistant"].includes(message.role) && message.content,
    );
}

function createConversation(conversationId) {
  return {
    conversationId,
    createdAt: new Date().toISOString(),
    activeModel: "auto",
    summary: "",
    summarizedThrough: 0,
    version: 1,
    messages: [],
  };
}

function getConversation(conversationId) {
  const id = String(
    conversationId || `conversation-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
  );
  if (!CONVERSATIONS.has(id)) CONVERSATIONS.set(id, createConversation(id));
  return CONVERSATIONS.get(id);
}

function buildContextFailure(errorMessage) {
  const normalized = String(errorMessage || "").toLowerCase();
  if (
    normalized.includes("context") ||
    normalized.includes("too many tokens") ||
    normalized.includes("maximum context") ||
    normalized.includes("prompt is too long") ||
    normalized.includes("token limit")
  ) {
    return "context_window";
  }
  if (
    normalized.includes("output token") ||
    normalized.includes("max_tokens") ||
    normalized.includes("output limit") ||
    normalized.includes("maximum output")
  ) {
    return "output_limit";
  }
  if (normalized.includes("rate limit") || normalized.includes("429")) return "rate_limit";
  if (
    normalized.includes("authentication") ||
    normalized.includes("unauthorized") ||
    normalized.includes("api key") ||
    normalized.includes("invalid key")
  ) {
    return "auth_error";
  }
  return "provider_error";
}

function getProviderApiKey(candidate, apiKeys) {
  const value = apiKeys?.[candidate];
  return typeof value === "string" ? value.trim() : "";
}

function getModelChoice(provider, models, candidate) {
  const modelValue = models?.[candidate] || models?.[provider];
  if (typeof modelValue === "string" && modelValue.trim()) return modelValue;
  return MODEL_REGISTRY[provider]?.default_model || MODEL_REGISTRY[candidate]?.default_model || "";
}

function getModelLimits(provider) {
  return MODEL_REGISTRY[provider] || MODEL_REGISTRY.openai;
}

function fitsModelContext(messages, provider) {
  const modelLimits = getModelLimits(provider);
  const serialized = JSON.stringify(messages || []);
  const systemReserve = 2000;
  const safetyMargin = modelLimits.context_window * 0.15;
  const inputBudget = modelLimits.context_window - modelLimits.max_output_tokens - systemReserve - safetyMargin;
  return estimateTokens(serialized) <= Math.max(1, inputBudget);
}

async function localGenerate(localUrl, model, prompt) {
  const r = await fetch(`${normalizeLocalUrl(localUrl)}/api/generate`, {
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
  if (!data.response) throw new Error("The local LLM returned an empty response.");
  return data.response.trim();
}

async function compressWithLocal({ localUrl, localModel, text, direction, targetRatio = 0.55 }) {
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

async function summarizeConversation({
  localUrl,
  localModel,
  messages,
  previousSummary = "",
}) {
  if (!messages?.length && !previousSummary) return "";
  const text = [
    previousSummary ? `Existing conversation summary:\n${previousSummary}` : "",
    ...(messages || []).map(
      (message) => `${message.role.toUpperCase()}: ${message.content}`,
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
  return localGenerate(
    localUrl,
    localModel,
    `You are a memory-management assistant for a multi-model chat system. Produce a compact but faithful summary of the conversation that preserves the user's goals, constraints, decisions, risks, and key facts. Incorporate the existing summary without losing relevant details. Return only the summary.\n\n${text}`,
  );
}

async function buildContextForModel({
  provider,
  conversation,
  localUrl,
  localModel,
  currentMessages,
}) {
  const history = normalizeMessages(conversation.messages || []);
  if (currentMessages?.length) {
    history.splice(
      history.length - currentMessages.length,
      currentMessages.length,
      ...currentMessages,
    );
  }
  if (!history.length) return [];

  let keepCount = Math.min(12, history.length);
  while (keepCount > 0) {
    const summarizeUntil = history.length - keepCount;
    if (summarizeUntil > conversation.summarizedThrough) {
      conversation.summary = await summarizeConversation({
        localUrl,
        localModel,
        messages: history.slice(conversation.summarizedThrough, summarizeUntil),
        previousSummary: conversation.summary,
      });
      conversation.summarizedThrough = summarizeUntil;
    }

    const builtMessages = [];
    if (conversation.summary) {
      builtMessages.push({
        role: "system",
        content: `Conversation summary: ${conversation.summary}`,
      });
    }
    builtMessages.push(...history.slice(summarizeUntil));
    if (fitsModelContext(builtMessages, provider)) return builtMessages;

    keepCount -= 1;
  }

  throw new Error("Context window exceeded for this request.");
}

async function callProvider(provider, apiKey, model, messages, localUrl) {
  const normalizedMessages = normalizeMessages(messages);

  if (provider === "local") {
    const r = await fetch(`${normalizeLocalUrl(localUrl)}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: model || MODEL_REGISTRY.local.default_model,
        messages: normalizedMessages.map(({ role, content }) => ({ role, content })),
        stream: false,
        options: { temperature: 0.1 },
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Local Ollama returned ${r.status}`);
    return d.message?.content || "";
  }

  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || MODEL_REGISTRY.openai.default_model,
        messages: normalizedMessages,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error?.message || `OpenAI returned ${r.status}`);
    return d.choices?.[0]?.message?.content || "";
  }

  if (provider === "anthropic") {
    const system = normalizedMessages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || MODEL_REGISTRY.anthropic.default_model,
        max_tokens: MODEL_REGISTRY.anthropic.max_output_tokens,
        ...(system ? { system } : {}),
        messages: normalizedMessages.filter((message) => message.role !== "system"),
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error?.message || `Anthropic returned ${r.status}`);
    return d.content?.map((entry) => entry.text || "").join("") || "";
  }

  if (provider === "google") {
    const system = normalizedMessages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");
    const contents = normalizedMessages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || MODEL_REGISTRY.google.default_model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        }),
      },
    );
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error?.message || `Google AI returned ${r.status}`);
    return d.candidates?.[0]?.content?.parts?.map((entry) => entry.text || "").join("") || "";
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function requestWithAvailableProvider({
  provider,
  apiKeys,
  models,
  messages,
  localUrl,
  localModel,
  conversation,
}) {
  const candidates =
    provider && provider !== "auto"
      ? [provider, ...PROVIDER_ORDER.filter((candidate) => candidate !== provider)]
      : PROVIDER_ORDER;
  const failures = [];
  const attemptedProviders = [];

  for (const candidate of candidates) {
    const key = getProviderApiKey(candidate, apiKeys);
    if (candidate !== "local" && !key) continue;
    attemptedProviders.push(candidate);

    try {
      const contextMessages = await buildContextForModel({
        provider: candidate,
        conversation,
        localUrl,
        localModel,
        currentMessages: messages,
      });
      if (!fitsModelContext(contextMessages, candidate)) {
        failures.push(`${candidate}: context window exceeded for this request.`);
        continue;
      }

      const selectedModel =
        candidate === "local"
          ? localModel
          : getModelChoice(candidate, models, candidate);
      const text = await callProvider(
        candidate,
        key,
        selectedModel,
        contextMessages,
        localUrl,
      );
      if (!text) throw new Error("Provider returned an empty response.");
      return { provider: candidate, text, attemptedProviders };
    } catch (error) {
      const failureType = buildContextFailure(error.message);
      if (failureType === "context_window") {
        failures.push(`${candidate}: context window exceeded for this request.`);
        continue;
      }
      if (failureType === "output_limit") {
        failures.push(`${candidate}: output limit reached.`);
        continue;
      }
      failures.push(`${candidate}: ${error.message}`);
    }
  }

  if (!attemptedProviders.length) {
    throw new Error("No provider API key is configured. Add at least one key in Settings.");
  }

  const detail = failures.length ? failures.join(" | ") : "provider error";
  throw new Error(`All configured providers failed. ${detail}`);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});

  if (req.method === "GET" && (req.url === "/api/health" || req.url === "/api/version")) {
    return send(res, 200, {
      ok: true,
      version: "context-routing-v2",
      localUrl: DEFAULT_LOCAL_URL,
    });
  }

  if (req.method !== "POST" || !req.url.startsWith("/api/chat")) {
    return send(res, 404, { error: "Not found" });
  }

  let conversation;
  let pendingMessageCount = 0;
  try {
    const body = await readBody(req);
    const {
      provider = "auto",
      apiKeys,
      apiKey,
      model,
      models,
      localUrl = DEFAULT_LOCAL_URL,
      localModel = "llama3:8b",
      messages,
      conversationId,
      compress = true,
      targetRatio = 0.55,
    } = body;

    const normalizedKeys =
      apiKeys && typeof apiKeys === "object"
        ? apiKeys
        : provider !== "auto" && apiKey
          ? { [provider]: apiKey }
          : {};

    if (!Array.isArray(messages) || !messages.length) {
      return send(res, 400, { error: "At least one message is required." });
    }

    conversation = getConversation(conversationId);
    const cleanMessages = normalizeMessages(messages);
    if (!cleanMessages.length) {
      return send(res, 400, { error: "At least one non-empty message is required." });
    }

    conversation.messages.push(...cleanMessages);
    pendingMessageCount = cleanMessages.length;
    conversation.activeModel = provider || "auto";

    const requestMessages = compress
      ? await Promise.all(
          cleanMessages.map(async (message) =>
            message.role === "user"
              ? {
                  ...message,
                  content: await compressWithLocal({
                    localUrl,
                    localModel,
                    text: message.content,
                    direction: "request",
                    targetRatio,
                  }),
                }
              : message,
          ),
        )
      : cleanMessages;

    const result = await requestWithAvailableProvider({
      provider,
      apiKeys: normalizedKeys,
      models: models || { [provider]: model },
      messages: requestMessages,
      localUrl,
      localModel,
      conversation,
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

    conversation.messages.push({ role: "assistant", content: result.text, model: result.provider });
    pendingMessageCount = 0;

    send(res, 200, {
      conversationId: conversation.conversationId,
      provider: result.provider,
      attemptedProviders: result.attemptedProviders,
      response: responseText,
      originalResponse: result.text,
      compressed: compress,
      request: { original: originalRequest, compressed: compressedRequest },
      context: {
        summary: conversation.summary,
        messageCount: conversation.messages.length,
      },
      tokenStats: {
        request: compressionStats(originalRequest, compressedRequest),
        response: compressionStats(result.text, responseText),
      },
    });
  } catch (error) {
    if (conversation && pendingMessageCount) {
      conversation.messages.splice(-pendingMessageCount, pendingMessageCount);
    }
    send(res, 502, { error: error.message || "Request failed." });
  }
});

server.listen(PORT, () => {
  console.log(
    `API server listening on http://localhost:${PORT} (context-aware model routing enabled)`,
  );
});
