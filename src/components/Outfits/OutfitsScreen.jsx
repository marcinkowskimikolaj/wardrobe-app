import { useState } from 'react'
import LoadingSpinner from '../UI/LoadingSpinner'
import OutfitCard from './OutfitCard'
import StyleScanner from './StyleScanner'

export default function OutfitsScreen({ outfits, loading, error, clothes, onUpdated, onDeleted, onItemClick, onOutfitAdded, onAddClick, user, onReload }) {
  const [showScanner, setShowScanner] = useState(false)

  return (
    <div className="outfits-screen">
      <div className="gallery-header">
        <div>
          <h1 className="gallery-title">Outfity</h1>
          {!loading && <p className="gallery-count">{outfits.length} zestawów</p>}
        </div>
      </div>

      <button className="btn-scan-outfit" onClick={() => setShowScanner(true)}>
        ✨ Skanuj stylizację
      </button>

      {loading && <LoadingSpinner text="Ładuję outfity..." />}
      {error && <p className="error-msg" style={{ padding: '1rem' }}>Błąd: {error}</p>}

      {!loading && !error && (
        outfits.length === 0 ? (
          <div className="gallery-empty">
            <span className="empty-icon empty-icon-sway">👗</span>
            <p className="gallery-empty-title">Brak outfitów</p>
            <p className="gallery-empty-sub">Dodaj ze szczegółów ubrania lub użyj skanera.</p>
          </div>
        ) : (
          <div className="outfits-list">
            {outfits.map(outfit => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                clothes={clothes}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )
      )}

      {showScanner && (
        <StyleScanner
          clothes={clothes}
          user={user}
          onReload={onReload}
          onSaved={outfit => { onOutfitAdded?.(outfit); setShowScanner(false) }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
