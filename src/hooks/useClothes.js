import { useState, useEffect, useCallback } from 'react'
import { fetchClothes } from '../services/supabase'

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

  // Optymistyczna aktualizacja statusu bez przeładowania całej listy
  const updateLocalItem = useCallback((id, updates) => {
    setClothes(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const removeLocalItem = useCallback((id) => {
    setClothes(prev => prev.filter(item => item.id !== id))
  }, [])

  return { clothes, loading, error, reload: load, updateLocalItem, removeLocalItem }
}
