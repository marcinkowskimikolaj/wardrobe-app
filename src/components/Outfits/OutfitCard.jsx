import { useState } from 'react'
import { updateOutfit, deleteOutfit } from '../../services/supabase'
import { STATUS_COLORS } from '../../config/constants'

export default function OutfitCard({ outfit, clothes, onUpdated, onDeleted, onItemClick }) {
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(outfit.name ?? 'Outfit')
  const [saveError, setSaveError] = useState(false)

  // Ubrania należące do tego outfitu
  const items = (outfit.clothing_ids ?? [])
    .map(id => clothes.find(c => c.id === id))
    .filter(Boolean)

  const isReadyToWear = items.length > 0 && items.every(item => item.status === 'czyste')

  async function saveName() {
    setEditingName(false)
    if (name === outfit.name) return
    try {
      await updateOutfit(outfit.id, { name })
      onUpdated(outfit.id, { name })
    } catch (err) {
      console.error(err)
      setName(outfit.name ?? 'Outfit')
      setSaveError(true)
      setTimeout(() => setSaveError(false), 2000)
    }
  }

  async function handleDelete() {
    try {
      await deleteOutfit(outfit.id)
      onDeleted(outfit.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="outfit-card">
      <div className="outfit-card-header">
        {editingName ? (
          <input
            className="outfit-name-edit"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            autoFocus
          />
        ) : (
          <button className="outfit-name-btn" onClick={() => setEditingName(true)}>
            {name}
            <img src="/assets/edit-pencil.png" className="pixel-icon outfit-edit-icon" width="18" height="18"
              style={{ borderRadius: '4px', opacity: 0.7 }} alt="Edytuj" />
          </button>
        )}
        {saveError && <span className="outfit-save-error">Błąd zapisu</span>}
        <div className="outfit-card-meta">
          <span className="outfit-owner">{outfit.owner}</span>
          <button className="outfit-delete-btn" onClick={handleDelete}>✕</button>
        </div>
      </div>

      {/* Poziomy pasek miniaturek */}
      <div className="outfit-strip">
        {items.length === 0 ? (
          <p className="outfit-empty">Brak ubrań</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="outfit-thumb" onClick={() => onItemClick(item)}>
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.category ?? ''} />
              ) : (
                <span>🧥</span>
              )}
              <span className="card-status-dot" style={{ background: STATUS_COLORS[item.status] ?? '#c7c7cc' }} />
            </div>
          ))
        )}
      </div>

      {isReadyToWear && (
        <div className="outfit-ready-badge">
          <img src="/assets/checkmark-fresh.png" width="16" height="16"
            className="pixel-icon" alt="" style={{ imageRendering: 'pixelated' }} />
          Gotowe do ubrania
        </div>
      )}
    </div>
  )
}
