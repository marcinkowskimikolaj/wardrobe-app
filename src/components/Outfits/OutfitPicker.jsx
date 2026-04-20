import { useState } from 'react'
import { addOutfit } from '../../services/supabase'

export default function OutfitPicker({ currentItem, clothes, onSaved, onClose }) {
  const [selected, setSelected] = useState([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // Tylko ubrania tego samego właściciela, bez aktualnego
  const candidates = clothes.filter(c => c.owner === currentItem.owner && c.id !== currentItem.id)

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function handleSave() {
    if (selected.length === 0) return
    setSaving(true)
    try {
      const outfit = await addOutfit({
        name: name.trim() || 'Outfit',
        owner: currentItem.owner,
        clothing_ids: [currentItem.id, ...selected],
        notes: null,
      })
      onSaved(outfit)
      onClose()
    } catch (err) {
      console.error('Błąd zapisu outfitu:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="outfit-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="outfit-picker-header">
          <h3>Nowy outfit</h3>
          <button className="btn-back" onClick={onClose}>✕</button>
        </div>

        <input
          className="outfit-name-input"
          type="text"
          placeholder="Nazwa outfitu (opcjonalne)"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <p className="outfit-picker-hint">Wybierz ubrania które pasują do siebie</p>

        {candidates.length === 0 ? (
          <p className="outfit-picker-empty">Brak innych ubrań {currentItem.owner}</p>
        ) : (
          <div className="outfit-picker-grid">
            {candidates.map(item => (
              <div
                key={item.id}
                className={`outfit-picker-card ${selected.includes(item.id) ? 'selected' : ''}`}
                onClick={() => toggle(item.id)}
              >
                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.category ?? ''} className="outfit-picker-photo" />
                ) : (
                  <div className="outfit-picker-placeholder">🧥</div>
                )}
                {selected.includes(item.id) && <div className="outfit-picker-check">✓</div>}
                <span className="outfit-picker-label">{item.category ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || selected.length === 0}
          style={{ marginTop: '1rem' }}
        >
          {saving ? 'Zapisuję...' : `Zapisz outfit (${selected.length + 1} szt.)`}
        </button>
      </div>
    </div>
  )
}
