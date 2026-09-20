# In Your Limits

The gateway now supports automatic provider selection. Add any provider key and the app will use it; when multiple keys are configured, automatic routing tries Gemini first, then OpenAI, then Anthropic, and falls back to the next configured provider if a call fails.

The local Ollama model compresses the request before the provider call and compresses the response before it reaches the browser.

## Run locally

```bash
ollama serve
ollama pull llama3.2:3b
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`, add a Gemini key under **Settings**, leave **Route to** set to **Automatic**, and send a request. You can explicitly select a provider when needed.

## Provider routing

- **Automatic**: uses configured keys in this order: Gemini, OpenAI, Anthropic.
- **Explicit provider**: uses only the selected provider.
- If an available provider fails, automatic mode tries the next configured provider.
- The response identifies which provider was used.

## Security

Provider keys are stored in browser storage and sent only to the local API server for a request. This is for local development; use a secured authenticated backend and server-side secret storage in production.
