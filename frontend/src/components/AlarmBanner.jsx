// Top alarm strip: a count badge plus the live list of active alarms. Each
// entry is clickable — it asks the AI panel the matching SOP question so an
// operator can go from "what's alarming" to "what do I do" in one click.
export default function AlarmBanner({ alarms, onAsk }) {
  const hasAlarms = alarms.length > 0

  return (
    <div className="alarm-banner">
      <span className={`alarm-count ${hasAlarms ? 'alarm-count-active' : ''}`}>
        ALARMS: {alarms.length}
      </span>
      <div className="alarm-list">
        {hasAlarms ? (
          alarms.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`alarm-item alarm-${a.severity}`}
              onClick={() => onAsk(a.question)}
              title="Click to ask the AI assistant"
            >
              <span className={`alarm-glyph alarm-glyph-${a.severity}`} aria-hidden="true" />
              {a.tag} {a.equipment} {a.message} {a.value.toFixed(a.decimals)}{a.unit}
            </button>
          ))
        ) : (
          <span className="alarm-item alarm-none">— NO ACTIVE ALARMS —</span>
        )}
      </div>
    </div>
  )
}
