export default function WashingInfo({ item }) {
  const rows = [
    { icon: '🌡️', label: 'Temperatura', value: item.washing_temp ? `${item.washing_temp}°C` : null },
    { icon: '💧', label: 'Tryb prania',  value: item.washing_mode },
    { icon: '👕', label: 'Suszenie',     value: item.drying },
    { icon: '🔥', label: 'Prasowanie',   value: item.ironing },
  ]

  const hasAny = rows.some(r => r.value)
  if (!hasAny) return null

  return (
    <div className="detail-section">
      <p className="detail-section-label">Pielęgnacja</p>
      <div className="washing-grid">
        {rows.filter(r => r.value).map(row => (
          <div key={row.label} className="washing-card">
            <span className="washing-emoji">{row.icon}</span>
            <span className="washing-val">{row.value}</span>
            <span className="washing-lbl">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
