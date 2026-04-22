import { useState, useEffect } from 'react'
import { markTourCompleted } from '../../services/supabase'

const TOUR_STEPS = [
  {
    id: 'welcome',
    screen: 'gallery',
    image: '/assets/szafir-welcome.png',
    titleIcon: null,
    title: 'Cześć, {name}!',
    message: 'Jestem SZAFir — Twój osobisty stylista i opiekun szafy. Pozwól, że w 30 sekund oprowadzę Cię po aplikacji. Dotknij ekranu, żeby przejść dalej.',
    highlightSelector: null,
  },
  {
    id: 'gallery',
    screen: 'gallery',
    image: '/assets/szafir-gallery.png',
    titleIcon: '/assets/Wieszak.png',
    title: 'Twoja szafa',
    message: 'Tu mieszkają wszystkie Twoje ubrania. Możesz filtrować po kolorze, marce i sezonie. Dotknij dowolnego ubrania, żeby zobaczyć szczegóły i zmienić status.',
    highlightSelector: '.bottom-nav [data-tab="gallery"]',
  },
  {
    id: 'add',
    screen: 'gallery',
    image: '/assets/szafir-add.png',
    titleIcon: '/assets/plus.png',
    title: 'Dodaj ubranie',
    message: 'Ten fioletowy przycisk to magia — zrób zdjęcie ubrania, a ja automatycznie rozpoznam co to jest, z jakiego materiału i jak prać. Wystarczy jedno zdjęcie.',
    highlightSelector: '.bottom-nav [data-tab="add"]',
  },
  {
    id: 'outfits',
    screen: 'outfits',
    image: '/assets/szafir-outfits.png',
    titleIcon: '/assets/outfit.png',
    title: 'Stylizacje',
    message: 'Tu zapisujesz gotowe zestawy ubrań. Możesz też użyć Skanera Stylizacji — zrób zdjęcie outfitu z internetu lub z Instagrama, a ja dopasuje podobne rzeczy z Twojej własnej szafy.',
    highlightSelector: '.bottom-nav [data-tab="outfits"]',
  },
  {
    id: 'laundry',
    screen: 'laundry',
    image: '/assets/szafir-laundry.png',
    titleIcon: '/assets/Pralka.png',
    title: 'Pranie',
    message: 'Gdy oznaczysz ubranie jako brudne, trafi tutaj. Powiem Ci jak posegregować pranie żeby nic nie zniszczyć i nie popsuć kolorów.',
    highlightSelector: '.bottom-nav [data-tab="laundry"]',
  },
  {
    id: 'chat',
    screen: 'chat',
    image: '/assets/szafir-chat.png',
    titleIcon: '/assets/Rozdzka.png',
    title: 'Porozmawiaj ze mną',
    message: 'To moje ulubione miejsce. Zapytaj o moją radę — co założyć na spotkanie, co pasuje do pogody, czego brakuje w szafie. Jestem tu dla Ciebie.',
    highlightSelector: '.bottom-nav [data-tab="chat"]',
  },
  {
    id: 'finish',
    screen: 'gallery',
    image: '/assets/szafir-welcome.png',
    titleIcon: '/assets/checkmark.png',
    title: 'Gotowe, {name}!',
    message: 'Twoja szafa czeka na ubrania. Im więcej wiem o Twojej garderobie, tym lepiej doradzam. Możesz wrócić do tego toru klikając swój avatar w prawym górnym rogu.',
    highlightSelector: null,
  },
]

export default function WizardTour({ user, ownerName, onComplete, onNavigate }) {
  const [step, setStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const currentStep = TOUR_STEPS[step]
  const interpolate = (text) => text?.replace('{name}', ownerName || '')

  useEffect(() => {
    const sel = currentStep.highlightSelector
    if (!sel) return
    const el = document.querySelector(sel)
    if (el) el.classList.add('tour-highlighted')
    return () => {
      if (el) el.classList.remove('tour-highlighted')
    }
  }, [step])

  const handleTap = () => {
    if (step < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[step + 1]
      if (nextStep.screen !== currentStep.screen) {
        onNavigate(nextStep.screen)
      }
      setStep(s => s + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsExiting(true)
    if (user) await markTourCompleted(user.id)
    setTimeout(onComplete, 300)
  }

  return (
    <div
      className={`tour-overlay${isExiting ? ' tour-exiting' : ''}`}
      onClick={handleTap}
    >
      <div className="tour-backdrop" />

      <button
        className="tour-skip"
        onClick={e => { e.stopPropagation(); handleComplete() }}
      >
        Pomiń
      </button>

      <div className="tour-card" onClick={e => e.stopPropagation()}>
        <img
          src={currentStep.image}
          alt="SZAFir"
          className="tour-szafir-img"
        />
        <div className="tour-content">
          <div className="tour-title">
            {currentStep.titleIcon && (
              <img
                src={currentStep.titleIcon}
                width="18"
                height="18"
                className="pixel-icon"
                style={{ marginRight: '6px', verticalAlign: 'middle' }}
                alt=""
              />
            )}
            {interpolate(currentStep.title)}
          </div>
          <p className="tour-message">{interpolate(currentStep.message)}</p>
          <div className="tour-tap-hint">
            {step < TOUR_STEPS.length - 1 ? 'Dotknij gdziekolwiek, żeby przejść' : 'Dotknij żeby zamknąć'}
          </div>
        </div>
      </div>
    </div>
  )
}
