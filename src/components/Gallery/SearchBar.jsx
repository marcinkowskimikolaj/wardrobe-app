import { useMemo } from 'react'

export default function SearchBar({ query, onChange, onClose, clothes }) {
  // Dynamiczne chipy z unikatowych wartości w bazie
  const chips = useMemo(() => {
    const colors = [...new Set(clothes.flatMap(c => c.colors ?? []))].slice(0, 8)
    const categories = [...new Set(clothes.map(c => c.category).filter(Boolean))].slice(0, 6)
    const styles = [...new Set(clothes.flatMap(c => c.style_tags ?? []))].slice(0, 6)
    const seasons = [...new Set(clothes.flatMap(c => c.season ?? []))]
    return { colors, categories, styles, seasons }
  }, [clothes])

  function addChip(val) {
    if (!query.includes(val)) onChange(query ? `${query} ${val}` : val)
  }

  return (
    <div className="search-screen">
      <div className="search-top-bar">
        <div className="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="search-input"
            type="search"
            autoFocus
            placeholder="Szukaj ubrania..."
            value={query}
            onChange={e => onChange(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => onChange('')}>✕</button>}
        </div>
        <button className="search-cancel-btn" onClick={onClose}>Anuluj</button>
      </div>

      {!query && (
        <div className="search-chips-area">
          {chips.categories.length > 0 && (
            <div className="search-chip-group">
              <p className="search-chip-label">Kategorie</p>
              <div className="search-chips">
                {chips.categories.map(v => (
                  <button key={v} className="search-chip" onClick={() => addChip(v)}>{v}</button>
                ))}
              </div>
            </div>
          )}
          {chips.colors.length > 0 && (
            <div className="search-chip-group">
              <p className="search-chip-label">Kolory</p>
              <div className="search-chips">
                {chips.colors.map(v => (
                  <button key={v} className="search-chip" onClick={() => addChip(v)}>{v}</button>
                ))}
              </div>
            </div>
          )}
          {chips.styles.length > 0 && (
            <div className="search-chip-group">
              <p className="search-chip-label">Styl</p>
              <div className="search-chips">
                {chips.styles.map(v => (
                  <button key={v} className="search-chip" onClick={() => addChip(v)}>{v}</button>
                ))}
              </div>
            </div>
          )}
          {chips.seasons.length > 0 && (
            <div className="search-chip-group">
              <p className="search-chip-label">Sezon</p>
              <div className="search-chips">
                {chips.seasons.map(v => (
                  <button key={v} className="search-chip" onClick={() => addChip(v)}>{v}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
