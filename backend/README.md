# Feedback Bot - Backend

Express backend for the Ollama-powered "Feedback bot". Provides endpoints to generate responses and (optionally) stream them. The actual upstream API URL can be configured later.

## Endpoints
- `GET /health` – health and readiness
- `POST /api/feedback/generate` – generate a feedback response
- `GET /api/feedback/stream` – Server-Sent Events stream for token-by-token output (if upstream supports streaming)

## Quickstart
1. Copy env: `cp .env.example .env` (on Windows, create `.env` manually) and set values when available.
2. Install deps: `npm install`
3. Run in dev: `npm run dev`
4. Start: `npm start`

Requires Node.js 18+ (uses native `fetch`).

## Request/Response
### POST /api/feedback/generate
Body:
```json
{
  "message": "Original customer message",
  "context": "Optional internal context",
  "tone": "friendly|formal|neutral",
  "language": "en|...",
  "options": { "max_tokens": 400 }
}
```
Response:
```json
{
  "id": "req_xxx",
  "model": "Feedback bot",
  "output": "Generated reply text",
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

### GET /api/feedback/stream?message=...&tone=...&language=...
- SSE stream with events: `chunk`, `done`, `error`.

## Configuration
- `AI_API_BASE_URL` – base URL to your Ollama/gateway API (set later)
- `AI_MODEL_NAME` – model name (defaults to `Feedback bot`)
- `AI_API_KEY` – optional bearer key if your gateway requires it
- `PORT` – server port (default 8080)

## Notes
- If `AI_API_BASE_URL` is empty, the API will return 501 for generation endpoints so you can still run and test health.
- Input validation is done with `zod`.
