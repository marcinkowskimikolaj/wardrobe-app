import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useClothes } from './hooks/useClothes'
import { useOutfits } from './hooks/useOutfits'
import { getOwnerFromEmail } from './config/constants'
import { logNavigation } from './services/devLogger'
import { hasCompletedTour } from './services/supabase'
import Login from './components/Auth/Login'
import Gallery from './components/Gallery/Gallery'
import AddClothing from './components/AddClothing/AddClothing'
import ClothingDetail from './components/ClothingDetail/ClothingDetail'
import OutfitsScreen from './components/Outfits/OutfitsScreen'
import LaundryScreen from './components/Laundry/LaundryScreen'
import ChatScreen from './components/Chat/ChatScreen'
import BottomNav from './components/UI/BottomNav'
import LoadingSpinner from './components/UI/LoadingSpinner'
import WizardTour from './components/UI/WizardTour'

const SCREENS = { GALLERY: 'gallery', ADD: 'add', DETAIL: 'detail', OUTFITS: 'outfits', LAUNDRY: 'laundry', CHAT: 'chat' }
const TAB_INDEX = { [SCREENS.GALLERY]: 0, [SCREENS.OUTFITS]: 1, [SCREENS.LAUNDRY]: 2, [SCREENS.CHAT]: 3 }

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const ownerName = user ? (getOwnerFromEmail(user.email) ?? null) : null
  const { clothes, loading: clothesLoading, error, reload, updateLocalItem, removeLocalItem, toggleFavorite } = useClothes()
  const { outfits, loading: outfitsLoading, error: outfitsError, addLocal: addOutfitLocal, updateLocal: updateOutfitLocal, removeLocal: removeOutfitLocal } = useOutfits()
  const [screen, setScreen] = useState(SCREENS.GALLERY)
  const [selectedItem, setSelectedItem] = useState(null)
  const [exitingDetail, setExitingDetail] = useState(false)
  const [slideDir, setSlideDir] = useState('right')
  const [exitingTab, setExitingTab] = useState(null)
  const [devMode, setDevMode] = useState(localStorage.getItem('dev_mode') === 'true')
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (user) {
      hasCompletedTour(user.id).then(completed => {
        if (!completed) setShowTour(true)
      })
    }
  }, [user])

  const handleRestartTour = () => setShowTour(true)

  const toggleDevMode = () => {
    const newVal = !devMode
    setDevMode(newVal)
    localStorage.setItem('dev_mode', String(newVal))
  }

  if (authLoading) return <LoadingSpinner text="Ładowanie..." />
  if (!user) return <Login />

  function openDetail(item) {
    setSelectedItem(item)
    setScreen(SCREENS.DETAIL)
  }

  function backToGallery() {
    if (screen === SCREENS.DETAIL && !exitingDetail) {
      setExitingDetail(true)
      setTimeout(() => {
        setScreen(SCREENS.GALLERY)
        setSelectedItem(null)
        setExitingDetail(false)
      }, 260)
    } else {
      setScreen(SCREENS.GALLERY)
      setSelectedItem(null)
    }
  }

  function navigateTo(newScreen) {
    const oldIdx = TAB_INDEX[screen] ?? 0
    const newIdx = TAB_INDEX[newScreen] ?? 0
    setSlideDir(newIdx >= oldIdx ? 'right' : 'left')
    if (newScreen === SCREENS.GALLERY && screen !== SCREENS.GALLERY) {
      setExitingTab(screen)
      setTimeout(() => setExitingTab(null), 260)
    }
    logNavigation(screen, newScreen)
    setScreen(newScreen)
  }

  const showBottomNav = screen !== SCREENS.ADD && screen !== SCREENS.DETAIL && !exitingDetail
  const navScreen = screen === SCREENS.OUTFITS ? 'outfits'
    : screen === SCREENS.LAUNDRY ? 'laundry'
    : screen === SCREENS.CHAT ? 'chat'
    : 'gallery'
  const slideClass = slideDir === 'right' ? 'screen-enter-right' : 'screen-enter-left'

  return (
    <div className="app">
      {/* Gallery — zawsze wyrenderowana jako warstwa bazowa */}
      <Gallery
        clothes={clothes}
        loading={clothesLoading}
        error={error}
        onItemClick={openDetail}
        ownerName={ownerName}
        user={user}
        devMode={devMode}
        toggleDevMode={toggleDevMode}
        onReload={reload}
        onRestartTour={handleRestartTour}
      />

      {/* Detail — overlay z animacją wejścia i wyjścia */}
      {(screen === SCREENS.DETAIL || exitingDetail) && selectedItem && (
        <div className={`screen-overlay ${exitingDetail ? 'screen-slide-exit' : 'screen-slide-enter'}`}>
          <ClothingDetail
            key={selectedItem.id}
            item={selectedItem}
            clothes={clothes}
            outfits={outfits}
            onClose={backToGallery}
            onUpdated={(id, updates) => { updateLocalItem(id, updates); setSelectedItem(prev => ({ ...prev, ...updates })) }}
            onDeleted={(id) => { removeLocalItem(id); backToGallery() }}
            onToggleFavorite={(id) => { toggleFavorite(id); setSelectedItem(prev => prev?.id === id ? { ...prev, is_favorite: !(prev.is_favorite ?? false) } : prev) }}
            onOutfitAdded={(outfit) => addOutfitLocal(outfit)}
            onItemClick={openDetail}
            devMode={devMode}
            userEmail={user.email}
          />
        </div>
      )}

      {screen === SCREENS.ADD && (
        <div className="screen-overlay screen-slide-up">
          <AddClothing onClose={backToGallery} onSaved={() => { reload(); backToGallery() }} user={user} />
        </div>
      )}

      {(screen === SCREENS.OUTFITS || exitingTab === SCREENS.OUTFITS) && (
        <div className={`screen-overlay ${exitingTab === SCREENS.OUTFITS ? 'screen-exit-right' : slideClass}`}>
          <OutfitsScreen
            outfits={outfits}
            loading={outfitsLoading}
            error={outfitsError}
            clothes={clothes}
            onUpdated={updateOutfitLocal}
            onDeleted={removeOutfitLocal}
            onItemClick={openDetail}
            onOutfitAdded={addOutfitLocal}
            onAddClick={() => setScreen(SCREENS.ADD)}
            user={user}
            onReload={reload}
          />
        </div>
      )}

      {(screen === SCREENS.LAUNDRY || exitingTab === SCREENS.LAUNDRY) && (
        <div className={`screen-overlay ${exitingTab === SCREENS.LAUNDRY ? 'screen-exit-right' : slideClass}`}>
          <LaundryScreen
            clothes={clothes}
            onUpdated={(id, updates) => updateLocalItem(id, updates)}
          />
        </div>
      )}

      {(screen === SCREENS.CHAT || exitingTab === SCREENS.CHAT) && (
        <div className={`screen-overlay ${exitingTab === SCREENS.CHAT ? 'screen-exit-right' : slideClass}`}>
          <ChatScreen clothes={clothes} onItemClick={openDetail} user={user} />
        </div>
      )}

      {showTour && (
        <WizardTour
          user={user}
          ownerName={ownerName}
          onComplete={() => setShowTour(false)}
          onNavigate={(screen) => navigateTo(screen)}
        />
      )}

      {showBottomNav && (
        <BottomNav
          activeScreen={navScreen}
          onGallery={() => navigateTo(SCREENS.GALLERY)}
          onOutfits={() => navigateTo(SCREENS.OUTFITS)}
          onLaundry={() => navigateTo(SCREENS.LAUNDRY)}
          onAddClick={() => setScreen(SCREENS.ADD)}
          onChat={() => navigateTo(SCREENS.CHAT)}
        />
      )}
    </div>
  )
}
