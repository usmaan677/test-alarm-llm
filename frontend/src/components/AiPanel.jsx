import { useEffect, useRef, useState } from 'react'
import Exchange from './Exchange'
import QueryBar from './QueryBar'
import PipelineStatus from './PipelineStatus'
import PipelineDetail from './PipelineDetail'
import usePipelineStage from '../hooks/usePipelineStage'

// The AI assistant lives here as a single dockable column rather than the
// full-screen console it used to be — the HMI mimics are the primary
// display now; this panel is the "if you need it" side channel.
export default function AiPanel({ exchanges, busy, onSubmit, alarms }) {
  const chatEndRef = useRef(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { stage, settled } = usePipelineStage(busy)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges])

  // The exchange the pipeline view narrates: the one in flight, else the latest.
  const currentExchange = exchanges.find((e) => e.status === 'pending') ?? exchanges[exchanges.length - 1]

  return (
    <aside className="ai-panel">
      <header className="ai-panel-header">
        <span className="ai-panel-icon" aria-hidden="true">◆</span>
        AI ASSISTANT
      </header>

      {alarms.length > 0 && (
        <div className="ai-quick-ask">
          <span className="panel-label">CLICK AN ALARM FOR AI ANALYSIS</span>
          <div className="ai-quick-ask-list">
            {alarms.map((a) => (
              <button key={a.id} type="button" className="ai-chip" disabled={busy} onClick={() => onSubmit(a.question)}>
                Why is {a.tag} in alarm?
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ai-transcript">
        {exchanges.length === 0 ? (
          <p className="chat-empty ai-transcript-empty">ASK ABOUT AN ALARM CONDITION</p>
        ) : (
          exchanges.map((e) => <Exchange key={e.id} exchange={e} />)
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="ai-dock">
        <PipelineStatus busy={busy} stage={stage} settled={settled} onOpenDetail={() => setDetailOpen(true)} />
        <QueryBar onSubmit={onSubmit} busy={busy} />
        <div className="dock-footer ai-dock-footer">
          <span>SOP-032 · ALARM RESPONSE</span>
          <span>TOP-K 2</span>
        </div>
      </div>

      <PipelineDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        busy={busy}
        stage={stage}
        settled={settled}
        exchange={currentExchange}
        onSubmit={onSubmit}
      />
    </aside>
  )
}
