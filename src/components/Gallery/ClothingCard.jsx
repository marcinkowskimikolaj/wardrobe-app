import { useState } from 'react'

const STATUS_ICONS = {
  'czyste':   '/assets/status-clean.png',
  'używane':  '/assets/status-used.png',
  'w praniu': '/assets/status-washing.png',
}

const OWNER_AVATARS = {
  'Mikołaj': '/assets/avatar-mikolaj.png',
  'Emilka':  '/assets/avatar-emilka.png',
}

export default function ClothingCard({ item, onClick, showOwner = false, style }) {
  const statusIcon = STATUS_ICONS[item.status]
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
          <div className="card-photo-placeholder">
            <img src="/assets/no-photo.png" className="pixel-icon" width="72" height="72"
              style={{ borderRadius: '8px', opacity: 0.5 }} />
          </div>
        )}
        {statusIcon && (
          <img src={statusIcon} className="pixel-icon card-status-icon" width="24" height="24"
            style={{ borderRadius: '3px' }} alt={item.status} />
        )}
        {showOwner && (
          OWNER_AVATARS[item.owner]
            ? <img src={OWNER_AVATARS[item.owner]} className="pixel-icon card-owner-badge" width="24" height="24"
                style={{ borderRadius: '6px' }} alt={item.owner} />
            : <span className="card-owner-badge">{item.owner?.[0] ?? '?'}</span>
        )}
        {item.is_favorite && (
          <div className="favorite-badge">
            <img src="/assets/star.png" className="pixel-icon" width="14" height="14"
              style={{ borderRadius: '3px' }} alt="Ulubione" />
          </div>
        )}
      </div>
      <div className="card-info">
        <span className="card-category">{(n => n ? n.charAt(0).toUpperCase() + n.slice(1) : null)(item.name) || item.category || 'Ubranie'}</span>
        <span className="card-subtitle">
          {item.brand && <span className="card-brand">{item.brand}</span>}
          {item.brand && (item.dominant_color || item.material) && <span className="card-dot"> · </span>}
          {item.dominant_color}
          {item.dominant_color && item.material && ' · '}
          {item.material}
        </span>
      </div>
    </div>
  )
}
