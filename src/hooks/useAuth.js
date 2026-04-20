import { useState, useEffect } from 'react'
import { supabase, onAuthStateChange } from '../services/supabase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = ładowanie, null = niezalogowany
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sprawdź aktualną sesję przy montowaniu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Nasłuchuj zmian stanu auth
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
