import { STATUS_COLORS } from '../../config/constants'

export default function ClothingCard({ item, onClick, showOwner = false, style }) {
  const statusColor = STATUS_COLORS[item.status] ?? '#c7c7cc'
  const subtitle = [item.material, item.colors?.[0]].filter(Boolean).join(' · ')

  return (
    <div className="clothing-card" onClick={onClick} style={style}>
      <div className="card-photo-wrap">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.category ?? 'Ubranie'} className="card-photo" loading="lazy" />
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
