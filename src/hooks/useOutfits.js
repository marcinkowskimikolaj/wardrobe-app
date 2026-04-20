import { useState, useEffect, useCallback } from 'react'
import { fetchOutfits } from '../services/supabase'

export function useOutfits() {
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOutfits()
      setOutfits(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addLocal = useCallback((outfit) => {
    setOutfits(prev => [outfit, ...prev])
  }, [])

  const updateLocal = useCallback((id, updates) => {
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [])

  const removeLocal = useCallback((id) => {
    setOutfits(prev => prev.filter(o => o.id !== id))
  }, [])

  return { outfits, loading, error, reload: load, addLocal, updateLocal, removeLocal }
}
