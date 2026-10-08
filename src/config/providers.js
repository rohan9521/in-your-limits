export const PROVIDERS = [
  {
    id: "google",
    name: "Google AI (Gemini)",
    hint: "AIza...",
    model: "gemini-3.6-flash",
  },
  { id: "openai", name: "OpenAI", hint: "sk-...", model: "gpt-4o-mini" },
  {
    id: "anthropic",
    name: "Anthropic",
    hint: "sk-ant-...",
    model: "claude-3-5-haiku-latest",
  },
];

export const CHAT_ROUTES = [
  ...PROVIDERS,
  { id: "local", name: "Local Ollama" },
];

export const INITIAL_KEYS = Object.fromEntries(
  PROVIDERS.map(({ id }) => [id, ""]),
);

export function getProviderName(providerId) {
  return CHAT_ROUTES.find(({ id }) => id === providerId)?.name || providerId;
}
