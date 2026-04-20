import { useState } from 'react'
import { analyzeClothing } from '../../services/groq'
import { GROQ_MODEL } from '../../services/groq'
import { addClothing, uploadPhoto } from '../../services/supabase'
import { DEV_EMAIL } from '../../config/constants'
import PhotoStep from './PhotoStep'
import AnalyzingStep from './AnalyzingStep'
import FormStep from './FormStep'

const STEPS = { PHOTO: 'photo', ANALYZING: 'analyzing', FORM: 'form' }

const EMPTY_FORM = {
  owner: '',
  category: '',
  colors: [],
  material: '',
  style_tags: [],
  season: [],
  washing_temp: null,
  washing_mode: '',
  drying: '',
  ironing: '',
  ai_description: '',
  notes: '',
  prompt_tags: [],
}

// embedding_ready = true jeśli AI wypełniło kluczowe pola do wyszukiwania
function calcEmbeddingReady(formData) {
  return !!(formData.category && formData.colors?.length && formData.washing_temp)
}

export default function AddClothing({ onClose, onSaved, user }) {
  const [step, setStep] = useState(STEPS.PHOTO)
  const [clothingFile, setClothingFile] = useState(null)
  const [labelFile, setLabelFile] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  // Tryb ręczny — dostępny tylko dla DEV_EMAIL
  const [manualMode, setManualMode] = useState(false)

  const isDevUser = user?.email === DEV_EMAIL

  async function handleAnalyze() {
    setStep(STEPS.ANALYZING)
    try {
      const aiResult = await analyzeClothing(clothingFile, labelFile)
      setFormData(prev => ({
        ...prev,
        category: aiResult.category ?? '',
        colors: Array.isArray(aiResult.colors) ? aiResult.colors : [],
        material: aiResult.material ?? '',
        style_tags: Array.isArray(aiResult.style_tags) ? aiResult.style_tags : [],
        season: Array.isArray(aiResult.season) ? aiResult.season : [],
        washing_temp: aiResult.washing_temp ?? null,
        washing_mode: aiResult.washing_mode ?? '',
        drying: aiResult.drying ?? '',
        ironing: aiResult.ironing ?? '',
        ai_description: aiResult.ai_description ?? '',
        prompt_tags: Array.isArray(aiResult.prompt_tags) ? aiResult.prompt_tags : [],
      }))
      setStep(STEPS.FORM)
    } catch (err) {
      console.error('Błąd analizy AI:', err)
      setFormData(EMPTY_FORM)
      setStep(STEPS.FORM)
    }
  }

  function handleSkipToManual() {
    setManualMode(true)
    setFormData(EMPTY_FORM)
    setStep(STEPS.FORM)
  }

  async function handleSave() {
    if (!clothingFile && !manualMode) return
    setSaving(true)
    setSaveError(null)
    try {
      let photoUrl = null
      let labelPhotoUrl = null

      if (clothingFile) photoUrl = await uploadPhoto(clothingFile, 'clothing')
      if (labelFile) labelPhotoUrl = await uploadPhoto(labelFile, 'labels')

      const newItem = await addClothing({
        ...formData,
        photo_url: photoUrl,
        label_photo_url: labelPhotoUrl,
        status: 'czyste',
        category: formData.category || null,
        material: formData.material || null,
        washing_mode: formData.washing_mode || null,
        drying: formData.drying || null,
        ironing: formData.ironing || null,
        notes: formData.notes || null,
        ai_description: formData.ai_description || null,
        prompt_tags: formData.prompt_tags?.length ? formData.prompt_tags : null,
        // Metadane AI — hardcoded confidence, model z stałej
        ai_model: manualMode ? null : GROQ_MODEL,
        ai_confidence: manualMode ? null : 0.85,
        embedding_ready: calcEmbeddingReady(formData),
      })

      onSaved(newItem)
      onClose()
    } catch (err) {
      setSaveError(`Błąd zapisu: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-clothing-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onClose}>← Wróć</button>
        {/* Tryb ręczny widoczny tylko dla konta deweloperskiego */}
        {isDevUser && step === STEPS.PHOTO && (
          <button className="btn-ghost small" onClick={handleSkipToManual}>
            Ręcznie
          </button>
        )}
      </div>

      <div className="screen-content">
        {step === STEPS.PHOTO && (
          <PhotoStep
            clothingFile={clothingFile}
            labelFile={labelFile}
            onClothingChange={setClothingFile}
            onLabelChange={setLabelFile}
            onAnalyze={handleAnalyze}
          />
        )}

        {step === STEPS.ANALYZING && <AnalyzingStep />}

        {step === STEPS.FORM && (
          <FormStep
            formData={formData}
            onChange={setFormData}
            onSave={handleSave}
            saving={saving}
            error={saveError}
          />
        )}
      </div>
    </div>
  )
}
