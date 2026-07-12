// One question/response pair in the session transcript. The question renders
// as an operator entry aligned right; the response resolves in place below it.
// Banner colors follow control-room convention: green = procedure retrieved,
// amber = no matching procedure, red = link fault.

// Buckets a raw similarity score into an operator-readable match rating.
// Thresholds are heuristic for nomic-embed-text cosine scores, where matching
// procedures land around 0.55+ and unrelated chunks fall below 0.45.
function matchRating(score) {
  if (score == null) return { label: 'N/A', tone: 'weak' }
  if (score >= 0.55) return { label: 'GOOD MATCH', tone: 'good' }
  if (score >= 0.45) return { label: 'SLIGHT MATCH', tone: 'slight' }
  return { label: 'WEAK', tone: 'weak' }
}

export default function Exchange({ exchange }) {
  const { question, status, result } = exchange

  return (
    <div className="exchange">
      <div className="exchange-question">
        <span className="exchange-role">OPR</span>
        {question}
      </div>

      {status === 'pending' && (
        <div className="exchange-response response-pending blink">RETRIEVING…</div>
      )}

      {status === 'error' && (
        <div className="exchange-response">
          <div className="response-banner banner-fault">
            <span className="led led-fault" aria-hidden="true" />
            BACKEND UNREACHABLE — CHECK THAT THE FASTAPI SERVICE IS RUNNING ON :8000
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="exchange-response">
          {result.matched ? (
            <div className="response-banner banner-ok">
              <span className="led led-ok" aria-hidden="true" />
              PROCEDURE RETRIEVED
            </div>
          ) : (
            <div className="response-banner banner-warn">
              <span className="led led-warn" aria-hidden="true" />
              NO MATCHING PROCEDURE — DO NOT IMPROVISE. ESCALATE PER SITE POLICY.
            </div>
          )}

          {result.matched && (
            <div className="response-body">
              <span className="panel-label">RESPONSE PROCEDURE</span>
              <pre className="response-answer">{result.answer}</pre>
            </div>
          )}

          {result.matched && result.sources.length > 0 && (
            <div className="source-block">
              <span className="source-label">SOURCES</span>
              <ul className="source-list">
                {result.sources.map((s, i) => {
                  const rating = matchRating(s.score)
                  return (
                    <li key={i}>
                      <span className="source-file">{s.file}</span>
                      <span className={`match-badge match-${rating.tone}`}>
                        {rating.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
