import { STATUS_LABELS, STATUS_COLORS } from '../../config/constants'

export default function StatusBadge({ status, onClick, style = {} }) {
  const color = STATUS_COLORS[status] ?? '#888'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      className="status-badge"
      onClick={onClick}
      style={{ '--badge-color': color, cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {label}
    </span>
  )
}
