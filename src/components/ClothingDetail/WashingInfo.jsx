const WASHING_ICONS = {
  temp:   '/assets/temperature.png',
  drop:   '/assets/washing-drop.png',
  dry:    '/assets/drying.png',
  iron:   '/assets/ironing.png',
}

export default function WashingInfo({ item }) {
  const rows = [
    { iconKey: 'temp', label: 'Temperatura', value: item.washing_temp ? `${item.washing_temp}°C` : null },
    { iconKey: 'drop', label: 'Tryb prania',  value: item.washing_mode },
    { iconKey: 'dry',  label: 'Suszenie',     value: item.drying },
    { iconKey: 'iron', label: 'Prasowanie',   value: item.ironing },
  ]

  const hasAny = rows.some(r => r.value)
  if (!hasAny) return null

  return (
    <div className="detail-section">
      <p className="detail-section-label">Pielęgnacja</p>
      <div className="washing-grid">
        {rows.filter(r => r.value).map(row => (
          <div key={row.label} className="washing-card">
            <img src={WASHING_ICONS[row.iconKey]} className="pixel-icon washing-emoji"
              width="18" height="18" style={{ borderRadius: '4px' }} alt={row.label} />
            <span className="washing-val">{row.value}</span>
            <span className="washing-lbl">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
