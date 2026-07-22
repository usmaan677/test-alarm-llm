// 24hr production trend as a lightweight inline SVG line chart — no charting
// library needed for three fixed series. Data is a static illustrative
// 24-hour trace (there's no historian behind this build); only the "Now"
// point matters for the visual, so it isn't wired to the live tag drift.
const HOURS = ['00:00', '06:00', '12:00', '18:00', 'Now']

const SERIES = {
  steam: { color: 'var(--ok-cyan, #46c6d9)', points: [58, 55, 60, 66, 70, 68, 74, 80, 78, 84, 90, 94, 98] },
  oil: { color: 'var(--ok)', points: [30, 28, 26, 30, 34, 32, 36, 40, 42, 45, 48, 50, 54] },
  water: { color: 'var(--warn)', points: [18, 17, 19, 18, 20, 19, 21, 20, 22, 21, 23, 22, 24], dashed: true },
}

const W = 400
const H = 140
const PAD = 8

function toPath(points) {
  const max = 100
  const step = (W - PAD * 2) / (points.length - 1)
  return points
    .map((v, i) => {
      const x = PAD + i * step
      const y = H - PAD - (v / max) * (H - PAD * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function ProductionTrend() {
  return (
    <section className="hmi-panel trend-panel">
      <header className="hmi-panel-header">
        <h2>PRODUCTION TREND — 24 HR</h2>
      </header>

      <svg className="trend-chart" viewBox={`0 0 ${W} ${H + 18}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H - PAD - f * (H - PAD * 2)} y2={H - PAD - f * (H - PAD * 2)} className="trend-grid" />
        ))}
        <path d={toPath(SERIES.steam.points)} className="trend-line trend-line-steam" />
        <path d={toPath(SERIES.oil.points)} className="trend-line trend-line-oil" />
        <path d={toPath(SERIES.water.points)} className="trend-line trend-line-water" />
        {HOURS.map((label, i) => (
          <text key={label} x={PAD + (i * (W - PAD * 2)) / (HOURS.length - 1)} y={H + 14} className="trend-axis-label" textAnchor={i === 0 ? 'start' : i === HOURS.length - 1 ? 'end' : 'middle'}>
            {label}
          </text>
        ))}
      </svg>

      <div className="trend-legend">
        <span className="trend-legend-item"><span className="trend-swatch trend-swatch-steam" />Steam</span>
        <span className="trend-legend-item"><span className="trend-swatch trend-swatch-oil" />Oil</span>
        <span className="trend-legend-item"><span className="trend-swatch trend-swatch-water" />Water</span>
      </div>
    </section>
  )
}
