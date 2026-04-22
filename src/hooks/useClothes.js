import { useState, useEffect, useCallback } from 'react'
import { fetchClothes, toggleFavorite as toggleFavoriteApi } from '../services/supabase'

export function useClothes() {
  const [clothes, setClothes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchClothes()
      setClothes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateLocalItem = useCallback((id, updates) => {
    setClothes(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const removeLocalItem = useCallback((id) => {
    setClothes(prev => prev.filter(item => item.id !== id))
  }, [])

  const toggleFavorite = useCallback(async (id) => {
    const item = clothes.find(c => c.id === id)
    if (!item) return
    const current = item.is_favorite ?? false
    // Optymistyczna aktualizacja
    setClothes(prev => prev.map(c => c.id === id ? { ...c, is_favorite: !current } : c))
    try {
      await toggleFavoriteApi(id, current)
    } catch {
      // Cofnij przy błędzie
      setClothes(prev => prev.map(c => c.id === id ? { ...c, is_favorite: current } : c))
    }
  }, [clothes])

  return { clothes, loading, error, reload: load, updateLocalItem, removeLocalItem, toggleFavorite }
}
