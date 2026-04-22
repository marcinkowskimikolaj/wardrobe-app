import { useState, useRef } from 'react'
import { analyzeOutfit } from '../../services/groq'
import { matchItemToWardrobe } from '../../services/styleScanner'
import { addOutfit } from '../../services/supabase'
import { logScannerUsed, logOutfitSaved, logError } from '../../services/devLogger'
import AnalyzingStep from '../AddClothing/AnalyzingStep'
import AddClothing from '../AddClothing/AddClothing'

const STEPS = { PHOTO: 'photo', ANALYZING: 'analyzing', RESULTS: 'results' }

function ScannerPhotoStep({ file, onFileChange, onAnalyze }) {
  const inputRef = useRef(null)
  const previewUrl = file ? URL.createObjectURL(file) : null

  return (
    <div className="scanner-photo-step">
      <h2 className="scanner-title">Skaner Stylizacji</h2>
      <p className="scanner-subtitle">
        Zrób zdjęcie swojej stylizacji — całej lub fragmentu
      </p>

      <div className="scanner-photo-zone" onClick={() => inputRef.current?.click()}>
        {previewUrl ? (
          <>
            <img src={previewUrl} className="scanner-photo-preview" alt="Stylizacja" />
            <div className="scanner-photo-reshot">Dotknij aby zmienić</div>
          </>
        ) : (
          <div className="scanner-photo-empty">
            <img src="/assets/scan-photo.png" className="pixel-icon scanner-photo-icon" width="48" height="48"
              style={{ borderRadius: '10px', opacity: 0.6 }} alt="Zdjęcie" />
            <p>Dotknij aby dodać zdjęcie</p>
            <span className="scanner-photo-hint">lub wybierz z galerii</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <button className="btn-primary" onClick={onAnalyze} disabled={!file}>
        Analizuj stylizację ✨
      </button>
    </div>
  )
}

function MatchCard({ item, selected, onToggle }) {
  return (
    <div className={`scanner-match-card ${selected ? 'selected' : ''}`} onClick={onToggle}>
      <div className="scanner-match-photo">
        {item.photo_url
          ? <img src={item.photo_url} alt={item.category ?? ''} />
          : <span>🧥</span>}
        {selected && <div className="scanner-match-check">✓</div>}
      </div>
      <span className="scanner-match-label">{item.category ?? '—'}</span>
      <span className="scanner-match-score">{item._score}%</span>
    </div>
  )
}

function ScannerResults({ scanResult, itemsWithMatches, selected, skippedItems, onToggle, onToggleSkip, onSave, onAddClick }) {
  const matchedCount = itemsWithMatches.filter(({ matches }, idx) =>
    !skippedItems.has(idx) && matches.some(m => selected.has(m.id))
  ).length
  const totalCount = itemsWithMatches.length

  return (
    <div className="scanner-results">
      <div className="scanner-results-header">
        <p className="scanner-overall-style">{scanResult.overall_style}</p>
        <p className="scanner-occasion">
          {scanResult.occasion} · {scanResult.season_recommendation}
        </p>
      </div>

      {itemsWithMatches.map(({ detected, matches }, idx) => {
        const skipped = skippedItems.has(idx)
        return (
          <div
            key={idx}
            className="scanner-item-section"
            style={{ '--index': idx, opacity: skipped ? 0.4 : 1 }}
          >
            <div className="scanner-item-header">
              <span className="scanner-item-title" style={{ textDecoration: skipped ? 'line-through' : 'none' }}>
                👕 {detected.item_type}
                {detected.formality ? ` — ${detected.formality}` : ''}
                {detected.pattern && detected.pattern !== 'jednolity' ? `, ${detected.pattern}` : ''}
              </span>
              <button
                className={`scanner-skip-btn${skipped ? ' skipped' : ''}`}
                onClick={() => onToggleSkip(idx)}
              >
                {skipped ? '↩ Przywróć' : 'Pomiń ✕'}
              </button>
            </div>

            {!skipped && (
              matches.length > 0 ? (
                <>
                  <p className="scanner-match-hint">Masz to w szafie:</p>
                  <div className="scanner-match-grid">
                    {matches.map(m => (
                      <MatchCard
                        key={m.id}
                        item={m}
                        selected={selected.has(m.id)}
                        onToggle={() => onToggle(m.id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="scanner-no-match">
                  <span>Nie masz tego w szafie</span>
                  <button className="btn-ghost small" onClick={() => onAddClick(detected.item_type)}>
                    + Dodaj {detected.item_type}
                  </button>
                </div>
              )
            )}
          </div>
        )
      })}

      <div className="scanner-bottom-bar">
        <div className="scanner-summary">
          Dopasowano {matchedCount}/{totalCount} elementów
        </div>
        <button
          className="btn-primary scanner-save-btn"
          onClick={onSave}
          disabled={selected.size < 1}
        >
          <img src="/assets/save.png" className="pixel-icon" width="18" height="18"
            style={{ borderRadius: '4px', marginRight: '8px' }} alt="" />
          Zapisz jako outfit ({selected.size} szt.)
        </button>
      </div>
    </div>
  )
}

export default function StyleScanner({ clothes, onSaved, onClose, onAddClick, user, onReload }) {
  const [step, setStep] = useState(STEPS.PHOTO)
  const [photoFile, setPhotoFile] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [skippedItems, setSkippedItems] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [outfitName, setOutfitName] = useState('')
  const [error, setError] = useState(null)
  const [showAddClothing, setShowAddClothing] = useState(false)

  const itemsWithMatches = scanResult
    ? scanResult.detected_items.map(di => ({
        detected: di,
        matches: matchItemToWardrobe(di, clothes),
      }))
    : []

  async function handleAnalyze() {
    setStep(STEPS.ANALYZING)
    setError(null)
    const start = Date.now()
    try {
      const result = await analyzeOutfit(photoFile)
      const matchedCount = result.detected_items.reduce((acc, di) => {
        return acc + (matchItemToWardrobe(di, clothes).length > 0 ? 1 : 0)
      }, 0)
      logScannerUsed(Date.now() - start, true, result.detected_items.length, matchedCount, 0, false)
      setScanResult(result)
      setSelected(new Set())
      setSkippedItems(new Set())
      setStep(STEPS.RESULTS)
    } catch (err) {
      logScannerUsed(Date.now() - start, false, 0, 0, 0, false)
      logError(err, 'scanner_analyze')
      console.error('Błąd skanowania:', err)
      setError('Nie udało się przeanalizować zdjęcia. Spróbuj ponownie.')
      setStep(STEPS.PHOTO)
    }
  }

  function toggleItem(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSkip(idx) {
    setSkippedItems(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
        const matchIds = itemsWithMatches[idx]?.matches.map(m => m.id) ?? []
        setSelected(prev2 => {
          const s = new Set(prev2)
          matchIds.forEach(id => s.delete(id))
          return s
        })
      }
      return next
    })
  }

  async function handleConfirmSave() {
    if (selected.size < 1) return
    setSaving(true)
    try {
      const selectedClothes = clothes.filter(c => selected.has(c.id))
      const owner = selectedClothes[0]?.owner ?? null
      const skippedNote = skippedItems.size > 0
        ? `pominięto ${skippedItems.size} elementów`
        : 'kompletna stylizacja'
      const outfit = await addOutfit({
        name: outfitName.trim() || 'Stylizacja ze skanera',
        clothing_ids: [...selected],
        owner,
        notes: scanResult
          ? `${scanResult.overall_style} · ${scanResult.occasion} · ${skippedNote}`
          : null,
      })
      const totalDetected = itemsWithMatches.length
      const matchedCount = itemsWithMatches.filter(({ matches }, idx) =>
        !skippedItems.has(idx) && matches.some(m => selected.has(m.id))
      ).length
      const matchRate = totalDetected > 0 ? Math.round((matchedCount / totalDetected) * 100) : 0
      logOutfitSaved(outfit, 'scanner', matchRate)
      onSaved(outfit)
      onClose()
    } catch (err) {
      logError(err, 'scanner_save_outfit')
      console.error('Błąd zapisu outfitu:', err)
    } finally {
      setSaving(false)
      setShowNameModal(false)
    }
  }

  return (
    <div className="scanner-overlay screen-slide-enter">
      <div className="screen-header">
        <button className="btn-back" onClick={onClose}>← Wróć</button>
        <span className="header-title">Skaner Stylizacji</span>
      </div>

      <div className="scanner-content">
        {step === STEPS.PHOTO && (
          <ScannerPhotoStep
            file={photoFile}
            onFileChange={setPhotoFile}
            onAnalyze={handleAnalyze}
          />
        )}

        {step === STEPS.ANALYZING && <AnalyzingStep />}

        {step === STEPS.RESULTS && scanResult && (
          <ScannerResults
            scanResult={scanResult}
            itemsWithMatches={itemsWithMatches}
            selected={selected}
            skippedItems={skippedItems}
            onToggle={toggleItem}
            onToggleSkip={toggleSkip}
            onSave={() => setShowNameModal(true)}
            onAddClick={() => setShowAddClothing(true)}
          />
        )}

        {error && (
          <p className="error-msg" style={{ margin: '1rem 1.25rem' }}>{error}</p>
        )}
      </div>

      {showAddClothing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <AddClothing
            user={user}
            onClose={() => setShowAddClothing(false)}
            onSaved={() => { setShowAddClothing(false); onReload?.() }}
          />
        </div>
      )}

      {showNameModal && (
        <div className="overlay" onClick={() => !saving && setShowNameModal(false)}>
          <div className="outfit-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="outfit-picker-header">
              <h3>Zapisz outfit</h3>
              <button className="btn-back" onClick={() => setShowNameModal(false)}>✕</button>
            </div>
            <input
              className="outfit-name-input"
              type="text"
              placeholder="Nazwa outfitu (opcjonalne)"
              value={outfitName}
              onChange={e => setOutfitName(e.target.value)}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={handleConfirmSave}
              disabled={saving}
              style={{ marginTop: '1rem' }}
            >
              {saving ? 'Zapisuję...' : `Zapisz (${selected.size} elementy)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
