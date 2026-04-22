import { useState, useEffect } from 'react'
import { updateClothing, deleteClothing, deletePhoto } from '../../services/supabase'
import { analyzeClothing } from '../../services/groq'
import { STATUSES, STATUS_LABELS, STATUS_COLORS, DEV_EMAIL } from '../../config/constants'
import { logStatusChanged, logClothingDeleted, logError, logClothingViewed, logFavoriteToggled, logReanalysis } from '../../services/devLogger'
import WashingInfo from './WashingInfo'
import ConfirmDialog from '../UI/ConfirmDialog'
import FormStep from '../AddClothing/FormStep'
import OutfitPicker from '../Outfits/OutfitPicker'
import WizardHint from '../UI/WizardHint'

const STATUS_CYCLE = [STATUSES.CLEAN, STATUSES.USED, STATUSES.WASHING]

const STATUS_ICONS = {
  'czyste':   '/assets/status-clean.png',
  'używane':  '/assets/status-used.png',
  'w praniu': '/assets/status-washing.png',
}

const OWNER_AVATARS = {
  'Mikołaj': '/assets/avatar-mikolaj.png',
  'Emilka':  '/assets/avatar-emilka.png',
}

function itemToFormData(item) {
  return {
    owner: item.owner ?? '',
    name: item.name ?? '',
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
    clothing_layer: item.clothing_layer ?? '',
    brand: item.brand ?? '',
  }
}

function ColorDot({ color }) {
  return <span className="color-dot" title={color}>{color}</span>
}

export default function ClothingDetail({ item, onClose, onUpdated, onDeleted, onToggleFavorite, clothes = [], outfits = [], onOutfitAdded, onItemClick, devMode, userEmail }) {
  const [currentItem, setCurrentItem] = useState(item)
  const [isFavorite, setIsFavorite] = useState(item.is_favorite ?? false)
  const [favAnim, setFavAnim] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(itemToFormData(item))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [labelExpanded, setLabelExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showOutfitPicker, setShowOutfitPicker] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeMsg, setReanalyzeMsg] = useState(null)

  useEffect(() => { setIsFavorite(item.is_favorite ?? false) }, [item.is_favorite])

  useEffect(() => { logClothingViewed(item) }, [item.id])

  function handleToggleFavorite() {
    const next = !isFavorite
    setIsFavorite(next)
    setFavAnim(true)
    setTimeout(() => setFavAnim(false), 400)
    logFavoriteToggled(currentItem, next)
    onToggleFavorite?.(currentItem.id)
  }

  // Outfity zawierające to ubranie
  const itemOutfits = outfits.filter(o => (o.clothing_ids ?? []).includes(currentItem.id))

  async function handleStatusChange(newStatus) {
    if (newStatus === currentItem.status || statusLoading) return
    setStatusLoading(true)
    try {
      logStatusChanged(currentItem, currentItem.status, newStatus)
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
        clothing_layer: formData.clothing_layer || null,
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
      logClothingDeleted(currentItem)
      await deleteClothing(currentItem.id)
      if (currentItem.photo_url) deletePhoto(currentItem.photo_url).catch(console.warn)
      if (currentItem.label_photo_url) deletePhoto(currentItem.label_photo_url).catch(console.warn)
      onDeleted(currentItem.id)
      onClose()
    } catch (err) {
      logError(err, 'clothing_delete')
      console.error('Błąd usunięcia:', err)
    }
  }

  async function handleReanalyze() {
    if (!currentItem.photo_url || reanalyzing) return
    setReanalyzing(true)
    setReanalyzeMsg(null)
    const start = Date.now()
    try {
      const resp = await fetch(currentItem.photo_url)
      const blob = await resp.blob()
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      let labelFile = null
      if (currentItem.label_photo_url) {
        const labelResp = await fetch(currentItem.label_photo_url)
        const labelBlob = await labelResp.blob()
        labelFile = new File([labelBlob], 'label.jpg', { type: 'image/jpeg' })
      }

      const newData = await analyzeClothing(file, labelFile)
      const aiUpdates = {
        name: newData.name,
        category: newData.category,
        subcategory: newData.subcategory,
        colors: newData.colors,
        dominant_color: newData.dominant_color,
        secondary_colors: newData.secondary_colors,
        material: newData.material,
        pattern: newData.pattern,
        fit: newData.fit,
        neckline: newData.neckline,
        sleeve_length: newData.sleeve_length,
        length: newData.length,
        formality: newData.formality,
        formality_score: newData.formality_score,
        style_tags: newData.style_tags,
        season: newData.season,
        occasion: newData.occasion,
        clothing_layer: newData.clothing_layer,
        texture: newData.texture,
        warmth_level: newData.warmth_level,
        washing_temp: newData.washing_temp,
        washing_mode: newData.washing_mode,
        drying: newData.drying,
        ironing: newData.ironing,
        ai_description: newData.ai_description,
        prompt_tags: newData.prompt_tags,
      }
      const changed_fields = Object.keys(aiUpdates).filter(k => {
        const oldVal = JSON.stringify(currentItem[k])
        const newVal = JSON.stringify(aiUpdates[k])
        return oldVal !== newVal
      })
      await updateClothing(currentItem.id, aiUpdates)
      const updated = { ...currentItem, ...aiUpdates }
      setCurrentItem(updated)
      onUpdated?.(currentItem.id, aiUpdates)
      logReanalysis(currentItem, Date.now() - start, true, changed_fields)
      setReanalyzeMsg({ text: 'Zaktualizowano', ok: true })
    } catch (err) {
      logReanalysis(currentItem, Date.now() - start, false, [])
      console.error('Re-analiza błąd:', err)
      setReanalyzeMsg({ text: 'Błąd analizy', ok: false })
    } finally {
      setReanalyzing(false)
      setTimeout(() => setReanalyzeMsg(null), 3000)
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
              <button
                className={`favorite-btn${isFavorite ? ' favorite-btn--active' : ''}${favAnim ? ' favorite-btn--anim' : ''}`}
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <img src="/assets/star.png" className="pixel-icon" width="24" height="24"
                  style={{ borderRadius: '6px' }} alt="Ulubione" />
              </button>
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
              <div className="detail-photo-placeholder">
                <img src="/assets/no-photo.png" className="pixel-icon" width="96" height="96"
                  style={{ borderRadius: '12px', opacity: 0.4 }} />
              </div>
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
              <div className="detail-title-row">
                <span className="detail-category-chip">{currentItem.category ?? 'ubranie'}</span>
              </div>
              <h2 className="detail-name">
                {(n => n ? n.charAt(0).toUpperCase() + n.slice(1) : null)(currentItem.name) || currentItem.category || 'Ubranie'}
              </h2>
              {currentItem.brand && (
                <div className="detail-brand">
                  <img src="/assets/label-tag.png" className="pixel-icon" width="14" height="14"
                    style={{ borderRadius: '3px', marginRight: '6px' }} alt="" />
                  <span>{currentItem.brand}</span>
                </div>
              )}
              <p className="detail-owner" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {OWNER_AVATARS[currentItem.owner] && (
                  <img src={OWNER_AVATARS[currentItem.owner]} className="pixel-icon" width="20" height="20"
                    style={{ borderRadius: '5px' }} alt={currentItem.owner} />
                )}
                {currentItem.owner}
              </p>
            </div>
          </div>

          {/* Opis AI */}
          {currentItem.ai_description && (
            <div className="detail-section">
              <p className="detail-section-label">Opis</p>
              <p className="detail-ai-desc">{currentItem.ai_description}</p>
            </div>
          )}

          {/* Sezony — osobna sekcja z ikonami */}
          {(currentItem.season ?? []).length > 0 && (() => {
            const SEASON_ICONS = { lato: '/assets/Slonce.png', summer: '/assets/Slonce.png', wiosna: '/assets/spring.png', spring: '/assets/spring.png', zima: '/assets/snieg.png', winter: '/assets/snieg.png', jesień: '/assets/season-autumn.png', autumn: '/assets/season-autumn.png', fall: '/assets/season-autumn.png' }
            return (
              <div className="detail-section">
                <p className="detail-section-label">Sezon</p>
                <div className="detail-season-row">
                  {(currentItem.season ?? []).map(s => (
                    <div key={s} className="detail-season-badge">
                      {SEASON_ICONS[s] && <img src={SEASON_ICONS[s]} width="44" height="44" style={{ imageRendering: 'pixelated' }} />}
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Metadane */}
          <div className="detail-section">
            <p className="detail-section-label">Szczegóły</p>
            <div className="detail-chips-row">
              {currentItem.material && (
                <span className="detail-chip chip-blue">{currentItem.material}</span>
              )}
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

          {/* AI Debug panel — tylko dev mode */}
          {userEmail === DEV_EMAIL && devMode && (
            <div className="ai-debug-panel">
              <button className="ai-debug-toggle" onClick={() => setDebugOpen(v => !v)}>
                {debugOpen ? '▲' : '▼'} <img src="/assets/dev-wrench.png" className="pixel-icon" width="16" height="16" alt="" style={{margin: '0 4px', verticalAlign: 'middle'}} /> AI Debug
              </button>
              {debugOpen && (
                <>
                <div className="ai-debug-reanalyze">
                  <button
                    className="dev-tool-btn"
                    onClick={handleReanalyze}
                    disabled={reanalyzing || !currentItem.photo_url}
                  >
                    {reanalyzing ? 'Analizuję...' : <><img src="/assets/dev-refresh.png" className="pixel-icon" width="16" height="16" alt="" style={{marginRight: '6px', verticalAlign: 'middle'}} />Re-analizuj to ubranie</>}
                  </button>
                  {reanalyzeMsg && (
                    <span className="debug-reanalyze-msg">
                      {reanalyzeMsg.ok
                        ? <img src="/assets/checkmark.png" className="pixel-icon" width="16" height="16" alt="" />
                        : '❌'
                      } {reanalyzeMsg.text}
                    </span>
                  )}
                </div>
                <div className="ai-debug-content">
                  {[
                    ['subcategory', currentItem.subcategory],
                    ['clothing_layer', currentItem.clothing_layer],
                    ['warmth_level', currentItem.warmth_level],
                    ['formality_score', currentItem.formality_score],
                    ['texture', currentItem.texture],
                    ['occasion', Array.isArray(currentItem.occasion) ? currentItem.occasion.join(', ') : currentItem.occasion],
                    ['brand', currentItem.brand],
                    ['ai_model', currentItem.ai_model],
                    ['ai_confidence', currentItem.ai_confidence],
                    ['embedding_ready', String(currentItem.embedding_ready ?? false)],
                  ].map(([k, v]) => (
                    <div key={k} className="debug-row">
                      <span className="debug-key">{k}</span>
                      <span className="debug-val">{v ?? <em>null</em>}</span>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
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
              {STATUS_ICONS[s] && (
                <img src={STATUS_ICONS[s]} className="pixel-icon" width="20" height="20"
                  style={{ borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }} alt={s} />
              )}
              {STATUS_LABELS[s]}
            </button>
          ))}
          <WizardHint hintKey="clothing-status" />
        </div>
        </>
      )}
    </div>
  )
}
