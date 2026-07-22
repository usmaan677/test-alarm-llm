// Section nav for the HMI shell. Only OVERVIEW has a screen behind it in
// this build; the rest are shown for visual completeness (real DeltaV/SCADA
// consoles always show the full section list) but are inert.
const TABS = ['OVERVIEW', 'OTSG', 'WELLS', 'SEPARATION', 'WATER TREATMENT', 'TRENDS', 'ALARMS', 'SHUTDOWN']

export default function NavTabs({ pad = 'PAD A' }) {
  return (
    <nav className="nav-tabs">
      <div className="nav-tabs-list">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`nav-tab ${i === 0 ? 'nav-tab-active' : ''}`}
            disabled={i !== 0}
            title={i === 0 ? undefined : 'Not wired up in this build'}
          >
            {tab}
          </button>
        ))}
      </div>
      <span className="nav-tabs-pad">{pad}</span>
    </nav>
  )
}
