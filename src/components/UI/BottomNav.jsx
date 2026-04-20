export default function BottomNav({ activeScreen, onGallery, onOutfits, onLaundry, onAddClick, onChat }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-tab ${activeScreen === 'gallery' ? 'active' : ''}`} onClick={onGallery}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="nav-label">Szafa</span>
      </button>

      <button className={`nav-tab ${activeScreen === 'outfits' ? 'active' : ''}`} onClick={onOutfits}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="8" height="18" rx="2"/>
          <rect x="14" y="3" width="8" height="18" rx="2"/>
        </svg>
        <span className="nav-label">Outfity</span>
      </button>

      <button className="nav-add" onClick={onAddClick} aria-label="Dodaj ubranie">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button className={`nav-tab ${activeScreen === 'laundry' ? 'active' : ''}`} onClick={onLaundry}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3"/>
          <circle cx="12" cy="13" r="5"/>
          <circle cx="12" cy="13" r="2.5"/>
          <line x1="7" y1="6" x2="7.01" y2="6" strokeWidth="2.5"/>
          <line x1="10" y1="6" x2="13" y2="6"/>
        </svg>
        <span className="nav-label">Pranie</span>
      </button>

      <button className={`nav-tab ${activeScreen === 'chat' ? 'active' : ''}`} onClick={onChat}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span className="nav-label">Chat</span>
      </button>
    </nav>
  )
}
