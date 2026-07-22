import TagReadout from '../TagReadout'
import { getTagStatus } from '../../hooks/useProcessData'

// FWKO Separator V-201 mimic: a single vessel splitting oil/water/gas, with
// level, pressure, temp, and the two outlet flow readouts.
export default function FwkoPanel({ tags, onAsk }) {
  const levelStatus = getTagStatus('LIC-201', tags['LIC-201'])
  const pressureStatus = getTagStatus('PIC-201', tags['PIC-201'])
  const alarmed = levelStatus.level !== 'normal' || pressureStatus.level !== 'normal'

  return (
    <section className="hmi-panel">
      <header className="hmi-panel-header">
        <h2>FWKO SEPARATOR V-201</h2>
        <span className={`status-pill ${alarmed ? 'status-pill-warn' : 'status-pill-ok'}`}>
          {alarmed ? 'ATTENTION' : 'NORMAL'}
        </span>
      </header>

      <div className="fwko-mimic">
        <div className="fwko-vessel">OIL / WATER / GAS</div>
      </div>

      <div className="tag-grid">
        <TagReadout tagKey="LIC-201" value={tags['LIC-201']} onAsk={onAsk} />
        <TagReadout tagKey="PIC-201" value={tags['PIC-201']} onAsk={onAsk} />
        <TagReadout tagKey="TI-201" value={tags['TI-201']} onAsk={onAsk} />
        <TagReadout tagKey="FI-OIL" value={tags['FI-OIL']} onAsk={onAsk} />
        <TagReadout tagKey="FI-WTR" value={tags['FI-WTR']} onAsk={onAsk} />
      </div>
    </section>
  )
}
