import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../services/chat'

const SUGGESTIONS = [
  'Co założyć na weekend?',
  'Co pasuje do czarnych spodni?',
  'Pokaż coś na jesień',
  'Co dawno nie zakładałem?',
  'Zaproponuj stylizację do pracy'
]

function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble-assistant chat-typing">
      <span /><span /><span />
    </div>
  )
}

function ClothingChip({ item, onClick }) {
  return (
    <div className="chat-item-chip" onClick={() => onClick(item)}>
      {item.photo_url
        ? <img src={item.photo_url} alt={item.category ?? ''} className="chat-item-chip-photo" />
        : <div className="chat-item-chip-placeholder">🧥</div>}
      <span className="chat-item-chip-label">{item.category ?? 'Ubranie'}</span>
    </div>
  )
}

function Message({ msg, clothes, onItemClick }) {
  const isUser = msg.role === 'user'
  const recommendedItems = (msg.item_ids ?? [])
    .map(id => clothes.find(c => c.id === id))
    .filter(Boolean)

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {msg.content}
      </div>
      {recommendedItems.length > 0 && (
        <div className="chat-items-row">
          {recommendedItems.map(item => (
            <ClothingChip key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChatScreen({ clothes, onItemClick }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    const next = [...messages, userMsg].slice(-20)
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendChatMessage(trimmed, clothes, next)
      const assistantMsg = { role: 'assistant', content: reply.text, item_ids: reply.item_ids ?? [] }
      setMessages(prev => [...prev, assistantMsg].slice(-20))
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Przepraszam, coś poszło nie tak. Spróbuj ponownie.', item_ids: [] }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <h1 className="chat-title">Asystent szafy <span className="chat-title-icon">✨</span></h1>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            <p className="chat-suggestions-label">Zacznij od pytania:</p>
            {SUGGESTIONS.map(s => (
              <button key={s} className="chat-suggestion-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} clothes={clothes} onItemClick={onItemClick} />
        ))}

        {loading && (
          <div className="chat-message chat-message-assistant">
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Napisz pytanie..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          aria-label="Wyślij"
        >
          {loading ? (
            <span className="chat-send-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
