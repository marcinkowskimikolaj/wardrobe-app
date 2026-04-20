import LoadingSpinner from '../UI/LoadingSpinner'
import OutfitCard from './OutfitCard'

export default function OutfitsScreen({ outfits, loading, error, clothes, onUpdated, onDeleted, onItemClick }) {
  return (
    <div className="outfits-screen">
      <div className="gallery-header">
        <div>
          <h1 className="gallery-title">Outfity</h1>
          {!loading && <p className="gallery-count">{outfits.length} zestawów</p>}
        </div>
      </div>

      {loading && <LoadingSpinner text="Ładuję outfity..." />}
      {error && <p className="error-msg" style={{ padding: '1rem' }}>Błąd: {error}</p>}

      {!loading && !error && (
        outfits.length === 0 ? (
          <div className="gallery-empty">
            <span className="empty-icon">👗</span>
            <p>Brak outfitów.<br />Dodaj ze szczegółów ubrania.</p>
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
    </div>
  )
}
