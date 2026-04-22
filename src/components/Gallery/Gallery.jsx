import { useState, useMemo, useRef, useEffect } from 'react'
import ClothingCard from './ClothingCard'
import FilterSheet from './FilterSheet'
import SearchBar from './SearchBar'
import LoadingSpinner from '../UI/LoadingSpinner'
import WizardHint from '../UI/WizardHint'
import { signOut, supabase } from '../../services/supabase'
import { DEV_EMAIL } from '../../config/constants'
import { fetchLogs, fetchLogStats } from '../../services/devLogger'
import { generateMarkdown } from '../../utils/logExporter'

const EMPTY_FILTERS = { categories: [], statuses: [], seasons: [], brands: [] }

const OWNER_AVATARS = {
  'Mikołaj': '/assets/avatar-mikolaj.png',
  'Emilka':  '/assets/avatar-emilka.png',
}

function applyFilters(clothes, sheetFilters) {
  return clothes.filter(item => {
    if (sheetFilters.categories.length && !sheetFilters.categories.includes(item.category)) return false
    if (sheetFilters.statuses.length && !sheetFilters.statuses.includes(item.status)) return false
    if (sheetFilters.seasons.length && !item.season?.some(s => sheetFilters.seasons.includes(s))) return false
    if (sheetFilters.brands?.length && !sheetFilters.brands.includes(item.brand)) return false
    return true
  })
}

function searchClothes(clothes, query) {
  const q = query.toLowerCase().trim()
  if (!q) return clothes
  return clothes.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.category?.toLowerCase().includes(q) ||
    item.material?.toLowerCase().includes(q) ||
    item.notes?.toLowerCase().includes(q) ||
    item.dominant_color?.toLowerCase().includes(q) ||
    item.pattern?.toLowerCase().includes(q) ||
    item.formality?.toLowerCase().includes(q) ||
    item.colors?.some(c => c.toLowerCase().includes(q)) ||
    item.style_tags?.some(t => t.toLowerCase().includes(q)) ||
    item.season?.some(s => s.toLowerCase().includes(q)) ||
    item.prompt_tags?.some(t => t.toLowerCase().includes(q)) ||
    item.brand?.toLowerCase().includes(q)
  )
}

function countActiveFilters(f) {
  return f.categories.length + f.statuses.length + f.seasons.length + (f.brands?.length ?? 0)
}

export default function Gallery({ clothes, loading, error, onItemClick, ownerName, user, devMode, toggleDevMode, onReload, onRestartTour }) {
  const [viewMode, setViewMode] = useState('mine') // 'mine' | 'all'
  const [sheetFilters, setSheetFilters] = useState(EMPTY_FILTERS)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [signOutError, setSignOutError] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [reloadStatus, setReloadStatus] = useState(null) // null | 'loading' | 'done'
  const [exportingLogs, setExportingLogs] = useState(false)
  const menuRef = useRef(null)
  const isDevUser = user?.email === DEV_EMAIL

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [showMenu])

  async function handleSignOut() {
    setShowMenu(false)
    try {
      await signOut()
    } catch {
      setSignOutError(true)
      setTimeout(() => setSignOutError(false), 3000)
    }
  }

  async function handleExportLogs() {
    setExportingLogs(true)
    setShowMenu(false)
    try {
      const [logs, stats] = await Promise.all([fetchLogs(500), fetchLogStats()])
      const md = generateMarkdown(logs, stats)
      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wardrobe-wizard-logs-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExportingLogs(false)
    }
  }

  async function handleClearLogs() {
    if (!window.confirm('Usunąć wszystkie logi? Tej akcji nie można cofnąć.')) return
    setShowMenu(false)
    await supabase
      .from('dev_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    window.alert('Logi wyczyszczone.')
  }

  async function handleReload() {
    if (reloadStatus === 'loading') return
    setReloadStatus('loading')
    try {
      await onReload?.()
      setReloadStatus('done')
      setTimeout(() => setReloadStatus(null), 1500)
    } catch {
      setReloadStatus(null)
    }
  }

  const favoriteCount = useMemo(() => {
    const base = viewMode === 'mine' && ownerName
      ? clothes.filter(c => c.owner === ownerName)
      : clothes
    return base.filter(c => c.is_favorite === true).length
  }, [clothes, viewMode, ownerName])

  const filtered = useMemo(() => {
    // 1. Filtr widoku (Moje / Wspólna)
    let result = viewMode === 'mine' && ownerName
      ? clothes.filter(c => c.owner === ownerName)
      : clothes

    // 2. Filtr z bottom sheet
    result = applyFilters(result, sheetFilters)

    // 3. Wyszukiwanie tekstowe
    result = searchClothes(result, searchQuery)

    // 4. Filtr ulubionych
    if (showFavorites) result = result.filter(item => item.is_favorite === true)

    return result
  }, [clothes, viewMode, sheetFilters, searchQuery, ownerName, showFavorites])

  const activeFilterCount = countActiveFilters(sheetFilters)
  const initials = ownerName ? ownerName.slice(0, 1).toUpperCase() : '?'
  const gridKey = `${viewMode}|${sheetFilters.categories.join(',')}|${sheetFilters.statuses.join(',')}|${sheetFilters.seasons.join(',')}|${(sheetFilters.brands ?? []).join(',')}|${searchQuery}|${showFavorites}`

  if (searchOpen) {
    return (
      <div className="gallery-screen">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            onClose={() => { setSearchOpen(false); setSearchQuery('') }}
            clothes={clothes}
            resultsCount={filtered.length}
          />
          <div style={{ paddingRight: '12px', flexShrink: 0 }}>
            <WizardHint hintKey="gallery-search" />
          </div>
        </div>
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
              {ownerName ? `Cześć, ${ownerName}!` : 'Wardrobe Wizard'}
            </h1>
            {!loading && (
              <p className="gallery-subtitle">
                {filtered.length} {filtered.length === 1 ? 'ubranie' : filtered.length < 5 ? 'ubrania' : 'ubrań'} w szafie
              </p>
            )}
          </div>
          <div className="gallery-header-right">
            <button className="btn-icon-header" onClick={() => setSearchOpen(true)} aria-label="Szukaj">
              <img src="/assets/Lupa.png" className="pixel-icon" width="28" height="28"
                style={{ borderRadius: '6px', opacity: searchOpen ? 1 : 0.6 }} />
            </button>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                className={`gallery-avatar${OWNER_AVATARS[ownerName] ? ' gallery-avatar-img' : ''}`}
                onClick={() => setShowMenu(v => !v)}
                aria-label="Profil"
              >
                {OWNER_AVATARS[ownerName]
                  ? <img src={OWNER_AVATARS[ownerName]} className="pixel-icon" width="40" height="40"
                      style={{ borderRadius: '10px', filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.12))' }} alt={ownerName} />
                  : initials
                }
              </button>
              {showMenu && (
                <div className="profile-menu">
                  <button
                    className="profile-menu-item"
                    onClick={() => { setShowMenu(false); onRestartTour?.() }}
                  >
                    <img src="/assets/wizard-idle.png" width="20" height="20" className="pixel-icon" style={{ marginRight: '8px', verticalAlign: 'middle' }} alt="" />
                    Pokaż tour aplikacji
                  </button>
                  <div className="profile-menu-divider" />
                  {isDevUser && (
                    <>
                      <button className="profile-menu-item profile-menu-dev" onClick={() => { toggleDevMode?.(); setShowMenu(false) }}>
                        <img src="/assets/dev-tools.png" className="pixel-icon" width="16" height="16" alt="" />
                        {devMode ? 'Wyłącz dev mode' : 'Włącz dev mode'}
                      </button>
                      {devMode && (
                        <>
                          <button className="profile-menu-item" onClick={handleExportLogs} disabled={exportingLogs}>
                            📋 {exportingLogs ? 'Generuję...' : 'Eksportuj logi'}
                          </button>
                          <button className="profile-menu-item" onClick={handleClearLogs}>
                            <img src="/assets/dev-trash.png" className="pixel-icon" width="16" height="16" alt="" style={{marginRight: '6px', verticalAlign: 'middle'}} />Wyczyść logi
                          </button>
                        </>
                      )}
                      <div className="profile-menu-divider" />
                    </>
                  )}
                  <button className="profile-menu-item profile-menu-signout" onClick={handleSignOut}>
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
            {signOutError && <span className="signout-error">Błąd wylogowania</span>}
          </div>
        </div>

        {/* View toggle + Favorites + Filter */}
        <div className="gallery-controls">
          <div className="view-toggle">
            <button className={`view-pill ${viewMode === 'mine' ? 'active' : ''}`}
              onClick={() => setViewMode('mine')}>
              <img src="/assets/avatar-mikolaj.png" className="pixel-icon" width="20" height="20" alt="" />
              Moje
            </button>
            <button className={`view-pill ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src="/assets/avatar-mikolaj.png" width="20" height="20" alt="" />
                <img src="/assets/avatar-emilka.png" width="20" height="20" alt="" style={{marginLeft: '-6px'}} />
              </div>
              Wspólna szafa
            </button>
          </div>
          <button
            className={`favorite-filter-pill${showFavorites ? ' active' : ''}`}
            onClick={() => setShowFavorites(v => !v)}
            aria-label="Pokaż ulubione"
          >
            <img src="/assets/star.png" className="pixel-icon" width="28" height="28"
              style={{ borderRadius: '6px' }} alt="" />
          </button>
          <WizardHint hintKey="gallery-filters" />
          <button className={`filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilterSheet(true)}>
            Filtruj{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px', marginBottom: '1px' }}>
              <polyline points="2 4 6 8 10 4"/>
            </svg>
          </button>
        </div>

        {devMode && (
          <>
            <div className="dev-mode-banner">
              <span className="dev-mode-icon">🛠</span> Dev Mode
            </div>
            <div className="dev-tools-bar">
              <button
                className="dev-tool-btn"
                onClick={handleReload}
                disabled={reloadStatus === 'loading'}
              >
                {reloadStatus === 'loading' ? 'Ładuję...' : reloadStatus === 'done' ? '✓ Odświeżono' : '↺ Odśwież szafę'}
              </button>
            </div>
          </>
        )}
      </div>

      {showFilterSheet && (
        <FilterSheet
          activeFilters={sheetFilters}
          onApply={setSheetFilters}
          onClose={() => setShowFilterSheet(false)}
          clothes={clothes}
        />
      )}

      {/* Scrollable content */}
      <div className="gallery-scroll">
        {loading && <LoadingSpinner text="Ładuję szafę..." />}
        {error && <p className="error-msg" style={{ margin: '1rem 0' }}>Błąd: {error}</p>}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className="gallery-empty">
              {showFavorites ? (
                <>
                  <img src="/assets/star.png" className="pixel-icon"
                    width="96" height="96"
                    style={{ borderRadius: '16px', opacity: 0.5, animation: 'iconSway 2s ease-in-out infinite' }} />
                  <p className="gallery-empty-title">Brak ulubionych</p>
                  <p className="gallery-empty-sub">Otwórz ubranie i tapnij gwiazdkę</p>
                </>
              ) : (
                <>
                  <img src="/assets/Wieszak.png" className="pixel-icon"
                    width="96" height="96"
                    style={{ borderRadius: '16px', opacity: 0.7, animation: 'iconSway 2s ease-in-out infinite' }} />
                  <p className="gallery-empty-title">Szafa czeka na ubrania</p>
                  <p className="gallery-empty-sub">Dodaj pierwsze tapnięciem +</p>
                </>
              )}
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
