# Functional Requirements — Ibex Alarm Assist

**Document status:** Draft
**Date:** 2026-08-04
**Author:** Usmaan Sayed
**System:** Alarm-response assistant for SAGD control room operations

---

## 1. Purpose and Scope

### 1.1 Purpose

Ibex Alarm Assist is an operator-facing assistant that retrieves the correct written Standard Operating Procedure (SOP) for an active process alarm and presents it verbatim, without paraphrase or invention. It is intended to shorten the time between an alarm annunciating and an operator having the approved response steps in front of them.

### 1.2 Scope

The system comprises:

- A **SCADA-style HMI overview screen** displaying simulated SAGD process values and derived alarms.
- A **retrieval-augmented generation (RAG) service** that answers natural-language questions against a corpus of SOP documents using locally hosted language models.
- An **audit log** recording every query, answer, source, and model used.
- An **automated evaluation harness** verifying both correct retrieval and correct refusal.

### 1.3 Explicitly Out of Scope

| Item | Status |
|---|---|
| Live SCADA / OPC / Modbus integration | Not implemented — all process data is simulated |
| Safety-instrumented function (SIF) or any control action | Not implemented and not intended |
| User authentication, authorisation, or role separation | Not implemented |
| Multi-user session isolation | Not implemented |
| Cloud or third-party LLM inference | Not used — all inference is local |
| Alarm acknowledgement / shelving workflow | Not implemented |

### 1.4 Safety Classification

**This system is advisory only.** It performs no control action, has no write path to any process equipment, and is not a safety-instrumented system. It displays procedure text for a human operator to read and act upon. All operator actions remain governed by site policy and the controlled SOP documents themselves. The requirements in §4.4 (Grounding and Refusal) exist specifically to prevent the system from presenting invented procedure text as though it were approved.

---

## 2. System Overview

### 2.1 Architecture

```
Browser (React / Vite)
  │  HTTP  /query · /models · /health   (Vite dev proxy → :8000)
  ▼
FastAPI service (app.py)
  ├── rag.py     — retrieval, prompt construction, LLM invocation
  ├── audit.py   — append-only JSONL audit trail
  └── config.py  — all tunable parameters
        │
        ├── ChromaDB (persistent, on disk)  — SOP vector index
        └── Ollama (localhost)              — embedding + generation models
```

### 2.2 Actors

| Actor | Description |
|---|---|
| **Control room operator** | Primary user. Monitors the HMI, clicks alarms, asks natural-language questions, reads returned procedures. |
| **Engineer / maintainer** | Configures models and retrieval parameters, adds SOP documents, runs the evaluation harness. |
| **Auditor** | Reads the audit log after the fact to reconstruct what was asked, what was answered, and which model produced it. |

---

## 3. Definitions

| Term | Meaning |
|---|---|
| **SOP** | Standard Operating Procedure — a controlled written procedure for a specific equipment/condition pair. |
| **Chunk** | One complete SOP procedure, indexed as a single indivisible unit. |
| **Tag** | An instrument identifier (e.g. `PIC-101`, `LIC-201`). |
| **Trip / HH / LL** | Alarm thresholds. `hiHi`/`loLo` are critical; `hi`/`lo` are warnings. |
| **Refusal** | The system declining to answer because no matching procedure exists. |
| **Match rating** | Operator-readable bucketing of a retrieval similarity score. |

---

## 4. Functional Requirements

### 4.1 Process Display (HMI)

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-001** | The system shall display a control-room overview screen comprising equipment mimic panels for the OTSG, Well Pair A1/A2, and FWKO Separator, plus production trend, key metrics, and ESD status tiles. | Must | `App.jsx:55-67` |
| **FR-002** | The system shall display 16 process tags with instrument identifier, engineering unit, and value at the configured decimal precision. | Must | `useProcessData.js:14-78` |
| **FR-003** | Process values shall update on a fixed 2200 ms cadence. | Must | `useProcessData.js:163` |
| **FR-004** | Each tag value shall follow a bounded random walk with momentum, remaining within its defined `min`/`max` band and reversing at the bounds. | Must | `useProcessData.js:94-102` |
| **FR-005** | Each tag readout shall be colour-coded by status — normal, warning, or critical — using the same convention as the alarm banner. | Must | `useProcessData.js:153-161` |
| **FR-006** | The system shall render a persistent status bar and navigation tabs. | Should | `App.jsx:51-53` |

> **Note:** FR-002 through FR-004 describe *simulated* data. There is no live process connection (§1.3). Tag names and thresholds are drawn from the SOP documents so that every alarm the simulation raises has a real, matching procedure behind it.

### 4.2 Alarm Detection and Presentation

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-010** | The system shall derive an active alarm list from current tag values on every update cycle. | Must | `useProcessData.js:110-146` |
| **FR-011** | A tag crossing `hiHi` or `loLo` shall raise a **critical** alarm; crossing `hi` or `lo` shall raise a **warning** alarm. | Must | `useProcessData.js:114-143` |
| **FR-012** | The system shall support tags alarming in both directions (e.g. `LIC-201` raises `LAHH-201` on high level and `LALL-201` on low level), each mapped to its own procedure question. | Must | `useProcessData.js:61-68` |
| **FR-013** | Each alarm shall carry its alarm tag, severity, direction, descriptive message, associated equipment, current value, and a pre-formed natural-language question. | Must | `useProcessData.js:116-141` |
| **FR-014** | Active alarms shall be displayed in a banner at the top of the screen. | Must | `App.jsx:52` |
| **FR-015** | An operator shall be able to submit an alarm's procedure question to the assistant by clicking the alarm — from the banner, from an equipment mimic panel, or from the assistant's quick-ask chips. | Must | `AlarmBanner.jsx`, `AiPanel.jsx:32-43` |

### 4.3 Query and Response

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-020** | The system shall accept free-text operator questions via a query composer docked in the assistant panel. | Must | `QueryBar.jsx` |
| **FR-021** | The composer shall reject empty or whitespace-only submissions, and shall be disabled while a query is in flight. | Must | `QueryBar.jsx:9`, `:31` |
| **FR-022** | Each question and its response shall be recorded as an exchange in a session transcript, newest last, auto-scrolled into view. | Must | `AiPanel.jsx:17-19`, `:45-52` |
| **FR-023** | An exchange shall render one of four states: pending, procedure retrieved, no matching procedure, or backend unreachable. | Must | `Exchange.jsx:26-51` |
| **FR-024** | When a procedure is retrieved, the response shall display the full answer text with original whitespace preserved. | Must | `Exchange.jsx:53-58` |
| **FR-025** | When a procedure is retrieved, the system shall list the source SOP file(s) with a match rating: **GOOD MATCH** (score ≥ 0.55), **SLIGHT MATCH** (≥ 0.45), or **WEAK**. | Must | `Exchange.jsx:9-14`, `:60-77` |
| **FR-026** | When no procedure matches, the system shall display an amber advisory instructing the operator not to improvise and to escalate per site policy, and shall **not** display any answer body. | Must | `Exchange.jsx:46-51` |
| **FR-027** | When the backend is unreachable, the system shall display a fault banner naming the expected service and port rather than failing silently. | Must | `Exchange.jsx:30-37` |

> **Note on FR-026:** Suppressing the answer body on a refusal is deliberate. A refusal message rendered in the same visual position as a procedure invites an operator to skim it as guidance. The amber banner replaces the procedure rather than accompanying it.

### 4.4 Retrieval and Grounding

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-030** | The system shall index SOP documents by splitting each file into one chunk per procedure, delimited by `SOP-<digits>-<letter> :` headers, keeping each procedure whole. | Must | `rag.py:48-83` |
| **FR-031** | A file containing no procedure headers shall be indexed whole as a fallback rather than skipped. | Must | `rag.py:79-81` |
| **FR-032** | Chunks shall be embedded using a locally hosted embedding model and persisted to an on-disk vector store, built once and reused on subsequent starts. | Must | `rag.py:96-109` |
| **FR-033** | Each query shall retrieve the top *k* most similar chunks, where *k* is configurable (currently 2). | Must | `config.py`, `rag.py:113` |
| **FR-034** | The system prompt shall require that **both** the equipment and the condition in the question match the retrieved procedure before an answer is given. | Must | `rag.py:27-35` |
| **FR-035** | The system shall be prohibited from adapting, borrowing, or generalising a procedure written for a different condition or different equipment. | Must | `rag.py:33-35` |
| **FR-036** | When a procedure matches, the system shall reproduce **all** steps in order and reproduce tag names, thresholds, and valve numbers exactly as written, adding no rationale or commentary. | Must | `rag.py:36-38` |
| **FR-037** | When no procedure matches, the system shall respond with the exact string `I do not have a procedure for that.` and nothing further. | Must | `rag.py:39-41` |
| **FR-038** | The client shall classify a response as unmatched by detecting the refusal sentinel, and shall drive the FR-026 presentation from that classification. | Must | `api.js:12`, `:30` |
| **FR-039** | Each response shall include the retrieved source filenames and their similarity scores for audit and operator inspection. | Must | `rag.py:131-137` |

> **Note:** FR-034 through FR-037 are the system's core safety property. The failure mode they guard against is the model answering a question about *low* OTSG pressure using the *high* pressure procedure — a plausible-looking answer with the wrong valve numbers. §4.8 exists to verify this behaviour continues to hold as models and parameters change.

### 4.5 Model Selection

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-040** | The system shall expose the set of selectable models and the default model over an HTTP endpoint. | Must | `app.py:33-35` |
| **FR-041** | An operator shall be able to select which model answers their query, from a picker in the query composer. | Must | `ModelSelect.jsx`, `QueryBar.jsx:35-39` |
| **FR-042** | The selected model shall be transmitted with the query and used for that query's inference. | Must | `api.js:21`, `app.py:39`, `rag.py:126-128` |
| **FR-043** | The service shall reject any requested model not present in the configured allow-list. | Must | `rag.py:119-120` |
| **FR-044** | A query engine shall be constructed once per model and cached, so that switching models does not rebuild or re-embed the index. | Must | `rag.py:117-123` |
| **FR-045** | Each cached engine shall be bound to its own model instance at construction, such that building an engine for one model cannot alter the behaviour of an already-cached engine for another. | Must | `rag.py:112` |
| **FR-046** | If the models endpoint is unavailable, the client shall fall back to a single known default model rather than rendering an empty picker. | Should | `api.js:40-42` |
| **FR-047** | The picker may display non-selectable placeholder entries for models not yet served. Such placeholders shall be visually distinguished and shall not be added to the backend allow-list. | Could | `ModelSelect.jsx` |

> **Note on FR-045:** LlamaIndex resolves the LLM from a global `Settings` object unless one is passed explicitly. Without explicit binding, building a second engine silently repoints the first, and both models return identical answers while the UI reports otherwise.

### 4.6 Pipeline Transparency

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-050** | While a query is in flight, the system shall display the stage of the retrieval pipeline currently executing. | Should | `usePipelineStage.js`, `PipelineStatus.jsx` |
| **FR-051** | Pre-inference stages shall advance on timers; the inference stage shall hold until the response actually arrives. | Should | `usePipelineStage.js:20-24` |
| **FR-052** | On completion the pipeline shall indicate success for a settling period before resetting. | Should | `usePipelineStage.js:27-40` |
| **FR-053** | An operator shall be able to open a detailed pipeline view explaining each stage for the current or most recent exchange. | Could | `PipelineDetail.jsx`, `AiPanel.jsx` |
| **FR-054** | The dock readout and the detail view shall render from a single shared stage clock so they cannot disagree. | Must | `usePipelineStage.js:3-4` |

### 4.7 Audit Logging

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-060** | The system shall append one record to a persistent audit log for every query handled. | Must | `app.py:40`, `audit.py:14-26` |
| **FR-061** | Each record shall contain a UTC ISO-8601 timestamp, the question, the answer, the retrieved sources with scores, and the model that produced the answer. | Must | `audit.py:16-22` |
| **FR-062** | Records shall be written as newline-delimited JSON, one object per line, append-only. | Must | `audit.py:24-25` |
| **FR-063** | A failure to write an audit record shall be logged to the console and shall **not** fail the operator's query. | Must | `audit.py:26-27` |

> **Note on FR-063:** This is a deliberate availability-over-auditability trade-off: an operator facing a live alarm should still get their procedure if the log file is unwritable. If this system were ever to carry a formal audit obligation, this requirement would need to be revisited — a silently dropped record is indistinguishable from a query that never happened.

### 4.8 Evaluation and Verification

| ID | Requirement | Priority | Implementation |
|---|---|---|---|
| **FR-070** | The project shall provide an automated evaluation harness exercising the live service over HTTP. | Must | `eval.py` |
| **FR-071** | The harness shall cover **answer** cases, asserting that required keywords (valve numbers, tags, thresholds) all appear in the response. | Must | `eval.py:45-74`, `:126-130` |
| **FR-072** | The harness shall cover **refusal** cases, asserting both that a refusal phrase is present and that named forbidden keywords are absent. | Must | `eval.py:77-106`, `:132-139` |
| **FR-073** | The harness shall report pass/fail per case plus separate answer and refusal subtotals. | Must | `eval.py:167-170` |
| **FR-074** | The harness shall emit an explicit warning when any refusal case fails, since a false answer is a more serious defect than a missed one. | Must | `eval.py:171-173` |
| **FR-075** | The harness shall accept a model argument so the same suite can be run against each selectable model. | Should | `eval.py` |
| **FR-076** | The current suite comprises 10 cases: 5 answer, 5 refusal. | — | `eval.py:43-107` |

### 4.9 Service Interface

| ID | Requirement | Priority | Endpoint |
|---|---|---|---|
| **FR-080** | `GET /health` shall return service liveness. | Must | `app.py:29-31` |
| **FR-081** | `GET /models` shall return `{models: [...], default: "..."}`. | Must | `app.py:33-35` |
| **FR-082** | `POST /query` shall accept `{question, model?}` and return `{answer, sources, model}`. | Must | `app.py:37-41` |
| **FR-083** | The default query engine shall be constructed at service startup so the first operator request is not delayed by index loading. | Must | `app.py:16-20` |
| **FR-084** | An invalid model in a request shall produce a `400` client error, not a `500`. | Should | **Not yet implemented** — see §8 |

---

## 5. Non-Functional Requirements

| ID | Requirement | Rationale |
|---|---|---|
| **NFR-001** | All inference shall run locally via Ollama; no query text shall leave the host machine. | SOP content and operator questions are site-confidential. |
| **NFR-002** | The LLM request timeout shall be configurable (currently 600 s). | Local inference on constrained hardware can be slow; a premature timeout loses a completed answer. |
| **NFR-003** | The model context window shall be explicitly bounded (currently 8192 tokens) rather than defaulting to the model's declared maximum. | Unbounded context allocation exceeded available memory on the target hardware and forced CPU execution, degrading response time severely. |
| **NFR-004** | All tunable parameters — models, allow-list, embedding model, timeout, context window, vector store path, top-*k*, response mode, audit path — shall reside in a single configuration module. | Single point of change; no parameter hunting across modules. |
| **NFR-005** | The vector index shall persist across restarts and re-embed only when empty. | Re-embedding on every start is a multi-second startup cost with no benefit. |
| **NFR-006** | All backend communication shall be encapsulated in a single client module; components shall not call `fetch` directly. | One place to change the contract. |
| **NFR-007** | The interface shall follow control-room visual convention: green = normal/retrieved, amber = warning/no match, red = fault. | Operator pattern-recognition transfers from existing HMI systems. |
| **NFR-008** | The system shall run on a single workstation with no external service dependencies beyond a local Ollama instance. | Deployability in an environment without reliable outbound connectivity. |

---

## 6. Data and Configuration

### 6.1 SOP Corpus

| File | Procedures |
|---|---|
| `SOP-032-OTSG-Procedures.txt` | Steam drum pressure very high; stack temperature very high; feedwater flow very low |
| `SOP-045-FWKO-Separator-Procedures.txt` | Level very high; level very low; pressure very high |
| `SOP-051-ESP-Wellhead-Procedures.txt` | ESP motor temperature very high; ESP intake pressure very low; injection wellhead temperature very low; production wellhead pressure very high |

**Total: 10 procedures across 3 documents.**

### 6.2 Configuration Parameters

| Parameter | Current value | Requirement |
|---|---|---|
| `LLM_MODEL` | `llama3.2:3b` | Default generation model |
| `AVAILABLE_MODELS` | `llama3.2:3b`, `qwen2.5:3b` | FR-043 allow-list |
| `EMBED_MODEL` | `nomic-embed-text` | FR-032 |
| `REQUEST_TIMEOUT` | 600.0 s | NFR-002 |
| `CONTEXT_WINDOW` | 8192 tokens | NFR-003 |
| `CHROMA_PATH` | `./chroma_db` | FR-032 |
| `COLLECTION_NAME` | `sops` | FR-032 |
| `SOPS_DIR` | `sops` | FR-030 |
| `SIMILARITY_TOP_K` | 2 | FR-033 |
| `RESPONSE_MODE` | `tree_summarize` | FR-033 |
| `AUDIT_LOG_PATH` | `audit_log.jsonl` | FR-060 |

---

## 7. Assumptions and Constraints

| ID | Statement |
|---|---|
| **A-01** | A local Ollama instance is running and reachable, with all models in `AVAILABLE_MODELS` and the embedding model already pulled. |
| **A-02** | SOP source files follow the `SOP-<digits>-<letter> : TITLE` header convention. Files that do not are indexed whole (FR-031) and will retrieve less precisely. |
| **A-03** | The deployment host has sufficient memory for the selected model at the configured context window. Exceeding it causes CPU spill-over and severe latency, not failure. |
| **A-04** | A single operator uses the system at a time. There is no session isolation between concurrent users. |
| **A-05** | The retrieved corpus is small enough that `SIMILARITY_TOP_K = 2` and an 8192-token window comfortably accommodate the largest procedures. Both must be revisited together if either changes. |
| **A-06** | Match-rating thresholds (0.55 / 0.45) are heuristic for `nomic-embed-text` cosine scores and are not valid for a different embedding model. |

---

## 8. Known Gaps

| Item | Requirement | Status |
|---|---|---|
| Invalid model returns 500 rather than 400 | FR-084 | `rag.get_query_engine` raises `ValueError`; `app.py` does not catch it. `HTTPException` is imported but unused. |
| Only the default model is pre-warmed at startup | FR-083 | Non-default models build their engine on first request, producing a one-off delay. |
| Refusal detection is phrase-matching | FR-072 | `eval.py` recognises six refusal phrasings. A model refusing in different words is scored as a failure, understating true refusal performance. |
| No authentication | §1.3 | Any client that can reach the port can query and write audit records. |

---

## 9. Traceability

| Area | Requirements | Verified by |
|---|---|---|
| Grounding and refusal | FR-034 – FR-039 | `eval.py` refusal cases (FR-072); manual review of `sources` in audit log |
| Answer completeness | FR-036 | `eval.py` answer cases (FR-071) |
| Model selection | FR-040 – FR-046 | Audit log `model` field (FR-061); per-model eval runs (FR-075) |
| Audit completeness | FR-060 – FR-063 | Inspection of `audit_log.jsonl` |
| Alarm derivation | FR-010 – FR-015 | Manual HMI observation |
