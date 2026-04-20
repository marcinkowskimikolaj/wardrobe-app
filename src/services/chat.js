const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function sendChatMessage(userMessage, clothes, history = [], weatherContext = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Brak klucza VITE_GROQ_API_KEY')

  const wardrobeContext = clothes.map(c => ({
    id: c.id,
    category: c.category,
    dominant_color: c.dominant_color,
    material: c.material,
    formality: c.formality,
    pattern: c.pattern,
    season: c.season,
    style_tags: c.style_tags,
    prompt_tags: c.prompt_tags,
    fit: c.fit,
    status: c.status,
    owner: c.owner
  }))

  const systemPrompt = `Jesteś asystentem szafy. Znasz całą zawartość szafy użytkownika.
Pomagasz dobierać stylizacje, odpowiadasz na pytania o ubrania,
rekomendasz co założyć na różne okazje.

SZAFA UŻYTKOWNIKA (JSON):
${JSON.stringify(wardrobeContext)}
${weatherContext ? `
AKTUALNA POGODA:
${weatherContext.summary}
Temp odczuwalna: ${weatherContext.feels_like}°C
Szansa deszczu: ${weatherContext.rain_chance}%

Uwzględniaj pogodę w rekomendacjach — proponuj ubrania odpowiednie do aktualnych warunków.
Przy wysokiej szansie deszczu sugeruj coś wodoodpornego.
Przy niskiej temperaturze sugeruj warstwy.
` : ''}
Zasady odpowiedzi:
- Zawsze po polsku
- Odpowiedzi zwięzłe (max 3-4 zdania tekstu)
- W tekście nazywaj ubrania po kategorii i kolorze z danych JSON (np. "czarny płaszcz", "denimowa kurtka") — NIGDY nie podawaj ID w tekście
- Używaj WYŁĄCZNIE atrybutów które faktycznie są w danych szafy — nie wymyślaj kolorów, materiałów ani cech których nie ma w JSON
- Jeśli rekomenduje konkretne ubrania — umieść ich ID wyłącznie w tablicy item_ids
- Format odpowiedzi: JSON { "text": "odpowiedź", "item_ids": ["id1","id2"] }
- Jeśli pytanie dotyczy pogody w kontekście ubrań (np. "co założyć jutro", "jaka pogoda") — odpowiedz na podstawie danych pogodowych z kontekstu lub przyznaj że nie masz prognozy na jutro
- Jeśli pytanie zupełnie nie dotyczy ubrań ani pogody — odpowiedz { "text": "Mogę pomóc tylko w temacie Twojej szafy 😊", "item_ids": [] }
- item_ids: puste [] jeśli brak konkretnych rekomendacji
- Zwróć TYLKO JSON bez żadnego tekstu przed ani po`

  const recentHistory = history.slice(-6).map(m => ({
    role: m.role,
    content: m.content
  }))

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 512
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const result = await response.json()
  const rawText = result.choices?.[0]?.message?.content ?? ''
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { text: rawText, item_ids: [] }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return { text: rawText, item_ids: [] }
  }
}
