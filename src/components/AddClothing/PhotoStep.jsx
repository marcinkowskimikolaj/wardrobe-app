import { useRef } from 'react'

export default function PhotoStep({ clothingFile, labelFile, onClothingChange, onLabelChange, onAnalyze }) {
  const clothingInputRef = useRef(null)
  const labelInputRef = useRef(null)

  function handleFileChange(e, setter) {
    const file = e.target.files?.[0]
    if (file) setter(file)
    e.target.value = ''
  }

  const clothingPreview = clothingFile ? URL.createObjectURL(clothingFile) : null
  const labelPreview = labelFile ? URL.createObjectURL(labelFile) : null

  return (
    <div className="photo-step">
      <div className="step-header">
        <h2 className="step-title">Nowe ubranie</h2>
        <p className="step-subtitle">Zrób zdjęcie, AI zrobi resztę</p>
      </div>

      {/* Główna strefa — aspect-ratio 4/3, max 50vh */}
      <div
        className={`photo-zone main-zone ${clothingFile ? 'has-photo' : ''}`}
        onClick={() => clothingInputRef.current?.click()}
      >
        {clothingPreview ? (
          <>
            <img src={clothingPreview} alt="Podgląd ubrania" className="zone-preview" />
            <div className="zone-overlay-edit"><span>Zmień zdjęcie</span></div>
          </>
        ) : (
          <div className="zone-empty">
            <div className="zone-icon-wrap">
              <img src="/assets/camera.png" className="pixel-icon" width="48" height="48"
                style={{ borderRadius: '10px', opacity: 0.6 }} alt="Aparat" />
            </div>
            <p className="zone-label">Zrób zdjęcie ubrania</p>
            <p className="zone-hint">lub wybierz z galerii</p>
          </div>
        )}
        <input ref={clothingInputRef} type="file" accept="image/*"
          onChange={e => handleFileChange(e, onClothingChange)} hidden />
      </div>

      {/* Strefa metki */}
      <div
        className={`photo-zone label-zone ${labelFile ? 'has-photo' : ''}`}
        onClick={() => labelInputRef.current?.click()}
      >
        {labelPreview ? (
          <>
            <img src={labelPreview} alt="Podgląd metki" className="zone-preview" />
            <div className="zone-overlay-edit"><span>Zmień metkę</span></div>
          </>
        ) : (
          <div className="zone-empty horizontal">
            <img src="/assets/label-tag.png" className="pixel-icon zone-icon-sm" width="32" height="32"
              style={{ borderRadius: '8px', opacity: 0.7 }} alt="Metka" />
            <div>
              <p className="zone-label">Dodaj zdjęcie metki</p>
              <p className="zone-hint">opcjonalne — dla dokładniejszego prania</p>
            </div>
          </div>
        )}
        <input ref={labelInputRef} type="file" accept="image/*"
          onChange={e => handleFileChange(e, onLabelChange)} hidden />
      </div>

      {labelFile && (
        <button className="btn-ghost-sm" onClick={() => onLabelChange(null)}>Usuń metkę</button>
      )}

      {/* Sticky footer z przyciskiem */}
      <div className="photo-step-footer">
        <button className="btn-primary" onClick={onAnalyze} disabled={!clothingFile}>
          <img src="/assets/Rozdzka.png" className="pixel-icon" width="22" height="22" style={{ borderRadius: '4px', marginRight: '8px' }} />
          Analizuj z AI
        </button>
      </div>
    </div>
  )
}
