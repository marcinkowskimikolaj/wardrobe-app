# Raport stanu aplikacji — Wardrobe App (Szafa)

> Wygenerowano: 2026-04-20  
> Wersja: 0.1.0 | React 18 + Vite + Supabase + Groq AI (Llama 4 Scout)

---

## 1. Architektura ogólna

### Struktura folderów

```
/
├── src/
│   ├── App.jsx                    # Root — routing, globalny stan nawigacji
│   ├── main.jsx                   # Entry point, montuje App
│   ├── index.css                  # Wszystkie style (~1981 linii)
│   ├── config/
│   │   └── constants.js           # Stałe: OWNERS, STATUSES, CATEGORIES, SEASONS, WASHING_MODES itd.
│   ├── hooks/
│   │   ├── useAuth.js             # Supabase sesja użytkownika
│   │   ├── useClothes.js          # Pobieranie i lokalna mutacja ubrań
│   │   └── useOutfits.js          # Pobieranie i lokalna mutacja outfitów
│   ├── services/
│   │   ├── supabase.js            # Klient Supabase, CRUD, upload zdjęć, kompresja
│   │   ├── groq.js                # Groq API — analiza ubrania i skanowanie stylizacji
│   │   ├── styleScanner.js        # Algorytm dopasowania AI-items do szafy
│   │   ├── laundry.js             # Logika prania: filtrowanie brudnych, grupowanie, wsady
│   │   └── ai-features.js         # Placeholdery AI (nieimplementowane)
│   └── components/
│       ├── Auth/
│       │   └── Login.jsx          # Ekran logowania (email + hasło)
│       ├── Gallery/
│       │   ├── Gallery.jsx        # Główny widok szafy z filtrowaniem i wyszukiwaniem
│       │   ├── ClothingCard.jsx   # Kafelek ubrania w siatce (zdjęcie + kategoria + opis)
│       │   ├── SearchBar.jsx      # Overlay wyszukiwarki z chipami
│       │   ├── FilterSheet.jsx    # Bottom sheet z filtrami (kategorie, statusy, sezony)
│       │   └── FilterBar.jsx      # NIEUŻYWANY — legacy komponent, zastąpiony FilterSheet
│       ├── AddClothing/
│       │   ├── AddClothing.jsx    # Orchestrator dodawania — zarządza krokami
│       │   ├── PhotoStep.jsx      # Krok 1: wybór zdjęcia ubrania i metki
│       │   ├── AnalyzingStep.jsx  # Krok 2: animacja i komunikaty podczas analizy AI
│       │   └── FormStep.jsx       # Krok 3: formularz z danymi (wypełniony przez AI)
│       ├── ClothingDetail/
│       │   ├── ClothingDetail.jsx # Szczegóły ubrania, edycja, status, outfity
│       │   └── WashingInfo.jsx    # Sekcja pielęgnacji (temperatura, tryby, suszenie, prasowanie)
│       ├── Outfits/
│       │   ├── OutfitsScreen.jsx  # Lista outfitów + przycisk skanowania
│       │   ├── OutfitCard.jsx     # Karta outfitu z miniaturkami i edytowalną nazwą
│       │   ├── OutfitPicker.jsx   # Modal wyboru ubrań do outfitu z detalu
│       │   └── StyleScanner.jsx   # Skaner stylizacji (AI + dopasowanie do szafy)
│       ├── Laundry/
│       │   └── LaundryScreen.jsx  # Ekran prania z trzema sekcjami
│       └── UI/
│           ├── BottomNav.jsx      # Dolna nawigacja (5 przycisków)
│           ├── LoadingSpinner.jsx # Spinner + tekst
│           ├── ConfirmDialog.jsx  # Dialog potwierdzenia (np. usunięcia)
│           ├── StatusBadge.jsx    # Kolorowa etykieta statusu
│           └── TagList.jsx        # Wiersz pillek z tagami
```

### Przepływ danych

**Przy starcie aplikacji:**
1. `useAuth` → `supabase.getSession()` → user state
2. `useClothes` → `fetchClothes()` → `clothes[]` w hooku
3. `useOutfits` → `fetchOutfits()` → `outfits[]` w hooku
4. `App.jsx` przekazuje dane do komponentów przez props

**Dodanie ubrania:**
1. Użytkownik wybiera zdjęcie → `PhotoStep` zapisuje File do stanu
2. Klik "Analizuj" → `analyzeClothing(file, labelFile)` → Groq API (base64 + prompt)
3. Groq zwraca JSON → `AddClothing` mapuje pola na `formData`
4. Użytkownik edytuje/zatwierdza formularz
5. `handleSave()` → `uploadPhoto()` (kompresja + Supabase Storage) → `addClothing()` (Supabase DB)
6. `onSaved()` callback → `reload()` w `useClothes` → świeże dane w galerii

**Zmiana statusu ubrania:**
1. Klik na pill statusu w `ClothingDetail`
2. `updateClothing(id, { status })` → Supabase
3. `updateLocalItem(id, { status })` → optymistyczna aktualizacja w `useClothes`
4. `setCurrentItem()` → lokalna aktualizacja detalu bez przeładowania

**Zapis outfitu:**
1. `addOutfit({ name, clothing_ids, owner, notes })` → Supabase
2. `addOutfitLocal(outfit)` → optymistyczna aktualizacja w `useOutfits`
3. Widok listy outfitów odświeża się natychmiast

### Które komponenty rozmawiają z którymi

```
App.jsx
  ├─ Gallery ──── ClothingCard, SearchBar, FilterSheet
  ├─ ClothingDetail ──── WashingInfo, OutfitPicker, FormStep, ConfirmDialog
  ├─ AddClothing ──── PhotoStep, AnalyzingStep, FormStep
  ├─ OutfitsScreen ──── OutfitCard, StyleScanner
  │                       └─ StyleScanner ──── AddClothing (wewnętrzny overlay)
  ├─ LaundryScreen
  └─ BottomNav
```

### Co jest w hooku a co w lokalnym stanie

**Hooki (dane globalne, żyją przez cały czas aplikacji):**
- `useAuth` — sesja, user
- `useClothes` — lista ubrań, loading, error + mutacje optymistyczne
- `useOutfits` — lista outfitów, loading, error + mutacje optymistyczne

**Stan lokalny (żyje tylko w komponencie):**
- `App.jsx` — aktywny ekran, wybrany item, kierunek animacji, exiting states
- `Gallery` — viewMode, sheetFilters, searchOpen, searchQuery
- `ClothingDetail` — currentItem (lokalna kopia), editing, formData, saving
- `AddClothing` — step, clothingFile, labelFile, formData, manualMode
- `FilterSheet` — local filters (kopia do edycji), exiting, dragY
- `StyleScanner` — step, photoFile, scanResult, selected Set, saving, showNameModal

---

## 2. Ekrany

### Logowanie

**Co widzi:** Tytuł "Szafa 👗", pole email, pole hasło, przycisk "Zaloguj się", komunikat błędu.

**Interakcje:**
- Wpisanie email + hasło + klik "Zaloguj się" → `signIn(email, password)` → Supabase Auth
- Sukces → `onAuthStateChange` wykrywa zmianę → `useAuth` ustawia user → `App.jsx` pokazuje galerię
- Błąd → wyświetla `error.message` pod formularzem
- Przycisk jest disabled podczas wysyłania (`saving` state)

**Dane potrzebne:** brak (niezalogowany widok)  
**Co może pójść nie tak:** Złe hasło, brak połączenia, email nieistnieje — każdy błąd z Supabase trafia do `setError(err.message)`

---

### Galeria główna

**Co widzi:**
- Sticky header z: powitaniem ("Cześć, Mikołaj!"), liczbą ubrań, przyciskiem lupy (szukaj), awatarem
- Pasek: toggle Moje/Wspólna szafa | przycisk Filtruj
- Siatka 3 kolumn z kartami ubrań (zdjęcie + kategoria + kolor·materiał)
- Dolna nawigacja

**Interakcje:**
- Klik na kartę → `openDetail(item)` → ekran szczegółów (overlay slideInRight)
- Klik Szukaj → `searchOpen = true` → overlay wyszukiwarki
- Klik Filtruj → `showFilterSheet = true` → bottom sheet z filtrami
- Toggle Moje/Wspólna → `viewMode` zmiana → przefiltrowanie po `owner`
- Przytrzymanie awatara (>600ms) → `window.confirm("Wylogować się?")` → `signOut()`
- Scroll → karty wjeżdżają za sticky header z efektem blur

**Filtrowanie (3 etapy, useMemo):**
1. `viewMode === 'mine'` → filtruj po `item.owner === ownerName`
2. `applyFilters(sheetFilters)` → kategorie, statusy, sezony
3. `searchClothes(searchQuery)` → tekstowe dopasowanie we wszystkich polach

**Dane:** `clothes[]` z `useClothes`, `ownerName` z `getOwnerFromEmail(user.email)`  
**Co może pójść nie tak:** `error` state → wyświetla "Błąd: [message]"; `loading` → spinner

---

### Wyszukiwarka

**Co widzi:** Pole tekstowe z lupą, przycisk "Anuluj", chipy sugestii podzielone na sekcje (Kategorie, Kolory, Styl, Sezon). Po wpisaniu zapytania — siatka pasujących ubrań.

**Interakcje:**
- Klik na chip → `addChip(val)` → dodaje do query (jeśli jeszcze nie ma)
- Wpisanie tekstu → query change → przefiltrowanie w czasie rzeczywistym
- Klik ✕ w polu → czyści query
- Klik "Anuluj" → zamknięcie wyszukiwarki, wyczyszczenie query
- Klik na kartę ubrania → `onItemClick(item)` → szczegóły

**Algorytm wyszukiwania (`searchClothes`):**
Sprawdza `query.toLowerCase()` w: `category`, `material`, `notes`, `dominant_color`, `pattern`, `formality`, tablicach: `colors[]`, `style_tags[]`, `season[]`, `prompt_tags[]`

**Chipy sugestii:** generowane dynamicznie z bieżącej listy `clothes` (kolory slice 0-8, kategorie slice 0-6, style slice 0-6, wszystkie sezony)

**Dane:** przekazywane przez prop `clothes` (cały katalog, nie tylko filtrowany widok)

---

### Filtry (bottom sheet)

**Co widzi:** Ciemne tło (backdrop), panel wysuwający się od dołu z sekcjami: Kategorie (checkboxy-pills), Statusy (czyste/używane/w praniu), Sezony. Przyciski "Zastosuj" i "Reset".

**Interakcje:**
- Klik na chip → toggle w lokalnym stanie `local` (kopia aktywnych filtrów)
- Drag w dół > 80px → zamknięcie (drag-to-close gesture)
- Klik tła → zamknięcie
- "Zastosuj" → `onApply(local)` → sheetFilters w Gallery
- "Reset" → wyczyść lokalne + `onApply(EMPTY_FILTERS)`
- Zamknięcie → animacja `sheetExit` (translateY 0 → 110%), po 280ms odmontowanie

**Dane:** `activeFilters` (props) + `clothes` (dla listy dostępnych kategorii)  
**Uwaga:** Lista kategorii bierze `CATEGORIES` z constants, nie ze szafy — pokazuje wszystkie 16 nawet jeśli szafa jest pusta

---

### Szczegóły ubrania

**Co widzi:**
- Header: "← Wróć", "Edytuj", "Usuń"
- Zdjęcie ubrania (zaokrąglone, shadow)
- Miniatura metki w rogu (jeśli dodana) → klik = fullscreen z przyciskiem ✕
- Nazwa kategorii + właściciel
- Opis AI (2-3 zdania o stylu)
- Chipsety: materiał (niebieski), sezony (zielone), style_tags (fioletowe), kolory (szare)
- Sekcja pielęgnacji (WashingInfo): emoji symboli + temperatura + tryby
- Notatki (jeśli są)
- "Pasuje do" — miniatury ubrań ze wspólnych outfitów (klikalne → otwierają detal)
- Przycisk "+ Dodaj do outfitu"
- Pasek statusu na dole: Czyste | Używane | W praniu (sticky)

**Interakcje:**
- "← Wróć" → animacja slideOutRight (260ms) → galeria
- "Edytuj" → tryb edycji (FormStep z danymi)
- "Usuń" → ConfirmDialog → `deleteClothing(id)` + usunięcie zdjęć ze Storage
- Klik na pill statusu → `updateClothing(id, { status })` + optymistyczna aktualizacja
- Klik na miniaturę "Pasuje do" → `onItemClick(c)` → nowe szczegóły (key=id wymusza remount)
- "+ Dodaj do outfitu" → OutfitPicker modal
- Klik na miniaturę metki → `labelExpanded = true` → fullscreen z tłem + przycisk ✕

**Dane:** `item` (wybrany element), `clothes[]` (do sekcji "Pasuje do"), `outfits[]`

---

### Dodawanie ubrania — krok po kroku

#### Krok 1: PhotoStep
**Co widzi:** Nagłówek "← Wróć", strefa głównego zdjęcia (klik = aparat/galeria, aspect 4/3, max 50vh), strefa metki (mała, opcjonalna), przycisk "Analizuj ✨" (disabled bez zdjęcia). Dla DEV_EMAIL — dodatkowy przycisk "Tryb ręczny".

**Po wybraniu zdjęcia:** podgląd w strefie, tekst "Dotknij aby zmienić"  
**"Analizuj ✨"** → krok 2

#### Krok 2: AnalyzingStep
**Co widzi:** Fullscreen z animowanymi komunikatami (5 wiadomości, co 1800ms, fade in/out). Przykładowe: "Analizuję tkaninę...", "Sprawdzam kolory...", "Czytam metkę..."

**W tle:** `analyzeClothing(clothingFile, labelFile)` → Groq API (base64 zdjęcia + SYSTEM_PROMPT)  
**Sukces** → mapowanie AI JSON na formData → krok 3  
**Błąd** → wróć do kroku 1 z `error` message

#### Krok 3: FormStep
**Co widzi:** Formularz z sekcjami:
- **Właściciel** (MultiSelect: Mikołaj/Emilka)
- **Podstawowe** — kategoria, kolory[], materiał
- **Styl** — style_tags[], sezony[], dominant_color, secondary_colors[]
- **Szczegóły kroju** — fit, neckline, sleeve_length, length, pattern, formality
- **Pielęgnacja** — washing_temp, washing_mode, drying, ironing
- **Notatki** (textarea)
- Przycisk "Zapisz" (disabled jeśli brak owner)

**"Zapisz":**
1. `uploadPhoto(clothingFile, 'clothing')` → kompresja + Supabase Storage → photo_url
2. jeśli labelFile → `uploadPhoto(labelFile, 'labels')` → label_photo_url
3. `addClothing({ ...formData, photo_url, label_photo_url, ai_model: GROQ_MODEL, ai_confidence: 0.85 })`
4. `onSaved(newItem)` → `reload()` → powrót

#### Tryb ręczny (Mikołaj)
Dostępny tylko dla `DEV_EMAIL` (`mikolo321@gmail.com`). Pomija AI i przechodzi bezpośrednio do FormStep z pustym formularzem.

---

### Edycja ubrania

**Co widzi:** Ten sam formularz FormStep co przy dodawaniu, ale wypełniony aktualnym danymi. Header: "← Anuluj" | "Edycja".

**"← Anuluj"** → `setFormData(itemToFormData(currentItem))` → powrót do widoku  
**"Zapisz"** → `updateClothing(id, updates)` (stringi puste → null) → `setCurrentItem(updated)` + `onUpdated()`

---

### Outfity — lista

**Co widzi:** Nagłówek "Outfity" + liczba zestawów, przycisk "✨ Skanuj stylizację", lista kart outfitów lub pusty stan ("Brak outfitów, Dodaj ze szczegółów...").

**Karta outfitu:**
- Edytowalna nazwa (klik → input, blur/Enter → zapis)
- Właściciel | przycisk ✕ (usuń)
- Poziomy pasek miniaturek z kropkami statusu
- Klik na miniaturkę → `onItemClick(item)` → szczegóły ubrania

**Usunięcie outfitu:** `deleteOutfit(id)` → `onDeleted(id)` → `removeOutfitLocal(id)`

---

### Skaner Stylizacji — pełny flow

#### Krok 1: Zdjęcie
**Co widzi:** "Skaner Stylizacji", strefa zdjęcia (klik = galeria/aparat), przycisk "Analizuj stylizację ✨" (disabled bez zdjęcia).

#### Krok 2: Analiza
`analyzeOutfit(photoFile)` → Groq API z `OUTFIT_SCAN_PROMPT` → JSON z `detected_items[]`

#### Krok 3: Wyniki
**Co widzi:** Ogólny styl + okazja + sezon na górze. Dla każdego wykrytego elementu: typ ubrania + formalność + wzór, a poniżej "Masz to w szafie:" z miniaturkami (max 3, klikalne jako toggle). Jeśli brak dopasowania: "Nie masz tego w szafie" + przycisk "+ Dodaj [typ]".

**Algorytm dopasowania** (`matchItemToWardrobe`):
- category match: +40 pkt
- dominant_color match: +25 pkt
- pattern match: +15 pkt
- formality match: +10 pkt
- season overlap: +10 pkt
- Próg: score > 30, top 3 wyniki

**Przycisk "+ Dodaj"** → wewnętrzny overlay AddClothing (z-index 95) → po zapisie wraca do wyników skanera

**"Zapisz jako outfit"** (min 2 elementy) → modal z polem nazwy → `addOutfit({ name, clothing_ids, owner, notes })` gdzie notes = `${overall_style} · ${occasion}`

---

### Pranie — trzy sekcje

#### Sekcja 1: Kosz (ubrania do prania)
Wszystkie ubrania ze statusem "używane" lub "w praniu", pogrupowane po właścicielu.  
Każdy wiersz: miniaturka | kategoria + materiał | badge statusu | przycisk akcji:
- Używane → klik = zmień na "w praniu"
- W praniu → klik = zmień na "czyste" + `last_washed = now`

#### Sekcja 2: Rekomendowane wsady
`recommendLaundryLoads(dirtyClothes)` — grupuje po `(washing_temp, washing_mode)`:
- Każda grupa = jeden wsad (osobna karta `LoadCard`)
- Sortowanie rosnąco po temperaturze
- Wyświetla temp + tryb + liczbę rzeczy + miniaturki
- Przycisk "Oznacz jako wyprane ✓" → batch update statusu na "czyste"

#### Sekcja 3: Historia prania
`daysSince(item.last_washed)` dla każdego ubrania — "X dni temu". Brak jeśli `last_washed = null`.

**Dane:** `clothes[]` z hooka, `onUpdated` callback do aktualizacji lokalnego stanu

---

## 3. Serwisy

### groq.js — Groq API (Llama 4 Scout z Vision)

**Model:** `meta-llama/llama-4-scout-17b-16e-instruct`  
**URL:** `https://api.groq.com/openai/v1/chat/completions`

#### SYSTEM_PROMPT (analiza ubrania)
Pełna treść (linie 4-65):
```
Jesteś ekspertem od mody i pielęgnacji tekstyliów ze znajomością standardu ISO 3758.
Analizujesz zdjęcia ubrań i metek.
ZAWSZE odpowiadasz wyłącznie po polsku.

SYMBOLE NA METCE — odczytuj w kolejności lewo→prawo:

PRANIE (wanienka):
- liczba w środku = max temperatura (30/40/60/95°C)
- ręka = tylko pranie ręczne
- 1 kreska pod spodem = delikatny cykl
- 2 kreski = bardzo delikatny (wełna, jedwab)
- przekreślona = nie prać

BIELENIE (trójkąt): pusty = można / 2 linie ukośne = bez chloru / przekreślony = nie

SUSZENIE (kwadrat): koło = suszarka (1 kropka=niska, 2=normalna) / przekreślone koło = nie suszarką
                    pozioma linia = płasko / pionowa = na wieszaku

PRASOWANIE (żelazko): 1 kropka=110°C / 2 kropki=150°C / 3 kropki=200°C / przekreślone = nie

CZYSZCZENIE (koło): P = pralnia chemiczna / F = benzyną / przekreślone = nie czyścić

GDY BRAK METKI — szacuj z materiału:
bawełna→40-60°C normalny, wełna→30°C bardzo delikatny, jedwab→30°C ręcznie,
syntetyk→40°C delikatny, denim→30-40°C normalny, skóra→tylko pralnia chemiczna

Zwróć TYLKO JSON:
{ category, colors[], material, style_tags[], season[], washing_temp, washing_mode,
  drying, ironing, ai_description (2-3 zdania o wyglądzie — BEZ prania),
  prompt_tags[], fit, neckline, sleeve_length, length, pattern, formality,
  dominant_color, secondary_colors[] }
```

#### OUTFIT_SCAN_PROMPT (skanowanie stylizacji)
Pełna treść (linie 104-125):
```
Analizujesz zdjęcie osoby lub ułożonych ubrań jako stylizację.
Zidentyfikuj KAŻDY element ubrania który widzisz.
Dla każdego elementu zwróć szczegółową charakterystykę.
TYLKO JSON:
{
  "detected_items": [{
    "item_type": "typ po polsku",
    "dominant_color": "główny kolor po polsku",
    "secondary_colors": ["..."],
    "pattern": "wzór po polsku",
    "formality": "poziom formalności po polsku",
    "fit": "krój po polsku",
    "style_tags": ["tagi stylu po polsku"],
    "season": ["pory roku po polsku"],
    "match_score_factors": ["cechy do matchingu po polsku"]
  }],
  "overall_style": "ogólny styl stylizacji po polsku",
  "occasion": "okazja po polsku",
  "season_recommendation": "pora roku po polsku"
}
```

**Parametry wywołań:**
- `analyzeClothing`: temperature 0.2, max_tokens 1536
- `analyzeOutfit`: temperature 0.2, max_tokens 2048

**Wysyłane zdjęcia:** jako base64 data URL (`data:image/jpeg;base64,...`) w polu `image_url.url`

---

### supabase.js — Baza danych i Storage

#### Kompresja zdjęć (`compressImage`)
1. Tworzy `Image` element z URL pliku
2. Oblicza nowe wymiary: max 1200px (szerokość lub wysokość)
3. Rysuje na canvas z nowymi wymiarami
4. `canvas.toBlob(callback, 'image/jpeg', 0.82)` — jakość 82%
5. Fallback na oryginalny plik jeśli canvas niedostępny
6. Zwraca skompresowany `File`

#### Upload zdjęcia (`uploadPhoto`)
1. Kompresja obrazu
2. Unikalna nazwa pliku: `${folder}/${Date.now()}-${random}.jpg`
3. `supabase.storage.from('clothes-photos').upload(path, file, { cacheControl: '3600', upsert: false })`
4. `getPublicUrl(path)` → zwraca publicUrl

#### Usunięcie zdjęcia (`deletePhoto`)
Wyciąga ścieżkę z publicUrl przez split, wywołuje `storage.remove([path])`

---

### styleScanner.js — Algorytm dopasowania

```javascript
function normalize(s)       // s.toLowerCase().trim()
function textMatch(a, b)    // normalize(a) === normalize(b) || jedna zawiera drugą
function seasonOverlap(detectedSeasons, itemSeasons)  // any matching season

export function matchItemToWardrobe(detectedItem, clothes) {
  return clothes
    .map(item => {
      let score = 0
      if (textMatch(detectedItem.item_type, item.category)) score += 40
      if (textMatch(detectedItem.dominant_color, item.dominant_color) ||
          item.colors?.some(c => textMatch(c, detectedItem.dominant_color))) score += 25
      if (textMatch(detectedItem.pattern, item.pattern)) score += 15
      if (textMatch(detectedItem.formality, item.formality)) score += 10
      if (seasonOverlap(detectedItem.season, item.season)) score += 10
      return { ...item, _score: score }
    })
    .filter(item => item._score > 30)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
}
```

Minimalna punktacja do wyświetlenia: **31 punktów** (czyli samo trafienie w kategorię = 40 pkt = wystarcza). Zwraca max 3 najlepsze dopasowania.

---

### laundry.js — Logika prania

```javascript
export function getDirtyClothes(clothes)
  // clothes.filter(c => [STATUSES.USED, STATUSES.WASHING].includes(c.status))

export function groupByOwner(clothes)
  // Reduce do { owner: [items] }

export function recommendLaundryLoads(clothes)
  // 1. getDirtyClothes(clothes)
  // 2. Grupuj po `${item.washing_temp}_${item.washing_mode}` (composite key)
  // 3. Każda unikalna kombinacja = jeden wsad
  // 4. Sortuj wsady rosnąco po washing_temp
  // 5. Zwraca [{ temp, mode, items[] }]

export function daysSince(dateStr)
  // Jeśli !dateStr → null
  // Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
```

---

### ai-features.js — Niezaimplementowane

Trzy puste funkcje zwracające `null` z komentarzami TODO:
```javascript
export const enhanceClothingPhoto = async (photoUrl) => null
// TODO: integracja z DALL-E / Stable Diffusion do generowania lepszych zdjęć

export const getStyleRecommendations = async (prompt, clothes) => null
// TODO: wysłać clothes[] + pytanie do AI i otrzymać stylingowe sugestie

export const getLaundryRecommendations = async (clothes) => null
// TODO: AI-based analiza kolorów/materiałów/temperatur dla lepszych wsadów
```

---

## 4. Baza danych

### Tabela `clothes`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Klucz główny |
| `created_at` | timestamp | Data dodania, używana do sortowania |
| `owner` | text | Właściciel: 'Mikołaj' lub 'Emilka' |
| `category` | text | Kategoria z listy CATEGORIES (16 opcji) |
| `colors` | text[] | Tablica kolorów (legacy, AI często wypełnia multiple) |
| `dominant_color` | text | Jeden główny kolor po polsku |
| `secondary_colors` | text[] | Dodatkowe kolory po polsku |
| `material` | text | Materiał ubrania (może być po angielsku z AI) |
| `pattern` | text | Wzór: jednolity, w kratę, w paski itp. |
| `fit` | text | Krój: slim, regular, oversized itp. |
| `neckline` | text | Typ dekoltu: okrągły, V, polo, kaptur itp. |
| `sleeve_length` | text | Długość rękawa: bez rękawów, krótki, 3/4, długi |
| `length` | text | Długość ubrania: krótki, do kolan, midi, maxi |
| `formality` | text | Poziom formalności: bardzo casualowy → formalny |
| `style_tags` | text[] | Tagi stylu (max ~10) |
| `season` | text[] | Pory roku: wiosna, lato, jesień, zima |
| `prompt_tags` | text[] | Tagi z AI do wyszukiwania (5-10 słów kluczowych) |
| `washing_temp` | integer | Temperatura prania w °C (30/40/60/95) lub null |
| `washing_mode` | text | Tryb prania: normalny, delikatny, ręczny itp. |
| `drying` | text | Sposób suszenia |
| `ironing` | text | Dopuszczalna temperatura prasowania |
| `status` | text | Stan: 'czyste', 'używane', 'w praniu' |
| `last_washed` | timestamp | Data ostatniego prania (ustawiana przy oznaczeniu jako "czyste") |
| `ai_description` | text | Opis stylu/wyglądu (2-3 zdania, tylko po polsku) |
| `notes` | text | Ręczne notatki użytkownika |
| `photo_url` | text | Publiczny URL zdjęcia w Supabase Storage |
| `label_photo_url` | text | Publiczny URL zdjęcia metki (opcjonalne) |
| `ai_model` | text | Nazwa modelu AI który analizował ('meta-llama/...') |
| `ai_confidence` | float | Hardcoded: 0.85 |
| `embedding_ready` | boolean | true jeśli ma category + colors[] + washing_temp |

### Tabela `outfits`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Klucz główny |
| `created_at` | timestamp | Data utworzenia |
| `owner` | text | Właściciel zestawu |
| `name` | text | Nazwa outfitu (edytowalna inline) |
| `clothing_ids` | uuid[] | Tablica ID ubrań należących do outfitu |
| `notes` | text | Notatki (Skaner wypełnia: `${overall_style} · ${occasion}`) |

### Storage (bucket: `clothes-photos`)

**Ścieżki plików:**
- Zdjęcia ubrań: `clothing/{timestamp}-{random_string}.jpg`
- Zdjęcia metek: `labels/{timestamp}-{random_string}.jpg`

Pliki są publiczne (przez publicUrl). Kompresja przed uploadem — max 1200px, JPEG 82%.

---

## 5. Animacje i UX

### Wszystkie animacje CSS

| Nazwa | Opis | Gdzie używana |
|-------|------|---------------|
| `cardEnter` | opacity 0→1, translateY 18px→0 | `.clothing-card` (staggered delay 55ms per index) |
| `slideInRight` | translateX 100%→0, opacity 0.85→1 | Ekrany wchodzące z prawej |
| `slideInLeft` | translateX -100%→0, opacity 0.8→1 | Ekrany wchodzące z lewej |
| `slideOutRight` | translateX 0→100%, opacity | Ekrany wychodzące w prawo |
| `slideUpIn` | translateY 60px→0, opacity | AddClothing overlay |
| `sheetEnter` | translateY(100%)→(0) | FilterSheet wejście |
| `sheetExit` | translateY(0)→(110%) | FilterSheet wyjście |
| `backdropIn/Out` | opacity 0→0.35 / powrót | Tło FilterSheet |
| `navTabBounce` | scale 1→1.22→0.95→1 | Aktywna ikona w BottomNav |
| `pillPop` | scale 1→1.06→1 | Tagi/pills przy dodaniu |
| `shimmer` | background-position slide | Placeholder ładowania zdjęcia w karcie |
| `iconSway` | rotate ±5deg | Ikona 👗 w pustym stanie galerii |
| `fadeIn/Out` | opacity | AnalyzingStep komunikaty |
| `checkPop` | scale 0→1.2→1 | Zaznaczenie w StyleScanner |
| `itemExit` | opacity 0, translateX 20px, collapse | Znikanie rzeczy z LoadCard po oznaczeniu |

### Przejścia między ekranami

- **Gallery → Outfits/Laundry**: kierunkowe (`screen-enter-right` lub `screen-enter-left`) zależnie od indeksu zakładki
- **Outfits/Laundry → Gallery**: `screen-exit-right` (overlay wyjeżdża w prawo, 260ms), potem odmontowanie
- **Gallery → Detail**: `screen-slide-enter` (slideInRight)
- **Detail → Gallery**: `screen-slide-exit` (slideOutRight, 200ms), potem odmontowanie
- **Gallery → Add**: `screen-slide-up` (slideUpIn)
- **Scanner wewnętrzny overlay**: `screen-slide-enter` (z-index 95)

### Micro-interactions

- **Klik na kartę ubrania**: `transform: scale(0.96)` + shadow reduction
- **Hover na kartę** (desktop): `translateY(-3px)` + stronger shadow
- **Klik na przycisk**: `scale(0.97)` + `opacity: 0.85` (globalny, z wyjątkami)
- **Aktywna zakładka nav**: `navTabBounce` (spring easing)
- **Pill/tag dodanie**: `pillPop` scale 1.06
- **Avatar przytrzymanie**: bezpośrednia akcja po 600ms bez wizualnego feedbacku
- **FilterSheet drag**: transform translateY($dragY) w czasie rzeczywistym
- **Sticky header**: `backdrop-filter: blur(14px)`, opacity 0.55 tła przy scroll

---

## 6. Znane problemy i TODO

### Console.log / console.error w kodzie

Wszystkie `console.error` (intencjonalne — do debugowania błędów):
- `ClothingDetail.jsx` linie ~55, ~100: błąd statusu, błąd usunięcia
- `OutfitCard.jsx` linie ~21, ~30: błąd zapisu nazwy, błąd usunięcia
- `StyleScanner.jsx` linia ~152: błąd skanowania
- `StyleScanner.jsx` linia ~183: błąd zapisu outfitu
- `AddClothing.jsx` linia ~83: błąd analizy AI
- `OutfitPicker.jsx` linia ~29: błąd zapisu

Brak `console.log` (debug) — tylko `console.error` w catch blokach.

### Hardcoded wartości

| Wartość | Lokalizacja | Uwaga |
|---------|-------------|-------|
| `'mikolo321@gmail.com'` | `constants.js:DEV_EMAIL` | Tryb ręczny dostępny tylko dla tego emaila |
| `['Mikołaj', 'Emilka']` | `constants.js:OWNERS` | Hardcoded właściciele |
| `0.85` | `AddClothing.jsx` | ai_confidence — zawsze stałe |
| `1200` | `supabase.js` | Max wymiar kompresji |
| `0.82` | `supabase.js` | Jakość JPEG |
| `80` | `FilterSheet.jsx` | Próg drag-to-close (px) |
| `2` | `StyleScanner.jsx` | Min elementy do zapisania outfitu |
| `1800` | `AnalyzingStep.jsx` | Interwał zmiany wiadomości (ms) |
| `600` | `Gallery.jsx` | Czas przytrzymania awatara (ms) |
| `260` | `App.jsx` | Czas animacji wyjścia (ms) |
| `3600` | `supabase.js` | Cache-Control dla Storage (s) |

### Brakująca obsługa błędów

1. **`LaundryScreen.jsx`** — `Promise.all()` na batch updateClothing bez catch i bez error state w UI
2. **`OutfitCard.jsx`** — `saveName()` nie pokazuje błędu użytkownikowi, nazwa wraca do starej bez komunikatu
3. **`FilterSheet.jsx`** — drag gesture nie obsługuje przypadku gdy dotyk wychodzi poza element
4. **`Gallery.jsx`** — `signOut()` po `window.confirm()` bez obsługi błędu wylogowania
5. **`ClothingDetail.jsx`** — `deletePhoto()` wywoływany z `.catch(console.warn)` — błąd usunięcia zdjęcia ze Storage jest milcząco ignorowany

### TODO / FIXME w kodzie

- `ai-features.js` linia 3: `// TODO: integracja z DALL-E / Stable Diffusion`
- `ai-features.js` linia 6: `// TODO: prompt + clothes context do rekomendacji`
- `ai-features.js` linia 9: `// TODO: AI analiza dla lepszych wsadów prania`

---

## 7. Co NIE zostało zaimplementowane

### Funkcje w ai-features.js (puste placeholdery)

1. **`enhanceClothingPhoto(photoUrl)`** — ulepszanie zdjęć przez DALL-E lub Stable Diffusion. Zwraca `null`.
2. **`getStyleRecommendations(prompt, clothes)`** — AI sugestie stylizacyjne na podstawie pytania i całej szafy. Zwraca `null`.
3. **`getLaundryRecommendations(clothes)`** — AI-based analiza dla inteligentniejszych wsadów prania. Zwraca `null`.

### "Wkrótce" w UI

- **BottomNav.jsx** — 5. przycisk "Chat" jest całkowicie wyłączony (`nav-tab-disabled`), z badge "wkrótce". Brak komponentu ChatScreen w projekcie.

### Niezaimplementowane funkcje zidentyfikowane podczas analizy

- **Brak widoku historii prania** — `daysSince()` i `last_washed` istnieją w bazie, ale LaundryScreen nie ma sekcji historii (dane są tam ale brak dedykowanego widoku)
- **Brak filtrów w wyszukiwarce po nowych polach** — `fit`, `neckline`, `sleeve_length`, `length`, `formality` nie są opcjami w FilterSheet
- **Brak sortowania galerii** — zawsze sort po `created_at desc`
- **Brak wielokrotnego wyboru zdjęć** — jeden outfit = jedno zdjęcie analizy, brak możliwości analizy kilku zdjęć razem
- **Brak powiadomień push** — Service Worker zarejestrowany, ale bez push notifications
- **Brak sharing** — nie można udostępnić outfitu ani zdjęcia ubrania
- **Brak eksportu danych** — brak opcji backup / export szafy
- **Brak onboardingu** — nowy użytkownik widzi od razu pustą galerię bez przewodnika
- **`FilterBar.jsx`** — komponent istnieje w projekcie ale nie jest importowany ani używany nigdzie (legacy)
- **`embedding_ready`** pole w bazie — wypełniane przy zapisie, ale nigdy nie jest wykorzystywane do żadnej logiki w aplikacji

---

*Koniec raportu.*
