# Battery RAG Architecture

## Tech Stack

- **Frontend:** React, Material UI, Axios
- **Backend API:** Flask, Flask-CORS, Gunicorn
- **Retrieval:** FAISS when available, with a numpy cosine-similarity fallback
- **Embeddings:** deterministic local hash embeddings by default, optional OpenAI `text-embedding-3-small`
- **Generation:** Gemini via `google-generativeai`, optional OpenAI Responses API, deterministic local fallback
- **Knowledge base:** `data/battery_docs.json` persisted into `embeddings/store/`
- **Deployment:** Render Blueprint with one Python web service and one React static site

## High-Level Flow

```text
User Query
  ->
Query Embedding
  ->
Vector Store (FAISS when available)
  ->
Top-K Documents
  ->
LLM (Gemini) 
  ->
Final Answer
```

## Project Layout

```text
data/
  battery_docs.json

embeddings/
  embed.py
  store/

rag/
  __init__.py
  retrieve.py
  generate.py

backend/
  api.py

frontend/
  src/components/BatteryAssistantPanel.js
```

## Dataset Structure

Each JSON entry is designed for RAG retrieval and answer grounding:

```json
{
  "id": 1,
  "topic": "overheating during charging",
  "content": "Battery heating during charging is often caused by high ambient temperature...",
  "tags": ["temperature", "charging", "thermal", "safety"],
  "severity": "high",
  "recommendation": "Charge in a ventilated area...",
  "cause": "High current flow and poor heat dissipation increase internal losses.",
  "effect": "Faster aging, reduced cycle life, and possible shutdown events.",
  "confidence": 0.95,
  "source": "Battery knowledge base"
}
```

## Knowledge Categories

- Failure causes
- Symptoms to diagnosis
- Best practices
- Technical knowledge
- Edge cases and safety

## API Contract

`POST /rag/query`

Request:

```json
{
  "query": "Why does my battery heat while charging?",
  "top_k": 3,
  "provider": "auto"
}
```

Response:

```json
{
  "query": "Why does my battery heat while charging?",
  "answer": "...",
  "provider": "local",
  "retrieved_documents": [],
  "knowledge_base": {
    "document_count": 30,
    "embedding_provider": "local",
    "embedding_model": "hashing-v1",
    "faiss_enabled": false
  },
  "timestamp": "2026-04-26T00:00:00"
}
```

## Notes

- The system works offline with deterministic local hash embeddings.
- If `OPENAI_API_KEY` is set, embeddings and answer generation can use OpenAI.
- If `GEMINI_API_KEY` is set, answer generation can use Gemini.
- FAISS is used when installed; otherwise retrieval falls back to normalized numpy similarity.

## Gemini Key Placement

For local development, create a `.env` file from `.env.example` and add:

```text
GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-1.5-flash
```

For Render Blueprint deployment, add `GEMINI_API_KEY` when Render prompts for backend service secrets. Keep it only on the backend service; the React frontend should never receive the Gemini key.

## Render Blueprint

`render.yaml` deploys:

- `smart-battery-api`: Flask API serving `/predict`, `/rag/query`, and model metadata.
- `smart-battery-frontend`: React static dashboard with the Solve Battery Query panel.

The Blueprint wires `REACT_APP_API_URL` from the API service URL and `FRONTEND_ORIGIN` from the frontend service URL. Secret LLM keys are declared with `sync: false`, so Render asks for them during Blueprint creation instead of storing them in Git.
