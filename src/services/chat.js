function detectIntent(message) {
  const msg = message.toLowerCase()
  const intents = {
    full_outfit: ['stylizacja', 'outfit', 'co założyć', 'ubierz mnie', 'kompletny', 'cały strój', 'od góry do dołu', 'co na siebie'],
    single_item: ['koszula', 'spodnie', 'kurtka', 'bluza', 'sweter', 'buty', 'płaszcz', 'sukienka', 'coś na górę', 'coś na dół', 'okrycie'],
    weather_based: ['pogoda', 'deszcz', 'zimno', 'ciepło', 'dziś', 'dzisiaj', 'na zewnątrz', 'temperatura'],
    occasion_based: ['praca', 'biuro', 'spotkanie', 'randka', 'impreza', 'wieczór', 'casual', 'sport', 'weekend', 'wyjście'],
    favorites: ['ulubione', 'ulubion', 'najlepsze'],
    unused: ['dawno', 'nieużywane', 'zapomniałem', 'leży', 'nie zakładał'],
    laundry: ['czyste', 'brudne', 'pranie', 'dostępne'],
  }
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(k => msg.includes(k))) return intent
  }
  return 'general'
}

function classifyQueryType(message, intent) {
  const msg = message.toLowerCase()

  const inventoryPhrases = [
    'które mam', 'co mam', 'pokaż wszystkie', 'mam czyste', 'gotowe do założenia',
    'dostępne', 'w szafie', 'ile mam', 'jakie mam', 'wszystkie', 'lista',
    'co jest dostępne', 'co masz dla mnie',
  ]
  if (intent === 'laundry' || inventoryPhrases.some(p => msg.includes(p))) {
    return 'inventory'
  }

  const brands = ['h&m', 'zara', 'nike', 'reserved', 'medicine', 'mango', 'adidas', 'pull&bear']
  if (brands.some(b => msg.includes(b))) {
    return 'brand'
  }

  const categories = ['koszulę', 'kurtkę', 'bluzę', 'płaszcz', 'spodnie', 'sweter']
  if (categories.some(c => msg.includes(c)) && !msg.includes('założyć') && !msg.includes('stylizacj')) {
    return 'specific'
  }

  return 'recommendation'
}

function baseFilter(clothes, currentOwner) {
  let filtered = clothes.filter(c =>
    (!currentOwner || c.owner === currentOwner) &&
    c.status === 'czyste'
  )

  if (filtered.length === 0 && currentOwner) {
    filtered = clothes.filter(c => c.status === 'czyste')
  }

  return filtered
}

const BOTTOM_CATEGORIES = ['spodnie', 'szorty', 'sukienka', 'spódnica']

function formatWardrobe(clothes) {
  if (clothes.length === 0) return 'Szafa jest pusta.'

  const grouped = {}
  clothes.forEach(c => {
    const layer = c.clothing_layer || 'inne'
    if (!grouped[layer]) grouped[layer] = []
    grouped[layer].push(c)
  })

  // Wydziel spodnie/dół z ich bucketu do osobnej sekcji
  const bottoms = clothes.filter(c => BOTTOM_CATEGORIES.includes(c.category))
  bottoms.forEach(b => {
    const layer = b.clothing_layer || 'inne'
    if (grouped[layer]) grouped[layer] = grouped[layer].filter(c => c.id !== b.id)
  })
  if (bottoms.length > 0) grouped['dół (spodnie/sukienki)'] = bottoms

  const allLayers = [
    'pierwsza warstwa',
    'środkowa warstwa',
    'zewnętrzna warstwa',
    'dół (spodnie/sukienki)',
    'dodatek',
    'inne',
  ]

  let result = ''
  allLayers.forEach(layer => {
    const items = grouped[layer]
    if (!items || items.length === 0) return

    result += `\n[${layer.toUpperCase()}]\n`
    items.forEach(c => {
      const id = c.id.substring(0, 6)
      const name = c.name || c.category
      const color = c.dominant_color || c.colors?.[0] || '?'
      const warmth = c.warmth_level ? `ciepłość:${c.warmth_level}/5` : ''
      const formal = c.formality_score ? `formal:${c.formality_score}/10` : ''
      const season = c.season?.join('/') || ''
      const occasion = c.occasion?.join('/') || ''
      const brand = c.brand ? `[${c.brand}]` : ''
      const fav = c.is_favorite ? ' ★' : ''
      const tags = c.prompt_tags?.slice(0, 3).join(', ') || ''
      const desc = c.ai_description ? `\n    📝 ${c.ai_description}` : ''
      const occasions = c.occasion?.join(', ') || ''

      result += `  ${id} | ${name}${fav} | ` +
        `${color} | ${brand} | ` +
        `${warmth} ${formal} | ` +
        `${season} | ${occasions} | ${tags}` +
        `${desc}\n`
    })
  })

  return result
}

import { logChatInteraction } from './devLogger'

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (i === retries) return res
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

export async function sendChatMessage(userMessage, clothes, history = [], weatherData = null, currentOwner = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Brak klucza VITE_GROQ_API_KEY')

  const startTime = Date.now()

  const intent = detectIntent(userMessage)
  const queryType = classifyQueryType(userMessage, intent)
  const filtered = baseFilter(clothes, currentOwner)

  const hasBottoms = filtered.some(c => BOTTOM_CATEGORIES.includes(c.category))
  const hasOuterwear = filtered.some(c => c.clothing_layer === 'zewnętrzna warstwa')

  const warnings = []
  if (!hasBottoms) warnings.push('⚠️ Brak spodni/szortów w czystych ubraniach')
  if (!hasOuterwear && weatherData?.current_temp < 10) {
    warnings.push(`⚠️ Brak kurtki/płaszcza — temperatura ${weatherData.current_temp}°C`)
  }

  const wardrobeText = formatWardrobe(filtered)

  const weatherCtx = weatherData
    ? `POGODA TERAZ:\n- ${weatherData.current_temp}°C (odczuwalna ${weatherData.feels_like}°C)\n- ${weatherData.condition}\n- Deszcz: ${weatherData.rain_chance}%\n- Wiatr: ${weatherData.wind_kmh} km/h\n`
    : 'Brak danych pogodowych.\n'

  const days = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
  const today = days[new Date().getDay()]
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'rano' : hour < 17 ? 'popołudniu' : 'wieczorem'

  const systemPrompt = `Jesteś Wizard — przyjacielski osobisty stylista.
Rozmawiasz ciepło i naturalnie, jak dobry znajomy który zna się na modzie. Nie jesteś robotem — masz opinię, poczucie humoru i styl.
Gdy coś nie pasuje — mówisz to wprost ale życzliwie.
Gdy szafa ma braki — sugerujesz co warto dokupić.
Rekomenduj WYŁĄCZNIE ubrania z listy poniżej.
Nigdy nie wymyślaj ubrań których nie ma w szafie.

━━━ KONTEKST ━━━
${weatherCtx}
Dzień: ${today}, ${timeOfDay}
Typ zapytania: ${queryType}
${warnings.length > 0 ? '\n⚠️ OSTRZEŻENIA:\n' + warnings.join('\n') + '\n' : ''}
━━━ SZAFA (${filtered.length} czystych ubrań) ━━━
Format: ID | nazwa ★=ulubione | kolor | [marka] | ciepłość/formalność | sezony | okazje | tagi

${wardrobeText}
━━━ JAK DZIAŁASZ ━━━

PYTANIA POMOCNICZE
Gdy zapytanie jest vague (np. samo "co założyć?") zadaj JEDNO konkretne pytanie:
- "Na jaką okazję?"
- "Planujesz być długo na zewnątrz?"
- "Wolisz dziś bardziej casualowo czy elegancko?"
Nie pytaj gdy kontekst jest jasny.

REKOMENDACJE:

WAŻNE — ZAWSZE proponuj minimum 2 ubrania naraz.
Nigdy nie kończ na jednym elemencie.
Pojedyncze ubranie to niepełna odpowiedź.

Logika łączenia warstw:
- Koszula (pierwsza warstwa) + płaszcz/kurtka (zewnętrzna) = cieplejsze niż sama bluza
- Koszula + bluza = smart casual na chłodny dzień
- Koszula + bluza + płaszcz = pełna stylizacja na zimno

Przy każdym pytaniu o stylizację:
1. Najpierw wybierz główny element (koszula/bluza)
2. Dodaj warstwę zewnętrzną jeśli temp < 15°C
3. Jeśli brak spodni — wspomnij raz i idź dalej, nie powtarzaj tego w każdej odpowiedzi

Przykład DOBREJ odpowiedzi przy 7°C:
"Proponuję koszulę w paski jako bazę i czarny trencz na wierzch — razem dają ciepłą i elegancką stylizację na chłodny dzień."

Przykład ZŁEJ odpowiedzi:
"Polecam bluzę z kapturem." ← za mało, jedno ubranie

INVENTORY
Gdy pytanie o stan szafy — wymień wszystko co jest czyste, nie filtruj, nie pomijaj.

MARKA
Gdy pytanie o markę — filtruj po [marka] w liście i zwróć wszystkie pasujące ubrania.

FORMAT — zawsze TYLKO JSON, zero tekstu poza nim:
{
  "text": "Odpowiedź 2-4 zdania po polsku. Naturalna, konkretna, z uzasadnieniem.",
  "item_ids": ["pełne-uuid-1", "pełne-uuid-2"],
  "outfit_name": "Krótka nazwa lub null",
  "reasoning": "Logika doboru — 1 zdanie. NIE używaj ID ani UUID. Pisz o ubraniach po nazwie (np. 'zielona bluza', 'czarny płaszcz').",
  "missing_items": [],
  "asking_clarification": false
}

UWAGA: w item_ids wpisuj zawsze PEŁNE UUID (36 znaków) z kolumny ID w danych szafy.
Pierwsze 6 znaków w formacie wyświetlania to tylko skrót dla czytelności.`

  const shownIds = history
    .filter(m => m.role === 'assistant')
    .flatMap(m => m.item_ids || [])

  const enriched = shownIds.length > 0
    ? `${userMessage}\n[Już polecono: ${shownIds.slice(-10).join(', ')} — zaproponuj inne jeśli możesz]`
    : userMessage

  const recentHistory = history.slice(-10)
  const messages = [
    ...recentHistory.map(h => ({
      role: h.role,
      content: h.role === 'assistant'
        ? (typeof h.content === 'string' ? h.content : JSON.stringify(h.content))
        : h.content,
    })),
    { role: 'user', content: enriched },
  ]

  const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content

  if (!raw) {
    return { text: 'Coś poszło nie tak. Spróbuj ponownie.', item_ids: [], outfit_name: null, reasoning: null, missing_items: [], asking_clarification: false }
  }

  try {
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.item_ids?.length > 0) {
      parsed.item_ids = parsed.item_ids
        .map(id => {
          if (id.length === 36 && filtered.some(c => c.id === id)) return id
          const match = filtered.find(c => c.id.startsWith(id))
          return match?.id ?? null
        })
        .filter(Boolean)
    }

    const itemsFoundInWardrobe = parsed.item_ids
      ?.filter(id => filtered.some(c => c.id === id || c.id.startsWith(id)))
      .length || 0

    const wardrobeLayers = {
      pierwsza: filtered.filter(c => c.clothing_layer === 'pierwsza warstwa').length,
      srodkowa: filtered.filter(c => c.clothing_layer === 'środkowa warstwa').length,
      zewnetrzna: filtered.filter(c => c.clothing_layer === 'zewnętrzna warstwa').length,
      dol: filtered.filter(c => BOTTOM_CATEGORIES.includes(c.category)).length,
    }

    await logChatInteraction({
      owner: currentOwner,
      duration_ms: Date.now() - startTime,
      success: true,
      user_message: userMessage,
      intent,
      query_type: queryType,
      weather_temp: weatherData?.current_temp,
      weather_condition: weatherData?.condition,
      weather_rain_chance: weatherData?.rain_chance,
      day_of_week: days[new Date().getDay()],
      time_of_day: timeOfDay,
      clothes_total: clothes.length,
      clothes_sent_to_ai: filtered.length,
      wardrobe_layers: wardrobeLayers,
      wardrobe_warnings: warnings,
      ai_response_text: parsed.text,
      ai_item_ids: parsed.item_ids,
      ai_outfit_name: parsed.outfit_name,
      ai_reasoning: parsed.reasoning,
      ai_missing_items: parsed.missing_items,
      ai_asking_clarification: parsed.asking_clarification,
      items_found_in_wardrobe: itemsFoundInWardrobe,
      response_length: parsed.text?.length,
      model_used: 'llama-3.3-70b-versatile',
      prompt_length: systemPrompt.length,
    })

    return parsed
  } catch (error) {
    await logChatInteraction({
      owner: currentOwner,
      duration_ms: Date.now() - startTime,
      success: false,
      error_message: error.message,
      user_message: userMessage,
      intent,
      query_type: queryType,
      clothes_total: clothes.length,
      clothes_sent_to_ai: filtered.length,
      model_used: 'llama-3.3-70b-versatile',
      prompt_length: systemPrompt.length,
    })
    return { text: raw ?? 'Coś poszło nie tak. Spróbuj ponownie.', item_ids: [], outfit_name: null, reasoning: null, missing_items: [], asking_clarification: false }
  }
}
