import { useState, useRef } from 'react'
import { CATEGORIES, STATUSES, SEASONS } from '../../config/constants'

const STATUS_OPTIONS = [
  { value: STATUSES.CLEAN,   label: 'Czyste' },
  { value: STATUSES.USED,    label: 'Używane' },
  { value: STATUSES.WASHING, label: 'W praniu' },
]

const SEASON_OPTIONS = SEASONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))

export default function FilterSheet({ activeFilters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...activeFilters })
  const [exiting, setExiting] = useState(false)
  const startY = useRef(null)
  const [dragY, setDragY] = useState(0)

  function close() {
    setExiting(true)
    setTimeout(onClose, 240)
  }

  function toggle(key, value) {
    setLocal(prev => {
      const arr = prev[key] ?? []
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  function isActive(key, value) { return (local[key] ?? []).includes(value) }
  function handleApply() { onApply(local); close() }
  function handleReset() { setLocal({ categories: [], statuses: [], seasons: [] }) }

  function handleTouchStart(e) { startY.current = e.touches[0].clientY }
  function handleTouchMove(e) {
    if (startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) { e.preventDefault(); setDragY(dy) }
  }
  function handleTouchEnd() {
    if (dragY > 80) close()
    setDragY(0)
    startY.current = null
  }

  const sheetStyle = dragY > 0
    ? { transform: `translateX(-50%) translateY(${dragY}px)`, transition: 'none', animation: 'none' }
    : undefined

  return (
    <>
      <div className={`sheet-backdrop${exiting ? ' exiting' : ''}`} onClick={close} />
      <div
        className={`filter-sheet${exiting ? ' exiting' : ''}`}
        style={sheetStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-handle" />

        <div className="sheet-header">
          <span className="sheet-title">Filtruj</span>
          <button className="sheet-reset" onClick={handleReset}>Resetuj</button>
        </div>

        <div className="sheet-section">
          <p className="sheet-section-label">Kategoria</p>
          <div className="sheet-chips">
            {CATEGORIES.slice(0, 10).map(cat => (
              <button key={cat} className={`sheet-chip ${isActive('categories', cat) ? 'active' : ''}`}
                onClick={() => toggle('categories', cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-section">
          <p className="sheet-section-label">Status</p>
          <div className="sheet-chips">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} className={`sheet-chip ${isActive('statuses', s.value) ? 'active' : ''}`}
                onClick={() => toggle('statuses', s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-section">
          <p className="sheet-section-label">Sezon</p>
          <div className="sheet-chips">
            {SEASON_OPTIONS.map(s => (
              <button key={s.value} className={`sheet-chip ${isActive('seasons', s.value) ? 'active' : ''}`}
                onClick={() => toggle('seasons', s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary sheet-apply" onClick={handleApply}>
          Pokaż wyniki
        </button>
      </div>
    </>
  )
}
