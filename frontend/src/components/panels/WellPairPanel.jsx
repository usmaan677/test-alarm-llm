import TagReadout from '../TagReadout'

// Well pair mimic: injector on the left feeding steam down-hole, producer on
// the right lifting fluid via ESP. SDV state pills are static-open — there's
// no live valve feedback in this build, only the instrument tags below them.
export default function WellPairPanel({ tags, onAsk }) {
  const sor = tags['FIC-101'] && tags['FI-OIL'] ? (tags['FIC-101'] / tags['FI-OIL']).toFixed(1) : '—'

  return (
    <section className="hmi-panel">
      <header className="hmi-panel-header">
        <h2>WELL PAIR A1/A2</h2>
      </header>

      <div className="well-pair">
        <div className="well-col">
          <span className="well-col-title">INJECTOR A1</span>
          <TagReadout tagKey="TI-INJ-A1" value={tags['TI-INJ-A1']} onAsk={onAsk} />
          <TagReadout tagKey="PI-INJ-A1" value={tags['PI-INJ-A1']} onAsk={onAsk} />
          <span className="status-pill status-pill-ok well-sdv">SDV-101 OPEN</span>
        </div>
        <div className="well-col">
          <span className="well-col-title">PRODUCER A2</span>
          <TagReadout tagKey="TI-PRD-A2" value={tags['TI-PRD-A2']} onAsk={onAsk} />
          <TagReadout tagKey="PI-PRD-A2" value={tags['PI-PRD-A2']} onAsk={onAsk} />
          <TagReadout tagKey="PI-ESP-A2" value={tags['PI-ESP-A2']} onAsk={onAsk} />
          <TagReadout tagKey="TI-ESP-A2" value={tags['TI-ESP-A2']} onAsk={onAsk} />
          <span className="status-pill status-pill-ok well-sdv">SDV-201 OPEN</span>
        </div>
      </div>

      <div className="well-sor">
        <span className="tag-label">SOR</span>
        <span className="tag-value tag-value-normal">{sor}</span>
      </div>
    </section>
  )
}
