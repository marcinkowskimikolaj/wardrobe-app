const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const SYSTEM_PROMPT = `Jesteś ekspertem od mody i pielęgnacji ubrań. Przeanalizuj zdjęcie/a ubrania. Jeśli jest zdjęcie metki — użyj go priorytetowo do instrukcji prania. Zwróć TYLKO obiekt JSON bez żadnego tekstu przed ani po: { "category": string, "colors": array, "material": string, "style_tags": array, "season": array, "washing_temp": number lub null, "washing_mode": string lub null, "drying": string lub null, "ironing": string lub null, "ai_description": string, "prompt_tags": array }. Nierozpoznane pola ustaw null. ai_description to 2-3 zdania po polsku. prompt_tags to 5-10 tagów opisujących kontekst użycia ubrania, np. ["letni casual", "do kawiarni", "na rower", "minimalistyczny look"].`

/**
 * Konwertuje plik File do base64 data URL.
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Buduje tablicę wiadomości do API z jednym lub dwoma zdjęciami.
 */
async function buildMessages(clothingFile, labelFile = null) {
  const clothingBase64 = await fileToBase64(clothingFile)

  const content = [
    { type: 'image_url', image_url: { url: clothingBase64 } },
    { type: 'text', text: 'Przeanalizuj to ubranie.' }
  ]

  // Jeśli jest metka — dodaj jako drugie zdjęcie z adnotacją
  if (labelFile) {
    const labelBase64 = await fileToBase64(labelFile)
    content.splice(1, 0, { type: 'image_url', image_url: { url: labelBase64 } })
    content[content.length - 1].text =
      'Pierwsze zdjęcie to ubranie, drugie to metka z instrukcją prania. Użyj metki priorytetowo do pól prania.'
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content }
  ]
}

/**
 * Analizuje ubranie przez Groq API (Llama 4 Scout z vision).
 * Zwraca sparsowany obiekt JSON lub rzuca błąd.
 */
export async function analyzeClothing(clothingFile, labelFile = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Brak klucza VITE_GROQ_API_KEY')

  const messages = await buildMessages(clothingFile, labelFile)

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1024
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const result = await response.json()
  const rawText = result.choices?.[0]?.message?.content ?? ''

  // Wyciągamy JSON z odpowiedzi (model może dodać dodatkowy tekst mimo promptu)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI nie zwróciło poprawnego JSON')

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Nie udało się sparsować odpowiedzi AI')
  }
}
