import { Fragment } from 'react'

// Compact pipeline readout for the AI panel dock. Stage state comes from the
// shared usePipelineStage hook (owned by AiPanel) so this stays in sync with
// the detail modal. The whole readout is a button — clicking it opens the
// full animated process view.

const ICON = { width: 22, height: 22, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }

const QueryIcon = () => (
  <svg {...ICON}><path d="M2 4l4 4-4 4" /><path d="M8 13h6" /></svg>
)
const SearchIcon = () => (
  <svg {...ICON}><ellipse cx="8" cy="3.5" rx="5.5" ry="2" /><path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9" /><path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" /></svg>
)
const ChunksIcon = () => (
  <svg {...ICON}><rect x="2.5" y="2.5" width="8" height="10" /><path d="M13.5 5.5v8h-7" /><path d="M4.5 5.5h4M4.5 8h4" /></svg>
)
const ModelIcon = () => (
  <svg {...ICON}><rect x="4.5" y="4.5" width="7" height="7" /><path d="M6.5 4.5v-2M9.5 4.5v-2M6.5 13.5v-2M9.5 13.5v-2M4.5 6.5h-2M4.5 9.5h-2M13.5 6.5h-2M13.5 9.5h-2" /></svg>
)
const ResponseIcon = () => (
  <svg {...ICON}><rect x="2" y="3" width="12" height="8.5" /><path d="M5.5 14h5" /><path d="M5 7.5l2 2 3.5-3.5" /></svg>
)

const STAGES = [
  { key: 'query',    label: 'QUERY',     Icon: QueryIcon,    caption: 'DISPATCHING OPERATOR QUERY' },
  { key: 'search',   label: 'DB SEARCH', Icon: SearchIcon,   caption: 'EMBEDDING QUERY + SEARCHING VECTOR DB' },
  { key: 'chunks',   label: 'TOP-K',     Icon: ChunksIcon,   caption: 'RETRIEVING TOP-K PROCEDURE CHUNKS' },
  { key: 'model',    label: 'LLM',       Icon: ModelIcon,    caption: 'LLM SYNTHESIZING FROM RETRIEVED CONTEXT' },
  { key: 'response', label: 'RESPONSE',  Icon: ResponseIcon, caption: 'RESPONSE DELIVERED' },
]

export default function PipelineStatus({ busy, stage, settled, onOpenDetail }) {
  const idle = !busy && !settled

  return (
    <button
      type="button"
      className="pipeline-button"
      onClick={onOpenDetail}
      title="Open detailed pipeline view"
    >
      {idle ? (
        <p className="dock-status">
          READY
          <span className="pipeline-hint">· CLICK FOR PIPELINE DETAIL ⤢</span>
        </p>
      ) : (
        <div className="pipeline" role="status" aria-label="Query pipeline status">
          <div className="pipeline-row">
            {STAGES.map(({ key, label, Icon }, i) => {
              const state = settled
                ? 'done'
                : i < stage ? 'done' : i === stage ? 'active' : 'idle'
              return (
                <Fragment key={key}>
                  {i > 0 && (
                    <span className={`pipe-link ${!settled && i === stage ? 'flowing' : i <= stage ? 'passed' : ''}`} />
                  )}
                  <span className={`pipe-node pipe-${state}`}>
                    <Icon />
                    <span className="pipe-label">{label}</span>
                  </span>
                </Fragment>
              )
            })}
          </div>
          <p className={`pipe-caption ${settled ? 'pipe-caption-done' : ''}`}>
            {STAGES[stage].caption} <span className="pipeline-hint">⤢</span>
          </p>
        </div>
      )}
    </button>
  )
}
