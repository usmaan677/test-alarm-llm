/**
 * All backend communication lives here. Components import these functions
 * and never call fetch directly.
 *
 * Backend contract (see app.py):
 *   POST /query  {question}  ->  {answer, sources: [{file, score}]}
 *   GET  /health             ->  {status: "ok"}
 */

// The exact refusal the RAG system prompt requires when nothing matches.
const NO_MATCH_SENTINEL = 'i do not have a procedure'

export async function askQuestion(question) {
  const res = await fetch('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
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

export async function checkHealth() {
  try {
    const res = await fetch('/health')
    return res.ok
  } catch {
    return false
  }
}
