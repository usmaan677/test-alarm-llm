import { useEffect, useRef, useState } from 'react'
import StatusBar from './components/StatusBar'
import AlarmBanner from './components/AlarmBanner'
import NavTabs from './components/NavTabs'
import AiPanel from './components/AiPanel'
import OtsgPanel from './components/panels/OtsgPanel'
import WellPairPanel from './components/panels/WellPairPanel'
import FwkoPanel from './components/panels/FwkoPanel'
import ProductionTrend from './components/panels/ProductionTrend'
import KeyMetrics from './components/panels/KeyMetrics'
import EsdStatus from './components/panels/EsdStatus'
import useProcessData from './hooks/useProcessData'
import { askQuestion, fetchModels } from './api'

// HMI overview screen: equipment mimics + trend/metrics/ESD tiles occupy the
// main area, with the AI assistant docked as a single column on the right
// (about a third of the screen) for operators to consult on demand. The
// session transcript that used to fill the whole page now lives inside that
// column only.
export default function App() {
  const [exchanges, setExchanges] = useState([])
  const [models, setModels] = useState([])
  const [model, setModel] = useState('')
  const nextId = useRef(1)
  const { tags, alarms } = useProcessData()

  const busy = exchanges.some((e) => e.status === 'pending')

  useEffect(() => {
    fetchModels().then(({ models, defaultModel }) => {
      setModels(models)
      setModel(defaultModel)
    })
  }, [])

  async function handleSubmit(question) {
    const id = nextId.current++
    setExchanges((prev) => [...prev, { id, question, status: 'pending', result: null }])
    let update
    try {
      const result = await askQuestion(question, model)
      update = { status: 'done', result }
    } catch {
      update = { status: 'error' }
    }
    setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, ...update } : e)))
  }

  return (
    <div className="hmi">
      <StatusBar />
      <AlarmBanner alarms={alarms} onAsk={handleSubmit} />
      <NavTabs />

      <div className="hmi-body">
        <div className="hmi-panels">
          <div className="hmi-row">
            <OtsgPanel tags={tags} onAsk={handleSubmit} />
            <WellPairPanel tags={tags} onAsk={handleSubmit} />
            <FwkoPanel tags={tags} onAsk={handleSubmit} />
          </div>
          <div className="hmi-row">
            <ProductionTrend />
            <KeyMetrics tags={tags} alarmCount={alarms.length} />
            <EsdStatus alarms={alarms} />
          </div>
        </div>

        <AiPanel
          exchanges={exchanges}
          busy={busy}
          onSubmit={handleSubmit}
          alarms={alarms}
          models={models}
          model={model}
          onModelChange={setModel}
        />
      </div>
    </div>
  )
}
