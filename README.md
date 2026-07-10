# Ibex Alarm Assist

A locally-hosted RAG system for industrial alarm response. Control-room operators ask about an alarm condition and get back the exact SOP procedure — steps, tag names, thresholds, and valve numbers reproduced verbatim from the source documents. If no procedure matches the specific equipment **and** condition asked about, the system refuses rather than improvising.

Everything runs on the local machine: Ollama for the LLM and embeddings, ChromaDB for the vector store, FastAPI for the service layer, and a React operator console for the UI. No data leaves the box.

## Architecture

```
frontend/  (React + Vite, port 5173)
    │  POST /query  { question }
    ▼
app.py     (FastAPI, port 8000)  ──►  audit.py  ──►  audit_log.jsonl
    │
    ▼
rag.py     (LlamaIndex query engine)
    ├──►  Ollama    llama3.2:3b (generation) + nomic-embed-text (embeddings)
    └──►  ChromaDB  ./chroma_db (persistent index of sops/)
```

Documents in `sops/` are chunked **one procedure per chunk** (split on the `SOP-032-` marker) so retrieval returns whole, self-contained procedures instead of fragments blended across alarms.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for the frontend)
- **[Ollama](https://ollama.com)** installed and running

Pull the two models the service uses:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

## Backend setup (RAG service)

From the repo root:

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start the service:

```bash
python -m uvicorn app:app --reload
```

On the **first run**, the service reads every file in `sops/`, splits it into per-procedure chunks, embeds them, and persists the index to `./chroma_db`. Later runs load the existing index from disk, so startup is fast.

**Re-indexing:** the index is only built when the Chroma collection is empty. If you add or edit files in `sops/`, delete the `chroma_db/` folder and restart the service to rebuild.

Sanity-check it's up:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## Frontend setup (operator console)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The console shows a live link indicator (polls `/health`), a chat-style session transcript, and a query bar docked at the bottom. Each response is flagged either **PROCEDURE RETRIEVED** (green) or **NO MATCHING PROCEDURE** (amber), with a provenance table listing the source chunks and their similarity scores.

The Vite dev server proxies `/query` and `/health` to the FastAPI service on port 8000 (see `frontend/vite.config.js`), so the browser never makes a cross-origin request and the backend needs no CORS configuration. This means **the backend must be running on port 8000** for the frontend to work.

## API

### `POST /query`

```bash
curl -X POST http://localhost:8000/query \
  -H 'Content-Type: application/json' \
  -d '{"question": "What is the response to a TAHH-101 alarm?"}'
```

Response:

```json
{
  "answer": "1. Acknowledge the TAHH-101 alarm on the HMI. ...",
  "sources": [
    { "file": "SOP-OTSG-Shutdown-Procedures.txt", "score": 0.5903 }
  ]
}
```

When nothing matches, `answer` is exactly `"I do not have a procedure for that."`

### `GET /health`

Returns `{"status": "ok"}`. Used by the frontend's link indicator.

## Evaluation

`eval.py` runs a fixed suite of test questions against the live service — both *answer* cases (the response must contain required tags, thresholds, and valve numbers) and *refusal* cases (the system must decline out-of-scope questions rather than invent or borrow a procedure).

With the backend running:

```bash
python eval.py
```

Add new cases by appending to `TEST_CASES` in `eval.py`. Refusal failures matter most — they mean the system answered something it should have declined.

## Audit log

Every query is appended to `audit_log.jsonl` as one JSON object per line: timestamp, question, answer, and the retrieved sources. This is the compliance trail for what the system told operators and on what basis.

## Configuration

All knobs live in `config.py`:

| Setting | Default | Purpose |
|---|---|---|
| `LLM_MODEL` | `llama3.2:3b` | Ollama model for generation |
| `EMBED_MODEL` | `nomic-embed-text` | Ollama model for embeddings |
| `SIMILARITY_TOP_K` | `4` | Chunks retrieved per query |
| `RESPONSE_MODE` | `tree_summarize` | LlamaIndex response synthesis mode |
| `CHROMA_PATH` | `./chroma_db` | Vector store location |
| `SOPS_DIR` | `sops` | Source procedure documents |
| `AUDIT_LOG_PATH` | `audit_log.jsonl` | Audit trail location |

## Project structure

```
├── app.py            FastAPI service — HTTP layer only
├── rag.py            Retrieval + generation (LlamaIndex, Chroma, Ollama)
├── audit.py          Appends every query/response to the audit log
├── config.py         Central configuration
├── eval.py           Regression suite run against the live service
├── sops/             Source SOP documents (indexed on first run)
├── chroma_db/        Persistent vector index (generated — delete to rebuild)
└── frontend/         React operator console (Vite)
    ├── vite.config.js       Dev proxy to the backend on :8000
    └── src/
        ├── api.js           All backend calls live here
        ├── App.jsx          Session transcript state
        └── components/      StatusBar, QueryBar, Exchange
```
