import { OWNERS, CATEGORIES, SEASONS, WASHING_MODES, DRYING_OPTIONS, IRONING_OPTIONS } from '../../config/constants'

// Tagi z możliwością usunięcia (pill + ×)
function PillTagInput({ label, value = [], onChange, placeholder }) {
  function remove(tag) { onChange(value.filter(t => t !== tag)) }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
      e.preventDefault()
      const newTag = e.target.value.trim().replace(/,$/, '')
      if (newTag && !value.includes(newTag)) onChange([...value, newTag])
      e.target.value = ''
    }
  }

  function handleBlur(e) {
    const v = e.target.value.trim()
    if (v && !value.includes(v)) { onChange([...value, v]); e.target.value = '' }
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="pill-tag-input">
        {value.map(tag => (
          <span key={tag} className="pill-tag">
            {tag}
            <button type="button" className="pill-remove" onClick={() => remove(tag)}>×</button>
          </span>
        ))}
        <input
          type="text"
          className="pill-input-field"
          placeholder={value.length ? '' : placeholder}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}

// Przyciski toggle — wiele
function MultiSelect({ options, value = [], onChange, label }) {
  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="toggle-wrap">
        {options.map(opt => (
          <button key={opt} type="button"
            className={`toggle-chip ${value.includes(opt) ? 'active' : ''}`}
            onClick={() => toggle(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// Przyciski toggle — jeden
function SingleSelect({ options, value, onChange, label }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="toggle-wrap">
        {options.map(opt => (
          <button key={opt} type="button"
            className={`toggle-chip ${value === opt ? 'active' : ''}`}
            onClick={() => onChange(opt === value ? '' : opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title }) {
  return <p className="form-section-header">{title}</p>
}

export default function FormStep({ formData, onChange, onSave, saving, error }) {
  function field(key) { return (val) => onChange({ ...formData, [key]: val }) }

  return (
    <div className="form-step">
      <h2 className="step-title">Sprawdź i zapisz</h2>

      {/* ── WŁAŚCICIEL ─────────────────────────── */}
      <div className="form-group owner-group">
        {OWNERS.map(owner => (
          <button key={owner} type="button"
            className={`owner-pill ${formData.owner === owner ? 'active' : ''}`}
            onClick={() => field('owner')(owner)}>
            {owner}
          </button>
        ))}
      </div>

      {/* ── PODSTAWOWE ─────────────────────────── */}
      <SectionHeader title="Podstawowe" />

      <div className="form-group">
        <label>Opis</label>
        <textarea value={formData.ai_description ?? ''} rows={3}
          onChange={e => field('ai_description')(e.target.value)}
          placeholder="Opis ubrania..." />
      </div>

      <SingleSelect label="Kategoria" options={CATEGORIES}
        value={formData.category ?? ''} onChange={field('category')} />

      <PillTagInput label="Kolory" value={formData.colors ?? []}
        onChange={field('colors')} placeholder="Wpisz kolor i Enter" />

      <div className="form-group">
        <label>Materiał</label>
        <input type="text" value={formData.material ?? ''}
          onChange={e => field('material')(e.target.value)}
          placeholder="np. bawełna 100%" />
      </div>

      {/* ── STYL ───────────────────────────────── */}
      <SectionHeader title="Styl" />

      <PillTagInput label="Tagi stylu" value={formData.style_tags ?? []}
        onChange={field('style_tags')} placeholder="np. casual, Enter" />

      <MultiSelect label="Sezon" options={SEASONS}
        value={formData.season ?? []} onChange={field('season')} />

      {/* ── PIELĘGNACJA ────────────────────────── */}
      <SectionHeader title="Pielęgnacja" />

      <div className="form-group">
        <label>Temperatura prania (°C)</label>
        <input type="number" value={formData.washing_temp ?? ''}
          onChange={e => field('washing_temp')(e.target.value ? Number(e.target.value) : null)}
          placeholder="np. 30" min={0} max={95} />
      </div>

      <SingleSelect label="Tryb prania" options={WASHING_MODES}
        value={formData.washing_mode ?? ''} onChange={field('washing_mode')} />

      <SingleSelect label="Suszenie" options={DRYING_OPTIONS}
        value={formData.drying ?? ''} onChange={field('drying')} />

      <SingleSelect label="Prasowanie" options={IRONING_OPTIONS}
        value={formData.ironing ?? ''} onChange={field('ironing')} />

      {/* ── NOTATKI ────────────────────────────── */}
      <SectionHeader title="Notatki" />

      <div className="form-group">
        <textarea value={formData.notes ?? ''} rows={3}
          onChange={e => field('notes')(e.target.value)}
          placeholder="Dodatkowe informacje..." />
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button className="btn-primary" onClick={onSave}
        disabled={saving || !formData.owner} style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
        {saving ? 'Zapisuję...' : 'Zapisz ubranie'}
      </button>
    </div>
  )
}
