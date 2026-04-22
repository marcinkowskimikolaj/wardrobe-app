import { useState } from 'react'
import LoadingSpinner from '../UI/LoadingSpinner'
import OutfitCard from './OutfitCard'
import StyleScanner from './StyleScanner'
import WizardHint from '../UI/WizardHint'

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 1.25rem' }}>
        <button className="btn-scan-outfit" style={{ flex: 1, margin: 0 }} onClick={() => setShowScanner(true)}>
          <img src="/assets/Rozdzka.png" className="pixel-icon" width="24" height="24" style={{ borderRadius: '4px', marginRight: '8px' }} />
          Skanuj stylizację
        </button>
        <WizardHint hintKey="outfits-scanner" />
      </div>

      {loading && <LoadingSpinner text="Ładuję outfity..." />}
      {error && <p className="error-msg" style={{ padding: '1rem' }}>Błąd: {error}</p>}

      {!loading && !error && (
        outfits.length === 0 ? (
          <div className="gallery-empty">
            <img src="/assets/outfit.png" className="pixel-icon" width="72" height="72"
              style={{ borderRadius: '14px', opacity: 0.6, animation: 'iconSway 2s ease-in-out infinite' }} />
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
