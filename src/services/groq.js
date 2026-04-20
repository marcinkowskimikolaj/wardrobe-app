const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const SYSTEM_PROMPT = `Jesteś ekspertem od mody i pielęgnacji tekstyliów ze znajomością standardu ISO 3758. Analizujesz zdjęcia ubrań i metek.
ZAWSZE odpowiadasz wyłącznie po polsku.

SYMBOLE NA METCE — odczytuj w kolejności lewo→prawo:

PRANIE (wanienka):
- liczba w środku = max temperatura (30/40/60/95°C)
- ręka = tylko pranie ręczne
- 1 kreska pod spodem = delikatny cykl
- 2 kreski = bardzo delikatny (wełna, jedwab)
- przekreślona = nie prać

BIELENIE (trójkąt):
- pusty = można bielić
- 2 linie ukośne = tylko wybielacz bez chloru
- przekreślony = nie bielić

SUSZENIE (kwadrat):
- koło w środku = suszarka (1 kropka=niska temp, 2=normalna)
- przekreślone koło = nie suszyć w suszarce
- pozioma linia = suszyć płasko
- pionowa linia = suszyć na wieszaku

PRASOWANIE (żelazko):
- 1 kropka = max 110°C (syntetyki)
- 2 kropki = max 150°C (jedwab, wełna)
- 3 kropki = max 200°C (bawełna, len)
- przekreślone = nie prasować

CZYSZCZENIE (koło):
- P = pralnia chemiczna
- F = czyszczenie benzyną
- przekreślone = nie czyścić chemicznie

GDY BRAK METKI — szacuj z materiału:
bawełna→40-60°C normalny, wełna→30°C bardzo delikatny,
jedwab→30°C ręcznie, syntetyk→40°C delikatny,
denim→30-40°C normalny, skóra→tylko pralnia chemiczna

Zwróć TYLKO JSON bez żadnego tekstu przed ani po:
{
  "category": string,
  "colors": array,
  "material": string,
  "style_tags": array,
  "season": array,
  "washing_temp": liczba lub null,
  "washing_mode": string lub null,
  "drying": string lub null,
  "ironing": string lub null,
  "ai_description": "2-3 zdania WYŁĄCZNIE o wyglądzie i stylu — krój, charakter, do czego pasuje. BEZ informacji o praniu.",
  "prompt_tags": array 5-10 tagów po polsku,
  "fit": "krój ubrania po polsku (slim/regular/oversized/wide leg/relaxed itp.) lub null",
  "neckline": "typ dekoltu lub kołnierza po polsku (okrągły/V/polo/stójka/kaptur itp.) lub null",
  "sleeve_length": "długość rękawa po polsku (bez rękawów/krótki/3/4/długi) lub null",
  "length": "długość ubrania po polsku (krótki/do kolan/midi/maxi/regularny) lub null",
  "pattern": "wzór tkaniny po polsku (jednolity/w kratę/w paski/w kwiaty/moro/geometryczny itp.)",
  "formality": "poziom formalności po polsku (bardzo casualowy/casualowy/smart casual/biznesowy/formalny)",
  "dominant_color": "jeden główny kolor po polsku",
  "secondary_colors": ["kolory pomocnicze po polsku — pusta tablica jeśli brak"]
}
Nierozpoznane pola: null.`

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

const OUTFIT_SCAN_PROMPT = `Analizujesz zdjęcie osoby lub ułożonych ubrań jako stylizację.
Zidentyfikuj KAŻDY element ubrania który widzisz.
Dla każdego elementu zwróć szczegółową charakterystykę.
TYLKO JSON:
{
  "detected_items": [
    {
      "item_type": "typ po polsku (np. koszula, spodnie, buty)",
      "dominant_color": "główny kolor po polsku",
      "secondary_colors": ["kolory pomocnicze po polsku"],
      "pattern": "wzór po polsku",
      "formality": "poziom formalności po polsku",
      "fit": "krój po polsku",
      "style_tags": ["tagi stylu po polsku"],
      "season": ["pory roku po polsku"],
      "match_score_factors": ["cechy do matchingu po polsku"]
    }
  ],
  "overall_style": "ogólny styl stylizacji po polsku",
  "occasion": "okazja po polsku (np. casual weekend, praca biurowa)",
  "season_recommendation": "pora roku po polsku"
}`

export async function analyzeOutfit(photoFile) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Brak klucza VITE_GROQ_API_KEY')

  const photoBase64 = await fileToBase64(photoFile)

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: OUTFIT_SCAN_PROMPT },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: photoBase64 } },
          { type: 'text', text: 'Przeanalizuj tę stylizację.' }
        ]}
      ],
      temperature: 0.2,
      max_tokens: 2048
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const result = await response.json()
  const rawText = result.choices?.[0]?.message?.content ?? ''
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI nie zwróciło poprawnego JSON')
  return JSON.parse(jsonMatch[0])
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
      max_tokens: 1536
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
