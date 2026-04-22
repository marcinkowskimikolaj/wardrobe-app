const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

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
export const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const SYSTEM_PROMPT = `Jesteś ekspertem od mody i pielęgnacji tekstyliów ze znajomością standardu ISO 3758.
Analizujesz zdjęcia ubrań i metek.

JĘZYK: Każda wartość tekstowa MUSI być po polsku.
Bez wyjątków. Nawet jeśli metka jest po angielsku — tłumacz na polski.

KATEGORIE UBRAŃ — używaj WYŁĄCZNIE tych wartości, dobieraj na podstawie definicji:

'koszula' — ubranie z kołnierzykiem (polo, oxford, flanelowa, hawajska, jeansowa), zapinane na guziki lub napy. Może być z długim lub krótkim rękawem. NIE myl z bluzą — koszula MA kołnierzyk.

'bluza' — ubranie bez kołnierzyka, wkładane przez głowę lub zapinane na zamek. Obejmuje: hoodie, sweatshirt, bluza dresowa, bluza z kapturem, bluza bez kaptura. Materiał: dresowy, bawełna, polar, dzianina gruba.

'sweter' — ubranie z dzianiny (wełna, akryl, kaszmir), grubsze, cieplejsze, często z wzorami (norweski, warkocz). Różni się od bluzy materiałem (dzianina vs dresówka).

't-shirt' — koszulka bez kołnierzyka, krótki rękaw, lekki materiał (jersey, bawełna). Podstawowe ubranie na co dzień. Może mieć nadruk lub być jednolite.

'top' — damskie ubranie wierzchnie, krótkie, bez rękawów lub na ramiączkach. Crop top, top na ramiączkach, bluzka.

'spodnie' — długie spodnie. Obejmuje: jeansy, chinos, spodnie dresowe, spodnie garniturowe, spodnie cargo, legginsy długie.

'szorty' — krótkie spodnie do kolan lub wyżej.

'sukienka' — jednoelementowe ubranie damskie, zakrywające górę i dół ciała.

'spódnica' — dolna część ubrania damskiego, bez nogawek.

'kurtka' — wierzchnie ubranie do pasa lub bioder, zapinane. Obejmuje: kurtka jeansowa, bomber, kurtka przejściowa, wiatrówka, kurtka skórzana.

'płaszcz' — długie okrycie wierzchnie, zazwyczaj poniżej kolan lub do połowy uda. Trencz, płaszcz wełniany, parka długa.

'marynarka' — formalne ubranie wierzchnie z klapami, część garnituru lub jako osobna sztuka.

'garnitur' — komplet: marynarka + spodnie/spódnica.

'dres' — komplet lub część: bluza dresowa + spodnie dresowe. Sportowy charakter.

'bielizna' — majtki, biustonosz, bokserki, slipy.

'skarpety' — skarpetki, podkolanówki.

'buty' — obuwie: sneakersy, buty na obcasie, botki, kozaki, mokasyny, sandały, klapki.

'akcesoria' — pasek, szalik, czapka, rękawiczki, krawat, chustka, torba.

'inne' — jeśli żadna kategoria nie pasuje.

ZASADA: Gdy widzisz kołnierzyk → koszula. Gdy brak kołnierzyka + materiał dresowy → bluza. Gdy brak kołnierzyka + dzianina/wełna → sweter. Gdy brak kołnierzyka + lekki jersey/bawełna → t-shirt.

NORMALIZACJA SEZONÓW — używaj WYŁĄCZNIE tych wartości:
['wiosna', 'lato', 'jesień', 'zima']
Nigdy: 'spring', 'summer', 'autumn', 'winter'

NORMALIZACJA FORMALNOŚCI — używaj WYŁĄCZNIE:
'bardzo casualowy' | 'casualowy' | 'smart casual' | 'biznesowy' | 'formalny'

SYMBOLE NA METCE — odczytuj lewo→prawo:
PRANIE (wanienka): liczba = max temp (30/40/60/95°C),
  ręka = tylko ręcznie, kreska = delikatny,
  2 kreski = bardzo delikatny, X = nie prać
BIELENIE (trójkąt): pusty = można, 2 linie = bez chloru,
  X = nie bielić
SUSZENIE (kwadrat): koło = suszarka (1 kropka=niska, 2=normalna), X = nie suszarką,
  pozioma linia = płasko, pionowa = wieszak
PRASOWANIE (żelazko): 1 kropka=110°C, 2=150°C, 3=200°C, X = nie prasować
CZYSZCZENIE (koło): P = pralnia, X = nie czyścić

GDY BRAK METKI — szacuj z materiału:
bawełna→40-60°C normalny, wełna→30°C bardzo delikatny,
jedwab→30°C ręcznie, syntetyk→40°C delikatny,
denim→30-40°C normalny

GRUPA KOLORYSTYCZNA PRANIA (wash_color_group):
  Materiał ma pierwszeństwo: wełna/jedwab/koronka → zawsze 'delikatne'.
  biały/kremowy/ecru → 'białe'
  beżowy/pastelowy/jasnoszary → 'jasne'
  czarny/granatowy/ciemnoszary/brązowy → 'ciemne'
  pozostałe żywe kolory → 'kolorowe'

Zwróć TYLKO JSON bez żadnego tekstu przed ani po:
{
  "name": "krótka opisowa nazwa po polsku, max 5 słów, BEZ kategorii na początku. Przykłady: 'jeansowa z futerkiem sherpa', 'biały z nadrukiem NYC', 'czarne slim chino', 'wełniany w kratę'. Jeśli brak wyróżników — null.",
  "category": "WYŁĄCZNIE jedna z wartości z listy KATEGORIE UBRAŃ powyżej, małymi literami",
  "subcategory": "uszczegółowienie po polsku lub null. Przykłady: koszula→'koszula oxford'|'koszula polo'|'koszula flanelowa'|'koszula hawajska'|'koszula biznesowa'; bluza→'bluza z kapturem'|'bluza bez kaptura'|'bluza rozpinana'|'bluza dresowa'; spodnie→'jeansy slim'|'jeansy straight'|'chinos'|'spodnie dresowe'|'spodnie garniturowe'; kurtka→'kurtka jeansowa'|'kurtka bomber'|'kurtka przejściowa'|'wiatrówka'. Dla pozostałych kategorii: null jeśli oczywiste.",
  "colors": ["array po polsku"],
  "dominant_color": "jeden kolor po polsku",
  "secondary_colors": ["kolory pomocnicze po polsku, [] jeśli brak"],
  "material": "po polsku, np. 'bawełna', 'denim'",
  "pattern": "po polsku: 'jednolity' | 'w paski' | 'w kratę' | 'w kwiaty' | 'moro' | 'geometryczny' | 'abstrakcyjny'",
  "fit": "'slim' | 'regular' | 'oversized' | 'wide leg' | 'straight' | 'relaxed'",
  "neckline": "po polsku lub null",
  "sleeve_length": "'bez rękawów' | 'krótki' | '3/4' | 'długi' lub null",
  "length": "po polsku lub null",
  "formality": "TYLKO z listy: 'bardzo casualowy' | 'casualowy' | 'smart casual' | 'biznesowy' | 'formalny'",
  "style_tags": ["array po polsku, max 5 tagów"],
  "season": ["array TYLKO z wartości: 'wiosna', 'lato', 'jesień', 'zima'"],
  "occasion": ["array po polsku, max 3, wybierz z: 'do pracy' | 'casualowe wyjście' | 'na wieczór' | 'na sport' | 'na co dzień' | 'na specjalną okazję' | 'na wakacje' | 'na spacer'"],
  "clothing_layer": "WYMAGANE — wybierz JEDEN według poniższych definicji: 'bielizna' → majtki, biustonosz, bokserki, slipy, podkoszulek (zakładany pod koszulę), skarpety, rajstopy. 'pierwsza warstwa' → ubranie zakładane BEZPOŚREDNIO na ciało lub bieliznę: koszula, t-shirt, polo, top, bluzka, podkoszulek wierzchni. Kontakt ze skórą. 'środkowa warstwa' → ubranie zakładane NA pierwszą warstwę, POD kurtkę/płaszcz: bluza, sweter, kardigan, polar, bluza z kapturem, hoodie, sweatshirt. Pełni funkcję ocieplającą. 'zewnętrzna warstwa' → ubranie zakładane NA WIERZCH jako okrycie wierzchnie: kurtka (każdy rodzaj), płaszcz, parka, trencz, wiatrówka, bomberka. Chroni przed deszczem/wiatrem/zimnem. 'dodatek' → buty, pasek, szalik, czapka, rękawiczki, torba, krawat, zegarek, biżuteria, spodnie, szorty, spódnica, sukienka (dół ciała lub całość). PRZYKŁADY: koszula oxford → 'pierwsza warstwa', t-shirt → 'pierwsza warstwa', bluza z kapturem → 'środkowa warstwa', sweter wełniany → 'środkowa warstwa', hoodie → 'środkowa warstwa', kurtka jeansowa → 'zewnętrzna warstwa', płaszcz → 'zewnętrzna warstwa', jeansy → 'dodatek', spodnie → 'dodatek', sneakersy → 'dodatek'.",
  "texture": "'gładki' | 'prążkowany' | 'strukturalny' | 'puszysty' | 'błyszczący' | 'matowy' | 'szorstki'",
  "warmth_level": "liczba 1-5: 1=bardzo lekkie, 2=lekkie, 3=średnie, 4=ciepłe, 5=bardzo ciepłe",
  "formality_score": "liczba 1-10: 1-2=domowy, 3-4=bardzo casual, 5-6=smart casual, 7-8=biznesowy, 9-10=formalny",
  "washing_temp": "liczba lub null",
  "washing_mode": "po polsku",
  "drying": "po polsku",
  "ironing": "po polsku",
  "ai_description": "2-3 zdania PO POLSKU WYŁĄCZNIE o wyglądzie i stylu — jak wygląda, do czego pasuje, jaki ma charakter. ZERO informacji o praniu, temperaturze, suszeniu, prasowaniu.",
  "prompt_tags": ["5-8 tagów kontekstu użycia PO POLSKU, opisuj KIEDY i GDZIE założyć, nie jak prać. Przykład: 'do biura', 'smart casual', 'na spotkanie', 'wiosenna stylizacja'"],
  "brand": "nazwa marki po polsku lub angielsku, np. 'Zara', 'H&M', 'Nike', 'Reserved', 'Mango', 'Adidas', 'Pull&Bear', 'Massimo Dutti'. Szukaj logo lub nazwy na metce, etykiecie, guzikach, zamku lub widocznym miejscu ubrania. Jeśli marka nierozpoznawalna lub brak metki: null. NIE zgaduj — wpisuj tylko gdy jesteś pewny.",
  "wash_color_group": "WYMAGANE — jedna wartość: 'białe'|'jasne'|'kolorowe'|'ciemne'|'delikatne'"
}
Nierozpoznane pola: null.`

const VALID_CATEGORIES = [
  'koszula', 'bluza', 'sweter', 't-shirt', 'top',
  'spodnie', 'szorty', 'sukienka', 'spódnica',
  'kurtka', 'płaszcz', 'marynarka', 'garnitur',
  'dres', 'bielizna', 'skarpety', 'buty',
  'akcesoria', 'inne',
]

const SEASON_MAP = {
  'spring': 'wiosna', 'wiosna': 'wiosna',
  'summer': 'lato', 'lato': 'lato',
  'autumn': 'jesień', 'fall': 'jesień', 'jesień': 'jesień',
  'winter': 'zima', 'zima': 'zima',
}

const FORMALITY_MAP = {
  'very casual': 'bardzo casualowy',
  'casual': 'casualowy',
  'smart casual': 'smart casual',
  'business': 'biznesowy',
  'formal': 'formalny',
  'bardzo casualowy': 'bardzo casualowy',
  'casualowy': 'casualowy',
  'biznesowy': 'biznesowy',
  'formalny': 'formalny',
}

const WASHING_WORDS = [
  'pranie', 'temperatura', 'suszarka', 'prasowanie',
  '°c', 'washing', 'tumble', 'iron', 'delikatny cykl',
]

function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function normalizeClothingData(data) {
  if (data.name) data.name = capitalize(data.name)
  if (data.season) {
    data.season = data.season
      .map(s => SEASON_MAP[s.toLowerCase()] ?? s)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
  }
  if (data.formality) {
    data.formality = FORMALITY_MAP[data.formality.toLowerCase()] ?? data.formality
  }
  if (data.ai_description) {
    const hasWashing = WASHING_WORDS.some(w =>
      data.ai_description.toLowerCase().includes(w)
    )
    if (hasWashing) {
      console.warn('[groq] ai_description zawiera info o praniu — usuwam:', data.ai_description)
      data.ai_description = null
    }
  }
  if (data.category) {
    data.category = data.category.toLowerCase()
    if (!VALID_CATEGORIES.includes(data.category)) {
      console.warn(`[groq] Nieznana kategoria: ${data.category} — zamieniam na 'inne'`)
      data.category = 'inne'
    }
  }
  return data
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressImageForAI(base64DataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.src = base64DataUrl
  })
}

async function buildMessages(clothingFile, labelFile = null) {
  const clothingBase64 = await fileToBase64(clothingFile)
  const compressedClothing = await compressImageForAI(clothingBase64)

  const content = [
    { type: 'image_url', image_url: { url: compressedClothing } },
    { type: 'text', text: 'Przeanalizuj to ubranie.' },
  ]

  if (labelFile) {
    const labelBase64 = await fileToBase64(labelFile)
    const compressedLabel = await compressImageForAI(labelBase64)
    content.splice(1, 0, { type: 'image_url', image_url: { url: compressedLabel } })
    content[content.length - 1].text =
      'Pierwsze zdjęcie to ubranie, drugie to metka z instrukcją prania. Użyj metki priorytetowo do pól prania.'
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content },
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

  const response = await fetchWithRetry(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: OUTFIT_SCAN_PROMPT },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: photoBase64 } },
          { type: 'text', text: 'Przeanalizuj tę stylizację.' },
        ]},
      ],
      temperature: 0.2,
      max_tokens: 2048,
    }),
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

export async function analyzeClothing(clothingFile, labelFile = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Brak klucza VITE_GROQ_API_KEY')

  const messages = await buildMessages(clothingFile, labelFile)

  const response = await fetchWithRetry(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1536,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const result = await response.json()
  const rawText = result.choices?.[0]?.message?.content ?? ''

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI nie zwróciło poprawnego JSON')

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return normalizeClothingData(parsed)
  } catch {
    throw new Error('Nie udało się sparsować odpowiedzi AI')
  }
}
