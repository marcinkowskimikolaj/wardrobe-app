import { useState } from 'react'
import { updateClothing, deleteClothing, deletePhoto } from '../../services/supabase'
import { STATUSES, STATUS_LABELS, STATUS_COLORS } from '../../config/constants'
import WashingInfo from './WashingInfo'
import ConfirmDialog from '../UI/ConfirmDialog'
import FormStep from '../AddClothing/FormStep'
import OutfitPicker from '../Outfits/OutfitPicker'

const STATUS_CYCLE = [STATUSES.CLEAN, STATUSES.USED, STATUSES.WASHING]

function itemToFormData(item) {
  return {
    owner: item.owner ?? '',
    category: item.category ?? '',
    colors: item.colors ?? [],
    material: item.material ?? '',
    style_tags: item.style_tags ?? [],
    season: item.season ?? [],
    washing_temp: item.washing_temp ?? null,
    washing_mode: item.washing_mode ?? '',
    drying: item.drying ?? '',
    ironing: item.ironing ?? '',
    ai_description: item.ai_description ?? '',
    notes: item.notes ?? '',
  }
}

function ColorDot({ color }) {
  return <span className="color-dot" title={color}>{color}</span>
}

export default function ClothingDetail({ item, onClose, onUpdated, onDeleted, clothes = [], outfits = [], onOutfitAdded, onItemClick }) {
  const [currentItem, setCurrentItem] = useState(item)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(itemToFormData(item))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [labelExpanded, setLabelExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showOutfitPicker, setShowOutfitPicker] = useState(false)

  // Outfity zawierające to ubranie
  const itemOutfits = outfits.filter(o => (o.clothing_ids ?? []).includes(currentItem.id))

  async function handleStatusChange(newStatus) {
    if (newStatus === currentItem.status || statusLoading) return
    setStatusLoading(true)
    try {
      await updateClothing(currentItem.id, { status: newStatus })
      const updated = { ...currentItem, status: newStatus }
      setCurrentItem(updated)
      onUpdated(currentItem.id, { status: newStatus })
    } catch (err) {
      console.error('Błąd zmiany statusu:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    setSaveError(null)
    try {
      const updates = {
        ...formData,
        category: formData.category || null,
        material: formData.material || null,
        washing_mode: formData.washing_mode || null,
        drying: formData.drying || null,
        ironing: formData.ironing || null,
        notes: formData.notes || null,
        ai_description: formData.ai_description || null,
      }
      const updated = await updateClothing(currentItem.id, updates)
      setCurrentItem(updated)
      onUpdated(currentItem.id, updates)
      setEditing(false)
    } catch (err) {
      setSaveError(`Błąd zapisu: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setFormData(itemToFormData(currentItem))
    setSaveError(null)
    setEditing(false)
  }

  async function handleDelete() {
    try {
      await deleteClothing(currentItem.id)
      if (currentItem.photo_url) deletePhoto(currentItem.photo_url).catch(console.warn)
      if (currentItem.label_photo_url) deletePhoto(currentItem.label_photo_url).catch(console.warn)
      onDeleted(currentItem.id)
      onClose()
    } catch (err) {
      console.error('Błąd usunięcia:', err)
    }
  }

  return (
    <div className="detail-screen">
      {showConfirm && (
        <ConfirmDialog
          message="Usunąć to ubranie? Tej operacji nie można cofnąć."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Nagłówek */}
      <div className="screen-header">
        {editing ? (
          <>
            <button className="btn-back" onClick={handleCancelEdit}>← Anuluj</button>
            <span className="header-title">Edycja</span>
          </>
        ) : (
          <>
            <button className="btn-back" onClick={onClose}>← Wróć</button>
            <div className="header-actions">
              <button className="btn-edit" onClick={() => setEditing(true)}>Edytuj</button>
              <button className="btn-danger-ghost" onClick={() => setShowConfirm(true)}>Usuń</button>
            </div>
          </>
        )}
      </div>

      {editing ? (
        <div className="screen-content">
          <FormStep formData={formData} onChange={setFormData}
            onSave={handleSaveEdit} saving={saving} error={saveError} />
        </div>
      ) : (
        <>
        <div className="detail-content">
          {/* Zdjęcie kwadratowe */}
          <div className="detail-photo-wrap">
            {currentItem.photo_url ? (
              <img src={currentItem.photo_url} alt={currentItem.category ?? 'Ubranie'} className="detail-photo" />
            ) : (
              <div className="detail-photo-placeholder">🧥</div>
            )}
            {/* Metka w rogu zdjęcia */}
            {currentItem.label_photo_url && (
              <button className="detail-label-thumb" onClick={() => setLabelExpanded(true)}>
                <img src={currentItem.label_photo_url} alt="Metka" />
                <span>metka</span>
              </button>
            )}
          </div>

          {/* Powiększona metka */}
          {labelExpanded && (
            <div className="overlay" onClick={() => setLabelExpanded(false)}>
              <button className="label-close-btn" onClick={() => setLabelExpanded(false)}>✕</button>
              <img src={currentItem.label_photo_url} alt="Metka"
                className="label-fullscreen" onClick={e => e.stopPropagation()} />
            </div>
          )}

          {/* Nagłówek info */}
          <div className="detail-info-header">
            <div>
              <h2 className="detail-category">{currentItem.category ?? 'Ubranie'}</h2>
              <p className="detail-owner">{currentItem.owner}</p>
            </div>
          </div>

          {/* Opis AI */}
          {currentItem.ai_description && (
            <div className="detail-section">
              <p className="detail-section-label">Opis</p>
              <p className="detail-ai-desc">{currentItem.ai_description}</p>
            </div>
          )}

          {/* Metadane */}
          <div className="detail-section">
            <p className="detail-section-label">Szczegóły</p>
            <div className="detail-chips-row">
              {currentItem.material && (
                <span className="detail-chip chip-blue">{currentItem.material}</span>
              )}
              {(currentItem.season ?? []).map(s => (
                <span key={s} className="detail-chip chip-green">{s}</span>
              ))}
              {(currentItem.style_tags ?? []).map(t => (
                <span key={t} className="detail-chip chip-purple">{t}</span>
              ))}
              {(currentItem.colors ?? []).map(c => (
                <span key={c} className="detail-chip chip-neutral">{c}</span>
              ))}
            </div>
          </div>

          {/* Pielęgnacja */}
          <WashingInfo item={currentItem} />

          {/* Notatki */}
          {currentItem.notes && (
            <div className="detail-section">
              <p className="detail-section-label">Notatki</p>
              <p className="detail-notes">{currentItem.notes}</p>
            </div>
          )}

          {/* Pasuje do — ubrania z outfitów */}
          <div className="detail-section">
            <p className="detail-section-label">Pasuje do</p>
            {itemOutfits.length > 0 && (() => {
              const peers = [...new Map(
                itemOutfits.flatMap(o =>
                  (o.clothing_ids ?? [])
                    .filter(id => id !== currentItem.id)
                    .map(id => clothes.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => [c.id, c])
                )
              ).values()]
              return peers.length > 0 ? (
                <div className="outfit-peers-row">
                  {peers.map(c => (
                    <div key={c.id} className="outfit-peer-item" onClick={() => onItemClick?.(c)}>
                      <div className="outfit-peer-photo">
                        {c.photo_url
                          ? <img src={c.photo_url} alt={c.category ?? ''} />
                          : <span>🧥</span>}
                      </div>
                      <span className="outfit-peer-label">{c.category}</span>
                    </div>
                  ))}
                </div>
              ) : null
            })()}
            <button className="btn-outfit-add" onClick={() => setShowOutfitPicker(true)}>
              + Dodaj do outfitu
            </button>
          </div>

          {showOutfitPicker && (
            <OutfitPicker
              currentItem={currentItem}
              clothes={clothes}
              onSaved={(outfit) => { onOutfitAdded?.(outfit) }}
              onClose={() => setShowOutfitPicker(false)}
            />
          )}
        </div>

        {/* Status pills — poza scrollem, przyklejone do dołu ekranu */}
        <div className="detail-status-bar">
          {STATUS_CYCLE.map(s => (
            <button
              key={s}
              className={`status-pill ${currentItem.status === s ? 'active' : ''}`}
              style={{ '--pill-color': STATUS_COLORS[s] }}
              onClick={() => handleStatusChange(s)}
              disabled={statusLoading}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
