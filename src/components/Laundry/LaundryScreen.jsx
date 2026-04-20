import { useState } from 'react'
import { updateClothing } from '../../services/supabase'
import { STATUSES, STATUS_COLORS } from '../../config/constants'
import { getDirtyClothes, groupByOwner, recommendLaundryLoads, daysSince } from '../../services/laundry'

function StatusActionBtn({ status, itemId, onUpdated }) {
  const [loading, setLoading] = useState(false)

  async function handleTap() {
    const next = status === STATUSES.USED ? STATUSES.WASHING : STATUSES.CLEAN
    const updates = next === STATUSES.CLEAN
      ? { status: next, last_washed: new Date().toISOString() }
      : { status: next }
    setLoading(true)
    try {
      await updateClothing(itemId, updates)
      onUpdated(itemId, updates)
    } finally {
      setLoading(false)
    }
  }

  if (status === STATUSES.CLEAN) return null
  return (
    <button className="laundry-action-btn" onClick={handleTap} disabled={loading}>
      {status === STATUSES.USED ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2a7 7 0 0 1 5 2"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  )
}

function ClothingRow({ item, onUpdated }) {
  const statusColor = STATUS_COLORS[item.status] ?? '#c7c7cc'
  const subtitle = [item.material, item.colors?.[0]].filter(Boolean).join(' · ')
  const days = daysSince(item.last_washed)

  return (
    <div className="laundry-item-row">
      <div className="laundry-thumb-wrap">
        {item.photo_url
          ? <img src={item.photo_url} alt={item.category} className="laundry-thumb" />
          : <div className="laundry-thumb-placeholder">🧥</div>}
      </div>
      <div className="laundry-item-info">
        <span className="laundry-item-category">{item.category ?? 'Ubranie'}</span>
        {subtitle && <span className="laundry-item-sub">{subtitle}</span>}
        {days !== null && <span className="laundry-item-washed">Prane {days === 0 ? 'dzisiaj' : `${days} dni temu`}</span>}
      </div>
      <span className="laundry-status-pill" style={{ '--pill': statusColor }}>
        {item.status}
      </span>
      <StatusActionBtn status={item.status} itemId={item.id} onUpdated={onUpdated} />
    </div>
  )
}

function LoadCard({ load, onMarkClean }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [exitingIds, setExitingIds] = useState([])

  async function handleMarkClean() {
    setLoading(true)
    // Staggered exit animation
    for (let i = 0; i < load.items.length; i++) {
      setTimeout(() => setExitingIds(prev => [...prev, load.items[i].id]), i * 80)
    }
    const delay = load.items.length * 80 + 200
    setTimeout(async () => {
      await onMarkClean(load.items)
      setDone(true)
      setLoading(false)
    }, delay)
  }

  if (done) {
    return (
      <div className="load-card">
        <div className="wash-success">
          <span className="wash-success-icon">✓</span>
          <span className="wash-success-text">Wyprane!</span>
        </div>
      </div>
    )
  }

  const tempLabel = load.temp ? `${load.temp}°C` : 'bez temp.'
  const modeLabel = load.mode ?? 'dowolny tryb'

  return (
    <div className="load-card">
      <div className="load-card-header">
        <span className="load-card-title">🌡️ {tempLabel} · {modeLabel}</span>
        <span className="load-card-count">{load.items.length} {load.items.length === 1 ? 'rzecz' : load.items.length < 5 ? 'rzeczy' : 'rzeczy'}</span>
      </div>
      <div className="load-thumbs">
        {load.items.slice(0, 6).map(item => (
          <div key={item.id} className={`load-thumb${exitingIds.includes(item.id) ? ' laundry-item-exiting' : ''}`}>
            {item.photo_url
              ? <img src={item.photo_url} alt={item.category} />
              : <span>🧥</span>}
          </div>
        ))}
        {load.items.length > 6 && (
          <div className="load-thumb load-thumb-more">+{load.items.length - 6}</div>
        )}
      </div>
      <button className="btn-primary load-clean-btn" onClick={handleMarkClean} disabled={loading}>
        {loading ? 'Zapisuję...' : 'Oznacz jako wyprane ✓'}
      </button>
    </div>
  )
}

export default function LaundryScreen({ clothes, onUpdated }) {
  const dirty = getDirtyClothes(clothes)
  const byOwner = groupByOwner(dirty)
  const loads = recommendLaundryLoads(clothes)

  async function handleMarkClean(items) {
    const now = new Date().toISOString()
    await Promise.all(
      items.map(item =>
        updateClothing(item.id, { status: STATUSES.CLEAN, last_washed: now })
          .then(() => onUpdated(item.id, { status: STATUSES.CLEAN, last_washed: now }))
      )
    )
  }

  if (!dirty.length) {
    return (
      <div className="laundry-screen">
        <div className="laundry-header">
          <h1 className="laundry-title">Pranie</h1>
        </div>
        <div className="laundry-empty">
          <span className="laundry-empty-icon">🧺</span>
          <p className="laundry-empty-title">Wszystko czyste! 🎉</p>
          <p className="laundry-empty-sub">Zmień status ubrania na „używane" żeby pojawiło się tutaj</p>
        </div>
      </div>
    )
  }

  return (
    <div className="laundry-screen">
      <div className="laundry-header">
        <h1 className="laundry-title">Pranie</h1>
        <span className="laundry-header-count">{dirty.length} rzeczy</span>
      </div>

      {/* Sekcja 1 — Kosz */}
      <div className="laundry-section">
        <p className="laundry-section-label">Kosz — {dirty.length} {dirty.length === 1 ? 'rzecz' : 'rzeczy'} do prania</p>
        {Object.entries(byOwner).map(([owner, items]) => (
          <div key={owner} className="laundry-owner-group">
            {Object.keys(byOwner).length > 1 && (
              <p className="laundry-owner-label">{owner}</p>
            )}
            {items.map(item => (
              <ClothingRow key={item.id} item={item} onUpdated={onUpdated} />
            ))}
          </div>
        ))}
      </div>

      {/* Sekcja 2 — Rekomendowane wsady */}
      {loads.length > 0 && (
        <div className="laundry-section">
          <p className="laundry-section-label">Rekomendowane wsady</p>
          <div className="laundry-loads-list">
            {loads.map((load, i) => (
              <LoadCard key={i} load={load} onMarkClean={handleMarkClean} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
