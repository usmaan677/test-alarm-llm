import { useEffect, useRef, useState } from 'react'

// Shared stage clock for the RAG pipeline animations. The dock readout and
// the detail modal both render from this one state so they stay in sync.
// The backend doesn't stream progress — one POST covers the whole pipeline —
// so the early stages advance on short timers and the LLM stage holds until
// the response actually lands (that's where the real time goes).

export const STAGE_MS = [800, 1300, 1300]
export const MODEL_STAGE = 3
export const RESPONSE_STAGE = 4
export const SETTLE_MS = 2200

export default function usePipelineStage(busy) {
  const [stage, setStage] = useState(0)
  const [settled, setSettled] = useState(false)
  const wasBusy = useRef(false)

  // Advance through the pre-model stages on timers while busy.
  useEffect(() => {
    if (!busy || stage >= MODEL_STAGE) return
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_MS[stage])
    return () => clearTimeout(t)
  }, [busy, stage])

  // On completion, light the whole pipeline green briefly, then reset.
  useEffect(() => {
    if (busy) {
      wasBusy.current = true
      setStage(0)
      setSettled(false)
      return
    }
    if (!wasBusy.current) return
    wasBusy.current = false
    setStage(RESPONSE_STAGE)
    setSettled(true)
    const t = setTimeout(() => setSettled(false), SETTLE_MS)
    return () => clearTimeout(t)
  }, [busy])

  return { stage, settled }
}
