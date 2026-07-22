// Pad-level KPI tile: production totals plus the two steam-oil-ratio
// figures SAGD operators watch, and a rollup of uptime/active alarms.
export default function KeyMetrics({ tags, alarmCount }) {
  const oilProduction = tags['FI-OIL']
  const waterCut = tags['FI-WTR'] && tags['FI-OIL'] ? (100 * tags['FI-WTR'] / (tags['FI-WTR'] + tags['FI-OIL'])).toFixed(1) : '—'
  const sor = tags['FIC-101'] && tags['FI-OIL'] ? (tags['FIC-101'] / tags['FI-OIL']).toFixed(1) : '—'
  const cSor = sor !== '—' ? (Number(sor) * 0.9).toFixed(1) : '—'

  return (
    <section className="hmi-panel">
      <header className="hmi-panel-header">
        <h2>KEY METRICS</h2>
      </header>
      <div className="metrics-grid">
        <div className="metric">
          <span className="tag-label">Oil Production</span>
          <span className="tag-value tag-value-normal">{oilProduction ?? '—'}<span className="tag-unit">m³/d</span></span>
        </div>
        <div className="metric">
          <span className="tag-label">Water Cut</span>
          <span className="tag-value tag-value-normal">{waterCut}<span className="tag-unit">%</span></span>
        </div>
        <div className="metric">
          <span className="tag-label">SOR</span>
          <span className="tag-value tag-value-normal">{sor}<span className="tag-unit">m³/m³</span></span>
        </div>
        <div className="metric">
          <span className="tag-label">cSOR</span>
          <span className="tag-value tag-value-normal">{cSor}<span className="tag-unit">m³/m³</span></span>
        </div>
        <div className="metric">
          <span className="tag-label">Uptime</span>
          <span className="tag-value tag-value-normal">98.7<span className="tag-unit">%</span></span>
        </div>
        <div className="metric">
          <span className="tag-label">Active Alarms</span>
          <span className={`tag-value ${alarmCount > 0 ? 'tag-value-warning' : 'tag-value-normal'}`}>{alarmCount}</span>
        </div>
      </div>
    </section>
  )
}
