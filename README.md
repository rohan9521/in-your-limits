# In Your Limits

The gateway supports automatic provider selection and in-request failover. It tries the selected provider first (or Gemini, OpenAI, Anthropic, then Local Ollama in automatic mode) and switches to another available route if a model hits a context/token limit, quota/rate limit, or provider error.

The local Ollama model compresses the request before the provider call and compresses the response before it reaches the browser. You can also select Local Ollama in the chat model dropdown to use it for the answer. Provider retries happen within the same request, so the user does not need to resend their prompt. The conversation history is retained across the switch; older turns are summarized locally when a provider's context window requires it.

## Run locally

```bash
ollama serve
ollama pull llama3:8b
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5174`, open **Connections**, add one or more API keys, leave **Model** set to **Automatic**, and send a request. Each provider card links to its API-key page; keys are stored in this browser. You can explicitly select a provider or Local Ollama from the message composer.

The development API listens on `API_PORT` (default `8787`), and Vite proxies `/api` to that same port. The UI uses `VITE_PORT` (default `5174`) so browser-stored connection settings remain on a consistent local origin.

## Provider routing

- **Automatic**: tries configured cloud providers in this order: Gemini, OpenAI, Anthropic, then Local Ollama.
- **Explicit provider**: tries the selected route first, then other configured cloud providers and Local Ollama if it fails.
- Failover preserves conversation history and reports which provider ultimately answered.
- The response identifies which provider was used.

## Test provider failover

To test with real credentials, configure valid keys for two cloud providers, select the first provider in the chat dropdown, and temporarily replace that provider's key with an invalid value in **Connections**. Send a prompt. The request should fail over to the other provider, and the notice above the chat should name the provider that answered. Restore the valid key afterward. With Ollama running, Local Ollama is also available as a final fallback route.

## Security

Provider keys are stored in browser storage and sent only to the local API server for a request. This is for local development; use a secured authenticated backend and server-side secret storage in production.
