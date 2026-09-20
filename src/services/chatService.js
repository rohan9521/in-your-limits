import { PROVIDERS } from "../config/providers";

export async function sendChatRequest({
  provider,
  apiKeys,
  localUrl,
  localModel,
  prompt,
}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider,
      apiKeys,
      models: Object.fromEntries(PROVIDERS.map(({ id, model }) => [id, model])),
      localUrl,
      localModel,
      messages: [{ role: "user", content: prompt }],
      compress: true,
      targetRatio: 0.55,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
