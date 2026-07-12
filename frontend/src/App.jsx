import { useEffect, useRef, useState } from 'react'
import StatusBar from './components/StatusBar'
import QueryBar from './components/QueryBar'
import Exchange from './components/Exchange'
import { askQuestion } from './api'

// Session transcript: each submitted question becomes an exchange that starts
// as 'pending' and resolves in place to 'done' or 'error'. The list only
// grows for the life of the session, like a chat log.
export default function App() {
  const [exchanges, setExchanges] = useState([])
  const nextId = useRef(1)
  const chatEndRef = useRef(null)

  const busy = exchanges.some((e) => e.status === 'pending')

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges])

  async function handleSubmit(question) {
    const id = nextId.current++
    setExchanges((prev) => [...prev, { id, question, status: 'pending', result: null }])
    let update
    try {
      const result = await askQuestion(question)
      update = { status: 'done', result }
    } catch {
      update = { status: 'error' }
    }
    setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, ...update } : e)))
  }

  return (
    <div className="console">
      <StatusBar />

      <main className="chat">
        {exchanges.length === 0 ? (
          <p className="chat-empty">ENTER AN ALARM CONDITION BELOW</p>
        ) : (
          exchanges.map((e) => <Exchange key={e.id} exchange={e} />)
        )}
        <div ref={chatEndRef} />
      </main>

      <div className="dock">
        <p className={`dock-status ${busy ? 'blink' : ''}`}>
          {busy ? 'RETRIEVING PROCEDURE…' : 'READY'}
        </p>
        <QueryBar onSubmit={handleSubmit} busy={busy} />
        <div className="dock-footer">
          <span>SOP-032 · ALARM RESPONSE PROCEDURES</span>
          <span>RETRIEVAL: CHROMA / TOP-K 4</span>
        </div>
      </div>
    </div>
  )
}
