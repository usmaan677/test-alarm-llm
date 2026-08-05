import { useState } from 'react'
import ModelSelect from './ModelSelect'

// The model picker sits under the input, inside the same bordered box, so the
// choice reads as part of composing the query. QueryBar is also used inside
// PipelineDetail, which passes no models — the tools row is omitted there.
export default function QueryBar({ onSubmit, busy, models, model, onModelChange }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const question = text.trim()
    if (!question || busy) return
    onSubmit(question)
    setText('')
  }

  return (
    <form className="query-bar" onSubmit={handleSubmit}>
      <div className="query-bar-row">
        <span className="query-bar-prompt" aria-hidden="true">&gt;</span>
        <input
          id="query-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ALARM QUERY — e.g. OTSG high pressure, what is the response procedure?"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? 'QUERYING' : 'EXECUTE'}
        </button>
      </div>

      {models?.length > 0 && (
        <div className="query-bar-tools">
          <ModelSelect models={models} model={model} onChange={onModelChange} />
        </div>
      )}
    </form>
  )
}
