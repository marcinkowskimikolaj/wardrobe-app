import { useState, useEffect } from 'react'

export default function KokosEasterEgg({ visible, onDismiss }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setTimeout(() => setShow(true), 100)
    } else {
      setShow(false)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`kokos-overlay${show ? ' kokos-visible' : ''}`}
      onClick={onDismiss}
    >
      <img
        src="/assets/kokos-easter.png"
        alt="Kokos"
        className="kokos-img"
      />
      <p className="kokos-label">
        To Kokos. Mój pies.<br />
        Dotknij żeby wrócić.
      </p>
    </div>
  )
}
