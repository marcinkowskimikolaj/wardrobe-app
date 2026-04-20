import { useState, useMemo, useRef } from 'react'
import ClothingCard from './ClothingCard'
import FilterSheet from './FilterSheet'
import SearchBar from './SearchBar'
import LoadingSpinner from '../UI/LoadingSpinner'
import { signOut } from '../../services/supabase'

const EMPTY_FILTERS = { categories: [], statuses: [], seasons: [] }

function applyFilters(clothes, sheetFilters) {
  return clothes.filter(item => {
    if (sheetFilters.categories.length && !sheetFilters.categories.includes(item.category)) return false
    if (sheetFilters.statuses.length && !sheetFilters.statuses.includes(item.status)) return false
    if (sheetFilters.seasons.length && !item.season?.some(s => sheetFilters.seasons.includes(s))) return false
    return true
  })
}

function searchClothes(clothes, query) {
  const q = query.toLowerCase().trim()
  if (!q) return clothes
  return clothes.filter(item =>
    item.category?.toLowerCase().includes(q) ||
    item.material?.toLowerCase().includes(q) ||
    item.notes?.toLowerCase().includes(q) ||
    item.dominant_color?.toLowerCase().includes(q) ||
    item.pattern?.toLowerCase().includes(q) ||
    item.formality?.toLowerCase().includes(q) ||
    item.colors?.some(c => c.toLowerCase().includes(q)) ||
    item.style_tags?.some(t => t.toLowerCase().includes(q)) ||
    item.season?.some(s => s.toLowerCase().includes(q)) ||
    item.prompt_tags?.some(t => t.toLowerCase().includes(q))
  )
}

function countActiveFilters(f) {
  return f.categories.length + f.statuses.length + f.seasons.length
}

export default function Gallery({ clothes, loading, error, onItemClick, ownerName }) {
  const [viewMode, setViewMode] = useState('mine') // 'mine' | 'all'
  const [sheetFilters, setSheetFilters] = useState(EMPTY_FILTERS)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Długie przytrzymanie avatara → wylogowanie
  const pressTimer = useRef(null)
  function handleAvatarPress() {
    pressTimer.current = setTimeout(() => {
      if (window.confirm('Wylogować się?')) signOut()
    }, 600)
  }
  function handleAvatarRelease() { clearTimeout(pressTimer.current) }

  const filtered = useMemo(() => {
    // 1. Filtr widoku (Moje / Wspólna)
    let result = viewMode === 'mine' && ownerName
      ? clothes.filter(c => c.owner === ownerName)
      : clothes

    // 2. Filtr z bottom sheet
    result = applyFilters(result, sheetFilters)

    // 3. Wyszukiwanie tekstowe
    result = searchClothes(result, searchQuery)

    return result
  }, [clothes, viewMode, sheetFilters, searchQuery, ownerName])

  const activeFilterCount = countActiveFilters(sheetFilters)
  const initials = ownerName ? ownerName.slice(0, 1).toUpperCase() : '?'
  const gridKey = `${viewMode}|${sheetFilters.categories.join(',')}|${sheetFilters.statuses.join(',')}|${sheetFilters.seasons.join(',')}|${searchQuery}`

  if (searchOpen) {
    return (
      <div className="gallery-screen">
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          onClose={() => { setSearchOpen(false); setSearchQuery('') }}
          clothes={clothes}
        />
        <div className="gallery-scroll">
          {searchQuery && (
            <div className="clothes-grid" key={searchQuery}>
              {filtered.map((item, index) => (
                <ClothingCard key={item.id} item={item} onClick={() => onItemClick(item)} showOwner={viewMode === 'all'} style={{ '--index': index }} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-screen">
      {/* Sticky header */}
      <div className="gallery-sticky-header">
        <div className="gallery-header">
          <div>
            <h1 className="gallery-greeting">
              {ownerName ? `Cześć, ${ownerName}!` : 'Szafa'}
            </h1>
            {!loading && (
              <p className="gallery-subtitle">
                {filtered.length} {filtered.length === 1 ? 'ubranie' : filtered.length < 5 ? 'ubrania' : 'ubrań'} w szafie
              </p>
            )}
          </div>
          <div className="gallery-header-right">
            <button className="btn-icon-header" onClick={() => setSearchOpen(true)} aria-label="Szukaj">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button
              className="gallery-avatar"
              onTouchStart={handleAvatarPress}
              onTouchEnd={handleAvatarRelease}
              onMouseDown={handleAvatarPress}
              onMouseUp={handleAvatarRelease}
              aria-label="Profil (przytrzymaj aby wylogować)"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* View toggle + Filter */}
        <div className="gallery-controls">
          <div className="view-toggle">
            <button className={`view-pill ${viewMode === 'mine' ? 'active' : ''}`}
              onClick={() => setViewMode('mine')}>
              👤 Moje
            </button>
            <button className={`view-pill ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}>
              👥 Wspólna szafa
            </button>
          </div>
          <button className={`filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilterSheet(true)}>
            Filtruj{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px', marginBottom: '1px' }}>
              <polyline points="2 4 6 8 10 4"/>
            </svg>
          </button>
        </div>
      </div>

      {showFilterSheet && (
        <FilterSheet
          activeFilters={sheetFilters}
          onApply={setSheetFilters}
          onClose={() => setShowFilterSheet(false)}
        />
      )}

      {/* Scrollable content */}
      <div className="gallery-scroll">
        {loading && <LoadingSpinner text="Ładuję szafę..." />}
        {error && <p className="error-msg" style={{ margin: '1rem 0' }}>Błąd: {error}</p>}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className="gallery-empty">
              <span className="empty-icon empty-icon-sway">👗</span>
              <p className="gallery-empty-title">Szafa czeka na ubrania</p>
              <p className="gallery-empty-sub">Dodaj pierwsze tapnięciem +</p>
            </div>
          ) : (
            <div className="clothes-grid" key={gridKey}>
              {filtered.map((item, index) => (
                <ClothingCard key={item.id} item={item} onClick={() => onItemClick(item)}
                  showOwner={viewMode === 'all'} style={{ '--index': index }} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
