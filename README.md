# In Your Limits

A local-first LLM gateway that compresses both sides of a request:

1. The browser sends a prompt to the local API server.
2. The local Ollama model rewrites the request without changing its meaning.
3. The compressed request is sent to OpenAI, Anthropic, or Google AI using the selected API key.
4. The provider response is sent through Ollama again and the compact answer is returned to the browser.

## Run locally

Install Ollama and pull a model first:

```bash
ollama serve
ollama pull llama3.2:3b
```

Then run the app:

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`, configure the local URL/model and one provider API key, then send a request.

## API

The Node API server listens on `http://localhost:8787` and exposes:

- `GET /api/health`
- `POST /api/chat`

`POST /api/chat` performs request compression, provider routing, and response compression. `targetRatio` defaults to `0.55`; it is a target rather than a hard guarantee because the local model preserves meaning over a strict token count.

## Security

This is a local development gateway. Provider keys are kept in browser storage and sent to the local server only when a request is made. For production, move key storage to a secured backend, authenticate the local API, add rate limits, and never expose provider keys to an untrusted frontend.
