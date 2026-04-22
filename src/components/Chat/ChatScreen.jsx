import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../services/chat'
import { getWeatherContext } from '../../services/weather'
import { getOwnerFromEmail } from '../../config/constants'
import { logError } from '../../services/devLogger'
import KokosEasterEgg from '../UI/KokosEasterEgg'
import WizardHint from '../UI/WizardHint'

const WIZARD_STATES = {
  idle:     { img: '/assets/wizard-idle.png',     text: 'Co mogę dla Ciebie zrobić?' },
  thinking: { img: '/assets/wizard-thinking.png', text: 'Sprawdzam szafę...' },
  speaking: { img: '/assets/wizard-speaking.png', text: 'Oto co mam dla Ciebie!' },
}

function getCurrentSeasonIcon() {
  const month = new Date().getMonth() + 1 // 1-12
  if (month >= 3 && month <= 5)  return '/assets/spring.png'
  if (month >= 6 && month <= 8)  return '/assets/Slonce.png'
  if (month >= 9 && month <= 11) return '/assets/season-autumn.png'
  return '/assets/snieg.png'
}

function getSuggestions(weatherData, clothes) {
  const rainChance = weatherData?.rain_chance ?? 0
  const hasClean = clothes?.some(c => c.status === 'czyste')
  const hasFavorites = clothes?.some(c => c.is_favorite)

  const base = [
    {
      text: 'Co założyć dziś?',
      icon: '/assets/Slonce.png',
      prompt: 'Co powinienem założyć na dziś biorąc pod uwagę pogodę?',
    },
    {
      text: 'Stylizacja do pracy',
      icon: '/assets/suit-tie.png',
      prompt: 'Zaproponuj mi stylizację do pracy z mojej szafy.',
    },
    {
      text: 'Na wyjście wieczorne',
      icon: '/assets/party-star.png',
      prompt: 'Co mogę założyć na wyjście wieczorne?',
    },
    {
      text: 'Coś casualowego',
      icon: '/assets/sneaker.png',
      prompt: 'Zaproponuj casualową stylizację na co dzień.',
    },
    {
      text: 'Co dawno nie zakładałem?',
      icon: '/assets/washing-machine-action.png',
      prompt: 'Pokaż mi ubrania których dawno nie zakładałem.',
    },
    {
      text: 'Coś na tę porę roku',
      icon: getCurrentSeasonIcon(),
      prompt: 'Co z mojej szafy pasuje na obecną porę roku?',
    },
  ]

  if (rainChance > 50) {
    base.splice(1, 0, {
      text: 'Co na deszczowy dzień?',
      icon: '/assets/cloud-rain-outfit.png',
      prompt: 'Pada deszcz — co założyć żeby nie zmoknąć?',
    })
  }

  if (hasFavorites) {
    base.push({
      text: 'Pokaż moje ulubione',
      icon: '/assets/heart-clothes.png',
      prompt: 'Pokaż mi moje ulubione ubrania i zaproponuj stylizację.',
    })
  }

  if (hasClean) {
    base.push({
      text: 'Co jest czyste?',
      icon: '/assets/checkmark-fresh.png',
      prompt: 'Które ubrania mam teraz czyste i gotowe do założenia?',
    })
  }

  return base.slice(0, 8)
}

function getWeatherIcon(condition) {
  if (!condition) return '/assets/weather-partly.png'
  const c = condition.toLowerCase()
  if (c.includes('deszcz') || c.includes('rain')) return '/assets/weather-rain.png'
  if (c.includes('śnieg') || c.includes('snow')) return '/assets/snieg.png'
  if (c.includes('chmur') || c.includes('cloud') || c.includes('pochmur')) return '/assets/weather-cloudy.png'
  if (c.includes('słon') || c.includes('sun') || c.includes('clear') || c.includes('pogod')) return '/assets/Slonce.png'
  if (c.includes('mgł') || c.includes('fog')) return '/assets/weather-fog.png'
  return '/assets/weather-partly.png'
}

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
      <div className="chat-message-content">
        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
          {msg.content}
          {msg.reasoning && (
            <div className="chat-reasoning">
              <img src="/assets/reasoning-bulb.png" className="pixel-icon" width="14" height="14" style={{marginRight: '4px'}} alt="" />
              {msg.reasoning}
            </div>
          )}
        </div>
        {recommendedItems.length > 0 && (
          <div className="chat-items-area">
            {msg.outfit_name && (
              <div className="chat-outfit-name">
                <img src="/assets/outfit-sparkle.png" className="pixel-icon" width="16" height="16" style={{marginRight: '4px'}} alt="" />
                {msg.outfit_name}
              </div>
            )}
            <div className="chat-items-row">
              {recommendedItems.map(item => (
                <ClothingChip key={item.id} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatScreen({ clothes, onItemClick, user }) {
  const ownerName = user ? (getOwnerFromEmail(user.email) ?? null) : null
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKokos, setShowKokos] = useState(false)
  const [weatherData, setWeatherData] = useState(undefined)
  const [wizardState, setWizardState] = useState('idle')
  const [wizardVisible, setWizardVisible] = useState(true)
  const weatherPromiseRef = useRef(null)
  const speakTimerRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    weatherPromiseRef.current = getWeatherContext().then(data => {
      setWeatherData(data)
      return data
    })
    return () => clearTimeout(speakTimerRef.current)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function transitionWizard(next) {
    setWizardVisible(false)
    setTimeout(() => {
      setWizardState(next)
      setWizardVisible(true)
    }, 150)
  }

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    const next = [...messages, userMsg].slice(-20)
    setMessages(next)
    setInput('')
    setLoading(true)
    transitionWizard('thinking')
    clearTimeout(speakTimerRef.current)

    const weather = weatherData === undefined
      ? await (weatherPromiseRef.current ?? Promise.resolve(null))
      : weatherData

    const start = Date.now()
    try {
      const reply = await sendChatMessage(trimmed, clothes, next, weather, ownerName)
      const assistantMsg = { role: 'assistant', content: reply.text, item_ids: reply.item_ids ?? [], outfit_name: reply.outfit_name ?? null, reasoning: reply.reasoning ?? null }
      setMessages(prev => [...prev, assistantMsg].slice(-20))
      transitionWizard('speaking')
      speakTimerRef.current = setTimeout(() => transitionWizard('idle'), 2000)
    } catch (err) {
      logError(err, 'chat_message')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Przepraszam, coś poszło nie tak. Spróbuj ponownie.', item_ids: [] }])
      transitionWizard('idle')
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

  function handleSuggestionClick(prompt) {
    send(prompt)
  }

  const suggestions = getSuggestions(weatherData, clothes)
  const wizard = WIZARD_STATES[wizardState]
  const weatherIcon = getWeatherIcon(weatherData?.condition)

  return (
    <div className="chat-screen">
      {messages.length === 0 ? (
        <div className="chat-wizard-area">
          <div className="chat-wizard-header">
            <img
              src={wizard.img}
              alt="Wizard"
              className="chat-wizard-avatar pixel-icon"
              style={{ opacity: wizardVisible ? 1 : 0, transition: 'opacity 0.15s' }}
            />
            <div className="chat-wizard-bubble">
              <span style={{ opacity: wizardVisible ? 1 : 0, transition: 'opacity 0.15s' }}>
                {wizard.text}
              </span>
            </div>

            {weatherData && (
              <div className="chat-weather-pill">
                <img src={weatherIcon} className="pixel-icon" width="16" height="16" alt="" style={{marginRight: '4px', verticalAlign: 'middle'}} />
                {weatherData.current_temp}°C · {weatherData.condition}
                {weatherData.rain_chance > 0 && ` · deszcz ${weatherData.rain_chance}%`}
              </div>
            )}
            {weatherData === undefined && (
              <div className="chat-weather-pill chat-weather-loading">📍 Pobieram pogodę...</div>
            )}
          </div>

          <div className="chat-suggestions-grid" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-28px', right: '4px' }}>
              <WizardHint hintKey="chat-suggestions" />
            </div>
            {suggestions.map((s, i) => (
              <button key={i} className="chat-suggestion-card" onClick={() => handleSuggestionClick(s.prompt)}>
                <img
                  src={s.icon}
                  className="pixel-icon"
                  width="32"
                  height="32"
                  style={{ borderRadius: '6px', flexShrink: 0 }}
                  alt=""
                />
                <span>{s.text}</span>
              </button>
            ))}
          </div>

          {messages.length === 0 && !input && (
            <button
              className="kokos-trigger"
              onClick={() => setShowKokos(true)}
              title="Pst..."
            >
              <img
                src="/assets/kokos-easter.png"
                alt=""
                width="24"
                style={{ opacity: 0.3, imageRendering: 'pixelated' }}
              />
            </button>
          )}
        </div>
      ) : (
        <div className="chat-messages-area">
          <div className="chat-wizard-mini">
            <img
              src={wizard.img}
              alt=""
              className="pixel-icon chat-wizard-mini-img"
              style={{ opacity: wizardVisible ? 1 : 0, transition: 'opacity 0.15s' }}
            />
            <span className="chat-wizard-mini-text" style={{ opacity: wizardVisible ? 1 : 0, transition: 'opacity 0.15s' }}>
              {wizard.text}
            </span>
          </div>

          <div className="chat-messages">
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
        </div>
      )}

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
          className="chat-send-btn chat-send-btn-purple"
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

      <KokosEasterEgg visible={showKokos} onDismiss={() => setShowKokos(false)} />
    </div>
  )
}
