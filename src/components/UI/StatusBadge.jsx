import { STATUS_LABELS } from '../../config/constants'

const STATUS_ICONS = {
  'czyste':   '/assets/status-clean.png',
  'używane':  '/assets/status-used.png',
  'w praniu': '/assets/status-washing.png',
}

export default function StatusBadge({ status, onClick, style = {} }) {
  const label = STATUS_LABELS[status] ?? status
  const icon = STATUS_ICONS[status]

  return (
    <span
      className="status-badge"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '5px', ...style }}
    >
      {icon && <img src={icon} className="pixel-icon" width="18" height="18" style={{ borderRadius: '4px' }} alt={status} />}
      {label}
    </span>
  )
}
