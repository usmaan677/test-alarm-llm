// Emergency shutdown status tile. ESD levels themselves aren't simulated
// (no trip logic beyond the alarm thresholds), but Fire & Gas reflects
// whether any critical alarm is currently active, so the tile isn't static.
export default function EsdStatus({ alarms }) {
  const critical = alarms.some((a) => a.severity === 'critical')

  return (
    <section className="hmi-panel">
      <header className="hmi-panel-header">
        <h2>ESD STATUS</h2>
      </header>
      <div className="esd-grid">
        <span className="status-pill status-pill-ok esd-tile">ESD Level 1: NORMAL</span>
        <span className="status-pill status-pill-ok esd-tile">ESD Level 2: NORMAL</span>
        <span className="status-pill status-pill-ok esd-tile">ESD Level 3: NORMAL</span>
        <span className={`status-pill esd-tile ${critical ? 'status-pill-warn' : 'status-pill-ok'}`}>
          Fire &amp; Gas: {critical ? 'ALERT' : 'NORMAL'}
        </span>
      </div>
    </section>
  )
}
