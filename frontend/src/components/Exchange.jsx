// One question/response pair in the session transcript. The question renders
// as an operator entry aligned right; the response resolves in place below it.
// Banner colors follow control-room convention: green = procedure retrieved,
// amber = no matching procedure, red = link fault.
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

          {result.matched && <pre className="response-answer">{result.answer}</pre>}

          {result.sources.length > 0 && (
            <div className="source-block">
              <span className="panel-label">RETRIEVAL PROVENANCE</span>
              <table className="source-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SOURCE FILE</th>
                    <th>RELEVANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sources.map((s, i) => (
                    <tr key={i}>
                      <td>{String(i + 1).padStart(2, '0')}</td>
                      <td>{s.file}</td>
                      <td>{s.score != null ? s.score.toFixed(4) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
