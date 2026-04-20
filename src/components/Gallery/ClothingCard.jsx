import { useState } from 'react'
import { STATUS_COLORS } from '../../config/constants'

export default function ClothingCard({ item, onClick, showOwner = false, style }) {
  const statusColor = STATUS_COLORS[item.status] ?? '#c7c7cc'
  const hasEnglish = str => /^[a-zA-Z\s]+$/.test(str?.trim())
  const subtitle = item.dominant_color
    ? (hasEnglish(item.material) ? item.dominant_color : [item.dominant_color, item.material].filter(Boolean).join(' · '))
    : item.material ?? ''
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="clothing-card" onClick={onClick} style={style}>
      <div className="card-photo-wrap">
        {item.photo_url ? (
          <>
            {!loaded && <div className="card-photo-shimmer" />}
            <img
              src={item.photo_url}
              alt={item.category ?? 'Ubranie'}
              className={`card-photo${loaded ? ' card-photo-loaded' : ''}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div className="card-photo-placeholder">🧥</div>
        )}
        <span className="card-status-dot" style={{ background: statusColor }} />
        {showOwner && (
          <span className="card-owner-badge">{item.owner?.[0] ?? '?'}</span>
        )}
      </div>
      <div className="card-info">
        <span className="card-category">{item.category ?? 'Ubranie'}</span>
        {subtitle && <span className="card-subtitle">{subtitle}</span>}
      </div>
    </div>
  )
}
