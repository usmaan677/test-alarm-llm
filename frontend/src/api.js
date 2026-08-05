/**
 * All backend communication lives here. Components import these functions
 * and never call fetch directly.
 *
 * Backend contract (see app.py):
 *   POST /query  {question, model?}  ->  {answer, sources: [{file, score}]}
 *   GET  /models                     ->  {models: [...], default}
 *   GET  /health                     ->  {status: "ok"}
 */

// The exact refusal the RAG system prompt requires when nothing matches.
const NO_MATCH_SENTINEL = 'i do not have a procedure'

// Mirrors LLM_MODEL in config.py — used only when GET /models is unavailable.
const FALLBACK_MODEL = 'llama3.2:3b'

export async function askQuestion(question, model) {
  const res = await fetch('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(model ? { question, model } : { question }),
  })
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`)
  }
  const data = await res.json()
  return {
    answer: data.answer,
    sources: data.sources ?? [],
    matched: !data.answer.toLowerCase().includes(NO_MATCH_SENTINEL),
  }
}

export async function fetchModels() {
  try {
    const res = await fetch('/models')
    if (!res.ok) throw new Error(`Backend returned ${res.status}`)
    const data = await res.json()
    return { models: data.models, defaultModel: data.default }
  } catch {
    return { models: [FALLBACK_MODEL], defaultModel: FALLBACK_MODEL }
  }
}

export async function checkHealth() {
  try {
    const res = await fetch('/health')
    return res.ok
  } catch {
    return false
  }
}
