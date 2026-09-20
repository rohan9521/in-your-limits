# In Your Limits

A local-first LLM request optimizer frontend. It provides a dashboard for connecting a local model, storing provider credentials in the browser, and preparing prompts before routing them to a provider.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The UI defaults to Ollama at `http://localhost:11434`. Configure another local endpoint from **Settings**. The current frontend checks the Ollama `/api/tags` endpoint; a backend adapter can be added later for other local runtimes and provider requests.

## Safety

API keys are stored in `localStorage` on the current browser only. This is suitable for a prototype, not production secret management. Do not expose provider keys to untrusted clients in a production deployment; route provider calls through a secured backend.
