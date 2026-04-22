import { useState, useEffect } from 'react'

const MESSAGES = [
  'Analizuję ubranie...',
  'Rozpoznaję materiał...',
  'Sprawdzam instrukcje prania...',
  'Generuję tagi stylu...',
  'Prawie gotowe...',
]

export default function AnalyzingStep() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setVisible(true)
      }, 200)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="analyzing-step">
      <img src="/assets/Rozdzka.png" className="pixel-icon" width="56" height="56"
        style={{ borderRadius: '12px', animation: 'pulse 1s ease-in-out infinite' }} />
      <p className={`analyzing-text ${visible ? 'analyzing-text-visible' : 'analyzing-text-hidden'}`}>
        {MESSAGES[msgIndex]}
      </p>
      <div className="analyzing-shimmer" />
      <p className="analyzing-hint">AI skanuje zdjęcie — chwilę...</p>
    </div>
  )
}
