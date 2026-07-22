import { TAG_DEF_BY_KEY, getTagStatus } from '../hooks/useProcessData'

// One instrument readout: tag label, live value, and — if it has crossed a
// threshold — a status pill and click-to-ask, matching the "ABOVE HI-HI"
// callouts on a real DeltaV/SCADA faceplate.
export default function TagReadout({ tagKey, value, onAsk }) {
  const def = TAG_DEF_BY_KEY[tagKey]
  if (!def) return null
  const { level, bound } = getTagStatus(tagKey, value)
  const display = value == null ? '—' : value.toFixed(def.decimals)
  const clickable = level !== 'normal' && def.question && onAsk

  const pillText = level === 'critical'
    ? (bound === 'high' ? 'ABOVE HI-HI' : 'BELOW LO-LO')
    : level === 'warning'
      ? (bound === 'high' ? 'ABOVE HI' : 'BELOW LO')
      : null

  const body = (
    <>
      <span className="tag-label">{def.label}</span>
      <span className={`tag-value tag-value-${level}`}>
        {display}<span className="tag-unit">{def.unit}</span>
      </span>
      {pillText && <span className={`tag-pill tag-pill-${level}`}>{pillText}</span>}
    </>
  )

  if (clickable) {
    const question = bound === 'low' ? (def.loQuestion || def.question) : def.question
    return (
      <button type="button" className="tag-readout tag-readout-clickable" onClick={() => onAsk(question)} title="Click to ask the AI assistant">
        {body}
      </button>
    )
  }
  return <div className="tag-readout">{body}</div>
}
