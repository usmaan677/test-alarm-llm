import { useEffect, useState } from 'react'
import { checkHealth } from '../api'

const HEALTH_POLL_MS = 15000

// Top bar: console identity on the left, backend link status and a live
// UTC clock on the right — the things an operator glances at first.
export default function StatusBar() {
  const [online, setOnline] = useState(null) // null = not checked yet
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const ok = await checkHealth()
      if (!cancelled) setOnline(ok)
    }
    poll()
    const healthTimer = setInterval(poll, HEALTH_POLL_MS)
    const clockTimer = setInterval(() => setNow(new Date()), 1000)
    return () => {
      cancelled = true
      clearInterval(healthTimer)
      clearInterval(clockTimer)
    }
  }, [])

  const linkState = online === null ? 'wait' : online ? 'ok' : 'fault'
  const linkLabel = online === null ? 'LINK …' : online ? 'LINK ONLINE' : 'LINK DOWN'

  return (
    <header className="status-bar">
      <div className="status-bar-id">
        <span className="status-bar-mark">IBEX</span>
        <span className="status-bar-title">ALARM ASSIST — PROCEDURE CONSOLE</span>
      </div>
      <div className="status-bar-right">
        <span className={`led led-${linkState}`} aria-hidden="true" />
        <span className="status-bar-link">{linkLabel}</span>
        <span className="status-bar-clock">
          {now.toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </header>
  )
}
