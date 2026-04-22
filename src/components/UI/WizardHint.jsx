import { useState } from 'react'
import { createPortal } from 'react-dom'

const HINTS = {
  'gallery-filters': 'Filtruj szafę po właścicielu, kolorze, marce, sezonie i okazji. Możesz łączyć filtry dowolnie.',
  'gallery-search': 'Wpisz nazwę ubrania, kolor lub markę. Możesz też używać chipów do szybkiego filtrowania.',
  'clothing-status': 'Czyste — gotowe do założenia. Używane — założone, wymaga prania. W praniu — aktualnie w pralce.',
  'clothing-layer': 'Warstwa mówi mi gdzie dane ubranie pasuje w stylizacji. Koszula to pierwsza warstwa, bluza środkowa, kurtka zewnętrzna.',
  'outfits-scanner': 'Zrób zdjęcie stylizacji z Instagrama lub ze sklepu, a ja dopasuje podobne rzeczy z Twojej własnej szafy.',
  'laundry-loads': 'Grupuję brudne ubrania w optymalne wsady — podobna temperatura i tryb, żeby nic nie zniszczyć.',
  'chat-suggestions': 'Szybkie propozycje popularnych pytań. Możesz też napisać cokolwiek — sprawdzam pogodę i doradzam na bieżąco.',
  'add-ai': 'AI analizuje zdjęcie ubrania i automatycznie rozpoznaje kategorię, kolor, materiał i instrukcje prania. Możesz dodać też zdjęcie metki dla dokładniejszych danych.',
}

export default function WizardHint({ hintKey }) {
  const [visible, setVisible] = useState(false)
  const hint = HINTS[hintKey]
  if (!hint) return null

  const popup = visible && createPortal(
    <>
      <div
        className="wizard-hint-backdrop"
        onClick={e => { e.stopPropagation(); setVisible(false) }}
      />
      <div
        className="wizard-hint-popup"
        onClick={e => e.stopPropagation()}
      >
        <img
          src="/assets/wizard-speaking.png"
          alt=""
          className="wizard-hint-avatar"
        />
        <p className="wizard-hint-text">{hint}</p>
        <button
          className="wizard-hint-close"
          onClick={() => setVisible(false)}
          aria-label="Zamknij"
        >
          <img src="/assets/checkmark.png" width="26" height="26"
            style={{ borderRadius: '6px', imageRendering: 'pixelated' }} alt="" />
        </button>
      </div>
    </>,
    document.body
  )

  return (
    <div className="wizard-hint-wrapper">
      <button
        className="wizard-hint-btn"
        onClick={e => { e.stopPropagation(); setVisible(v => !v) }}
        aria-label="Pomoc"
      >
        ?
      </button>
      {popup}
    </div>
  )
}
