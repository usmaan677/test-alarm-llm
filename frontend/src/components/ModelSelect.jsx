// Compact LLM picker docked in the AI panel header. Options come from the
// backend (GET /models); until that endpoint exists the list falls back to
// the single default model, so the control renders either way.

// Shown but not selectable — placeholders for models we don't serve yet.
// Deliberately kept out of config.AVAILABLE_MODELS: that list is the backend's
// validation gate, so adding one there would let a request through to a model
// Ollama can't load.
const COMING_SOON = ['gemma3.5']

export default function ModelSelect({ models, model, onChange }) {
  return (
    <label className="model-select">
      <span className="model-select-label">LLM</span>
      <select value={model} onChange={(e) => onChange(e.target.value)} aria-label="AI model">
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        {COMING_SOON.map((m) => (
          <option key={m} value={m} disabled>
            {m} — soon
          </option>
        ))}
      </select>
    </label>
  )
}
