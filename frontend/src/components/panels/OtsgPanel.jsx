import TagReadout from '../TagReadout'
import { getTagStatus } from '../../hooks/useProcessData'

// OTSG H-101 mimic: steam drum + firebox blocks, running status, and the
// core steam-generation readouts (temp, pressure, quality, rate, stack).
export default function OtsgPanel({ tags, onAsk }) {
  const pressureStatus = getTagStatus('PIC-101', tags['PIC-101'])
  const firing = pressureStatus.level !== 'critical'

  return (
    <section className="hmi-panel">
      <header className="hmi-panel-header">
        <h2>OTSG H-101</h2>
        <span className="status-pill status-pill-ok">RUNNING</span>
      </header>

      <div className="otsg-mimic">
        <div className="mimic-box mimic-drum">STEAM DRUM</div>
        <div className={`mimic-box mimic-firebox ${firing ? 'mimic-firebox-lit' : ''}`}>FIREBOX</div>
      </div>

      <div className="tag-grid">
        <TagReadout tagKey="TIC-101" value={tags['TIC-101']} onAsk={onAsk} />
        <TagReadout tagKey="PIC-101" value={tags['PIC-101']} onAsk={onAsk} />
        <TagReadout tagKey="QI-101" value={tags['QI-101']} onAsk={onAsk} />
        <TagReadout tagKey="FIC-101" value={tags['FIC-101']} onAsk={onAsk} />
        <TagReadout tagKey="TAHH-101" value={tags['TAHH-101']} onAsk={onAsk} />
      </div>
    </section>
  )
}
