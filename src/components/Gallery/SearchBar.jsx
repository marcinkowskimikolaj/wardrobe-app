import { useMemo, useEffect } from 'react'
import { logSearch } from '../../services/devLogger'

export default function SearchBar({ query, onChange, onClose, clothes, resultsCount = 0 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) logSearch(query, resultsCount)
    }, 1000)
    return () => clearTimeout(timer)
  }, [query, resultsCount])
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
          <img src="/assets/Lupa.png" className="pixel-icon" width="22" height="22"
            style={{ opacity: 0.4, borderRadius: '4px', marginRight: '8px' }} />
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
