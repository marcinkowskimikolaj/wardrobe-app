import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

// ─── CLOTHES — ODCZYT ────────────────────────────────────────────────────────

export async function fetchClothes() {
  const { data, error } = await supabase
    .from('clothes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchClothingById(id) {
  const { data, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── CLOTHES — ZAPIS ─────────────────────────────────────────────────────────

export async function addClothing(clothingData) {
  const { data, error } = await supabase
    .from('clothes')
    .insert([clothingData])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClothing(id, updates) {
  const { data, error } = await supabase
    .from('clothes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClothing(id) {
  const { error } = await supabase
    .from('clothes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── STORAGE — ZDJĘCIA ───────────────────────────────────────────────────────

const BUCKET = 'clothes-photos'

/**
 * Kompresuje zdjęcie przez Canvas API do JPEG max 1200px, jakość 0.82.
 * Zawsze zwraca File (nawet jeśli Canvas API niedostępne — fallback na oryginał).
 */
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const MAX = 1200
      let { width, height } = img

      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.82
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

/**
 * Kompresuje i wgrywa plik do Supabase Storage. Zwraca publiczny URL.
 * @param {File} file - plik zdjęcia
 * @param {string} folder - 'clothing' lub 'labels'
 */
export async function uploadPhoto(file, folder = 'clothing') {
  const compressed = await compressImage(file)
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ─── OUTFITS ─────────────────────────────────────────────────────────────────

export async function fetchOutfits() {
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addOutfit(outfitData) {
  const { data, error } = await supabase
    .from('outfits')
    .insert([outfitData])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOutfit(id, updates) {
  const { data, error } = await supabase
    .from('outfits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOutfit(id) {
  const { error } = await supabase.from('outfits').delete().eq('id', id)
  if (error) throw error
}

// ─── STORAGE — ZDJĘCIA ───────────────────────────────────────────────────────

export async function deletePhoto(url) {
  // Wyciągamy ścieżkę pliku z pełnego URL
  const path = url.split(`/${BUCKET}/`)[1]
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}
