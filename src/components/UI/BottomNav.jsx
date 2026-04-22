export default function BottomNav({ activeScreen, onGallery, onOutfits, onLaundry, onAddClick, onChat }) {
  function navImg(src, active) {
    return (
      <img
        src={src}
        width="32"
        height="32"
        className="pixel-icon nav-tab-img"
        style={{
          borderRadius: '6px',
          filter: active
            ? 'drop-shadow(0 0 6px rgba(0,0,0,0.15))'
            : 'grayscale(60%) opacity(0.55)',
        }}
      />
    )
  }

  return (
    <nav className="bottom-nav">
      <button data-tab="gallery" className={`nav-tab ${activeScreen === 'gallery' ? 'active' : ''}`} onClick={onGallery}>
        {navImg('/assets/Wieszak.png', activeScreen === 'gallery')}
        <span className="nav-label">Szafa</span>
      </button>

      <button data-tab="outfits" className={`nav-tab ${activeScreen === 'outfits' ? 'active' : ''}`} onClick={onOutfits}>
        {navImg('/assets/outfit.png', activeScreen === 'outfits')}
        <span className="nav-label">Outfity</span>
      </button>

      <button data-tab="add" className="nav-add" onClick={onAddClick} aria-label="Dodaj ubranie">
        <img src="/assets/plus.png" className="pixel-icon" width="40" height="40"
          style={{ borderRadius: '10px' }} alt="Dodaj" />
        <span className="nav-label">Dodaj</span>
      </button>

      <button data-tab="laundry" className={`nav-tab ${activeScreen === 'laundry' ? 'active' : ''}`} onClick={onLaundry}>
        {navImg('/assets/Pralka.png', activeScreen === 'laundry')}
        <span className="nav-label">Pranie</span>
      </button>

      <button data-tab="chat" className={`nav-tab ${activeScreen === 'chat' ? 'active' : ''}`} onClick={onChat}>
        {navImg('/assets/Rozdzka.png', activeScreen === 'chat')}
        <span className="nav-label">Chat</span>
      </button>
    </nav>
  )
}
