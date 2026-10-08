import { PROVIDERS } from "../config/providers";

export async function sendChatRequest({
  provider,
  apiKeys,
  localUrl,
  localModel,
  prompt,
  conversationId,
}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider,
      apiKeys,
      models: {
        ...Object.fromEntries(PROVIDERS.map(({ id, model }) => [id, model])),
        local: localModel,
      },
      localUrl,
      localModel,
      conversationId,
      messages: [{ role: "user", content: prompt }],
      compress: true,
      targetRatio: 0.55,
    }),
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Chat API returned a non-JSON response (HTTP ${response.status}). Check the API server and port configuration.`,
    );
  }
  if (!response.ok) {
    throw new Error(data.error || `Chat API returned HTTP ${response.status}.`);
  }
  if (!responseText) {
    throw new Error(`Chat API returned an empty response (HTTP ${response.status}).`);
  }
  return data;
}
