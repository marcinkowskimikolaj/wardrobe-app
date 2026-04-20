// Wyświetla tablicę tagów jako pills
export default function TagList({ tags = [], color = 'var(--accent)' }) {
  if (!tags || tags.length === 0) return <span className="empty-val">—</span>
  return (
    <div className="tag-list">
      {tags.map((tag, i) => (
        <span key={i} className="tag" style={{ '--tag-color': color }}>{tag}</span>
      ))}
    </div>
  )
}
