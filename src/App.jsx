import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useClothes } from './hooks/useClothes'
import { useOutfits } from './hooks/useOutfits'
import { getOwnerFromEmail } from './config/constants'
import Login from './components/Auth/Login'
import Gallery from './components/Gallery/Gallery'
import AddClothing from './components/AddClothing/AddClothing'
import ClothingDetail from './components/ClothingDetail/ClothingDetail'
import OutfitsScreen from './components/Outfits/OutfitsScreen'
import LaundryScreen from './components/Laundry/LaundryScreen'
import BottomNav from './components/UI/BottomNav'
import LoadingSpinner from './components/UI/LoadingSpinner'

const SCREENS = { GALLERY: 'gallery', ADD: 'add', DETAIL: 'detail', OUTFITS: 'outfits', LAUNDRY: 'laundry' }

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const ownerName = user ? (getOwnerFromEmail(user.email) ?? null) : null
  const { clothes, loading: clothesLoading, error, reload, updateLocalItem, removeLocalItem } = useClothes()
  const { outfits, loading: outfitsLoading, error: outfitsError, addLocal: addOutfitLocal, updateLocal: updateOutfitLocal, removeLocal: removeOutfitLocal } = useOutfits()
  const [screen, setScreen] = useState(SCREENS.GALLERY)
  const [selectedItem, setSelectedItem] = useState(null)
  const [exitingDetail, setExitingDetail] = useState(false)

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

  const showBottomNav = screen !== SCREENS.ADD && screen !== SCREENS.DETAIL && !exitingDetail
  const navScreen = screen === SCREENS.OUTFITS ? 'outfits'
    : screen === SCREENS.LAUNDRY ? 'laundry'
    : 'gallery'

  return (
    <div className="app">
      {/* Gallery — zawsze wyrenderowana jako warstwa bazowa */}
      <Gallery
        clothes={clothes}
        loading={clothesLoading}
        error={error}
        onItemClick={openDetail}
        ownerName={ownerName}
      />

      {/* Detail — overlay z animacją wejścia i wyjścia */}
      {(screen === SCREENS.DETAIL || exitingDetail) && selectedItem && (
        <div className={`screen-overlay ${exitingDetail ? 'screen-slide-exit' : 'screen-slide-enter'}`}>
          <ClothingDetail
            item={selectedItem}
            clothes={clothes}
            outfits={outfits}
            onClose={backToGallery}
            onUpdated={(id, updates) => { updateLocalItem(id, updates); setSelectedItem(prev => ({ ...prev, ...updates })) }}
            onDeleted={(id) => { removeLocalItem(id); backToGallery() }}
            onOutfitAdded={(outfit) => addOutfitLocal(outfit)}
          />
        </div>
      )}

      {screen === SCREENS.ADD && (
        <div className="screen-overlay screen-slide-up">
          <AddClothing onClose={backToGallery} onSaved={() => { reload(); backToGallery() }} user={user} />
        </div>
      )}

      {screen === SCREENS.OUTFITS && (
        <div className="screen-overlay screen-slide-enter">
          <OutfitsScreen
            outfits={outfits}
            loading={outfitsLoading}
            error={outfitsError}
            clothes={clothes}
            onUpdated={updateOutfitLocal}
            onDeleted={removeOutfitLocal}
            onItemClick={openDetail}
          />
        </div>
      )}

      {screen === SCREENS.LAUNDRY && (
        <div className="screen-overlay screen-slide-enter">
          <LaundryScreen
            clothes={clothes}
            onUpdated={(id, updates) => updateLocalItem(id, updates)}
          />
        </div>
      )}

      {showBottomNav && (
        <BottomNav
          activeScreen={navScreen}
          onGallery={backToGallery}
          onOutfits={() => setScreen(SCREENS.OUTFITS)}
          onLaundry={() => setScreen(SCREENS.LAUNDRY)}
          onAddClick={() => setScreen(SCREENS.ADD)}
        />
      )}
    </div>
  )
}
