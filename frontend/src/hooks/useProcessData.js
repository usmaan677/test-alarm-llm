import { useEffect, useRef, useState } from 'react'

// Mock SAGD process data for the HMI overview screen. There is no live SCADA
// feed behind this project — the backend only serves SOP text — so every tag
// here is a simulated value that slowly random-walks around a center point.
// Tag names and trip thresholds are taken directly from the SOP documents in
// sops/ so that clicking an alarm asks the RAG backend a question it can
// actually answer with a real, matching procedure.

// Each tag: id shown on the mimic, starting value, the band it wanders in,
// and (optionally) the alarm it drives. `dir` is 'high' or 'low' — whether
// the trip fires when the value rises above `hiHi`/`hi` or falls below
// `loLo`/`lo`.
const TAG_DEFS = [
  // ---- OTSG H-101 ----
  { key: 'TIC-101', label: 'Steam Temp', unit: '°C', decimals: 1, start: 305.2, min: 260, max: 330, step: 0.6 },
  {
    key: 'PIC-101', label: 'Steam Press', unit: 'kPag', decimals: 0, start: 11520, min: 9200, max: 12200, step: 60,
    dir: 'high', hi: 11000, hiHi: 11500,
    alarmTag: 'PAHH-101', alarmName: 'Steam Pressure Very High', equipment: 'OTSG H-101',
    question: 'What is the response procedure for OTSG steam drum pressure very high, PAHH-101?',
  },
  { key: 'QI-101', label: 'Steam Quality', unit: '%', decimals: 1, start: 78.3, min: 60, max: 92, step: 0.4 },
  { key: 'FIC-101', label: 'Steam Rate', unit: 'm³/d', decimals: 0, start: 2450, min: 1800, max: 2900, step: 20 },
  {
    key: 'TAHH-101', label: 'Stack Temp', unit: '°C', decimals: 0, start: 340, min: 260, max: 430, step: 4,
    dir: 'high', hi: 370, hiHi: 400,
    alarmTag: 'TAHH-101', alarmName: 'Stack Temperature Very High', equipment: 'OTSG Stack',
    question: 'What is the response procedure for OTSG stack temperature very high, TAHH-101?',
  },

  // ---- Well Pair A1/A2 ----
  {
    key: 'TI-INJ-A1', label: 'Steam Temp', unit: '°C', decimals: 0, start: 285, min: 80, max: 320, step: 3,
    dir: 'low', lo: 130, loLo: 100,
    alarmTag: 'TALL-INJ', alarmName: 'Injection Wellhead Temperature Very Low', equipment: 'Injection Wellhead A1',
    question: 'What is the response procedure for injection wellhead temperature very low, TALL-INJ?',
  },
  { key: 'PI-INJ-A1', label: 'Steam Press', unit: 'kPag', decimals: 0, start: 9850, min: 7000, max: 10500, step: 50 },
  { key: 'TI-PRD-A2', label: 'Fluid Temp', unit: '°C', decimals: 0, start: 165, min: 100, max: 210, step: 2 },
  {
    key: 'PI-PRD-A2', label: 'Wellhead Press', unit: 'kPag', decimals: 0, start: 1420, min: 600, max: 3900, step: 40,
    dir: 'high', hi: 3200, hiHi: 3500,
    alarmTag: 'PAHH-PROD', alarmName: 'Production Wellhead Pressure Very High', equipment: 'Production Wellhead A2',
    question: 'What is the response procedure for production wellhead pressure very high, PAHH-PROD?',
  },
  {
    key: 'PI-ESP-A2', label: 'ESP Intake Press', unit: 'kPag', decimals: 0, start: 1350, min: 350, max: 2600, step: 30,
    dir: 'low', lo: 650, loLo: 500,
    alarmTag: 'PALL-ESP', alarmName: 'ESP Intake Pressure Very Low', equipment: 'ESP Motor A2',
    question: 'What is the response procedure for ESP intake pressure very low, PALL-ESP?',
  },
  {
    key: 'TI-ESP-A2', label: 'ESP Motor Temp', unit: '°C', decimals: 0, start: 215, min: 120, max: 250, step: 3,
    dir: 'high', hi: 200, hiHi: 220,
    alarmTag: 'TAHH-ESP', alarmName: 'ESP Motor Temperature Very High', equipment: 'ESP Motor A2',
    question: 'What is the response procedure for ESP motor temperature very high, TAHH-ESP?',
  },

  // ---- FWKO Separator V-201 ----
  {
    key: 'LIC-201', label: 'Level', unit: '%', decimals: 0, start: 78, min: 5, max: 95, step: 1.5,
    dir: 'high', hi: 75, hiHi: 85, lo: 20, loLo: 10,
    alarmTag: 'LAHH-201', alarmName: 'Level Very High', loAlarmTag: 'LALL-201', loAlarmName: 'Level Very Low',
    equipment: 'FWKO Separator V-201',
    question: 'What is the response procedure for FWKO separator level very high, LAHH-201?',
    loQuestion: 'What is the response procedure for FWKO separator level very low, LALL-201?',
  },
  {
    key: 'PIC-201', label: 'Pressure', unit: 'kPag', decimals: 0, start: 890, min: 300, max: 1400, step: 20,
    dir: 'high', hi: 1050, hiHi: 1200,
    alarmTag: 'PAHH-201', alarmName: 'Pressure Very High', equipment: 'FWKO Separator V-201',
    question: 'What is the response procedure for FWKO separator pressure very high, PAHH-201?',
  },
  { key: 'TI-201', label: 'Temp', unit: '°C', decimals: 0, start: 158, min: 100, max: 210, step: 2 },
  { key: 'FI-OIL', label: 'Oil Flow', unit: 'm³/d', decimals: 0, start: 845, min: 500, max: 1200, step: 15 },
  { key: 'FI-WTR', label: 'Water Flow', unit: 'm³/d', decimals: 0, start: 1920, min: 1200, max: 2600, step: 25 },
]

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function initTagState() {
  const state = {}
  for (const def of TAG_DEFS) {
    state[def.key] = { value: def.start, momentum: 0 }
  }
  return state
}

// One slow random-walk step: momentum itself drifts a little each tick and
// bleeds off at the edges, so tags wander instead of jittering in place.
function stepTag(def, tagState) {
  const noise = (Math.random() - 0.5) * def.step
  let momentum = tagState.momentum * 0.85 + noise
  momentum = clamp(momentum, -def.step * 2, def.step * 2)
  let value = tagState.value + momentum
  if (value <= def.min || value >= def.max) momentum = -momentum
  value = clamp(value, def.min, def.max)
  return { value, momentum }
}

function round(value, decimals) {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

// Derive the active-alarm list for the banner from current tag values.
function deriveAlarms(tagValues) {
  const alarms = []
  for (const def of TAG_DEFS) {
    const value = tagValues[def.key]
    if (def.dir === 'high' || def.dir === undefined) {
      if (def.hiHi != null && value >= def.hiHi) {
        alarms.push({
          id: def.alarmTag, tag: def.alarmTag, severity: 'critical', direction: 'high',
          message: `${def.alarmName}`, equipment: def.equipment, value, unit: def.unit, decimals: def.decimals,
          question: def.question,
        })
      } else if (def.hi != null && value >= def.hi) {
        alarms.push({
          id: `${def.key}-hi`, tag: def.key, severity: 'warning', direction: 'high',
          message: `${def.label} High`, equipment: def.equipment, value, unit: def.unit, decimals: def.decimals,
          question: def.question,
        })
      }
    }
    if (def.dir === 'low' || (def.dir === 'high' && def.lo != null)) {
      if (def.loLo != null && value <= def.loLo) {
        alarms.push({
          id: def.loAlarmTag || def.alarmTag, tag: def.loAlarmTag || def.alarmTag, severity: 'critical', direction: 'low',
          message: `${def.loAlarmName || def.alarmName}`, equipment: def.equipment, value, unit: def.unit, decimals: def.decimals,
          question: def.loQuestion || def.question,
        })
      } else if (def.lo != null && value <= def.lo) {
        alarms.push({
          id: `${def.key}-lo`, tag: def.key, severity: 'warning', direction: 'low',
          message: `${def.label} Low`, equipment: def.equipment, value, unit: def.unit, decimals: def.decimals,
          question: def.loQuestion || def.question,
        })
      }
    }
  }
  return alarms
}

const TAG_DEF_BY_KEY = Object.fromEntries(TAG_DEFS.map((d) => [d.key, d]))

// Status of a single tag's current value: 'critical' | 'warning' | 'normal',
// plus which bound was crossed ('high' | 'low' | null). Used by the mimic
// panels to color a readout the same way the alarm banner colors its entry.
function getTagStatus(key, value) {
  const def = TAG_DEF_BY_KEY[key]
  if (!def || value == null) return { level: 'normal', bound: null }
  if (def.hiHi != null && value >= def.hiHi) return { level: 'critical', bound: 'high' }
  if (def.loLo != null && value <= def.loLo) return { level: 'critical', bound: 'low' }
  if (def.hi != null && value >= def.hi) return { level: 'warning', bound: 'high' }
  if (def.lo != null && value <= def.lo) return { level: 'warning', bound: 'low' }
  return { level: 'normal', bound: null }
}

const TICK_MS = 2200

// Slowly drifting mock SAGD process values + derived alarm banner. Values
// live in refs and only reach React state on tick, so the render cadence is
// controlled and predictable for a control-room-style display.
export default function useProcessData() {
  const [tags, setTags] = useState(() => {
    const raw = initTagState()
    const values = {}
    for (const key in raw) values[key] = round(raw[key].value, TAG_DEFS.find((d) => d.key === key).decimals)
    return values
  })
  const stateRef = useRef(initTagState())

  useEffect(() => {
    const timer = setInterval(() => {
      const next = {}
      const values = {}
      for (const def of TAG_DEFS) {
        const stepped = stepTag(def, stateRef.current[def.key])
        next[def.key] = stepped
        values[def.key] = round(stepped.value, def.decimals)
      }
      stateRef.current = next
      setTags(values)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const alarms = deriveAlarms(tags)

  return { tags, alarms, tagDefs: TAG_DEFS }
}

export { TAG_DEFS, TAG_DEF_BY_KEY, getTagStatus }
