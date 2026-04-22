# DATA-AUDIT.md — Wardrobe Wizard
_Wygenerowano: 2026-04-21 | Baza: Supabase altitfgqnxnohiqdkmrq | Rekordów: 4_

---

## 1. Przykładowy rekord (prawdziwe dane z bazy)

```json
{
  "id": "181a6ae1-5598-4968-a917-5ecfeb59c0bf",
  "created_at": "2026-04-20T17:23:41.052142+00:00",
  "owner": "Mikołaj",
  "photo_url": "https://altitfgqnxnohiqdkmrq.supabase.co/.../Płaszcz.jpg",
  "label_photo_url": "https://altitfgqnxnohiqdkmrq.supabase.co/.../metka.jpg",
  "category": "Płaszcz",
  "colors": ["czarny"],
  "material": "Poliester",
  "style_tags": ["klasyczny", "formalny"],
  "season": ["jesień", "wiosna"],
  "washing_temp": 30,
  "washing_mode": "delikatne",
  "drying": "nie używać suszarki",
  "ironing": "niska temperatura",
  "ai_description": "Czarny płaszcz z metką zalecającą pranie w 30°C w trybie delikatnym, bez suszenia w suszarce i prasowania powyżej 110°C.",
  "status": "używane",
  "notes": null,
  "ai_confidence": 0.85,
  "ai_model": "meta-llama/llama-4-scout-17b-16e-instruct",
  "image_enhanced_url": null,
  "prompt_tags": ["czarny płaszcz", "zima", "formalny", "klasyczny", "delikatne pranie"],
  "embedding_ready": true,
  "last_washed": null,
  "fit": "regularny",
  "neckline": "nieokreślony",
  "sleeve_length": "długi",
  "length": "do połowy uda",
  "pattern": "jednolity",
  "formality": "formalny",
  "dominant_color": "czarny",
  "secondary_colors": [],
  "is_favorite": false,
  "clothing_layer": null
}
```

---

## 2. Aktualna struktura danych — tabela z oceną

| Pole | Typ | Wypełnienie | Źródło | Użycie w UI | Ocena jakości |
|------|-----|------------|--------|-------------|---------------|
| `id` | uuid | 100% | system | powiązania | ✅ 5/5 |
| `created_at` | timestamp | 100% | system | kolejność | ✅ 5/5 |
| `owner` | text | 100% | użytkownik | filtrowanie, widok | ✅ 5/5 |
| `photo_url` | text | 100% | system (upload) | galeria, detale | ✅ 5/5 |
| `label_photo_url` | text | 75% | użytkownik (opcja) | detale (metka) | ✅ 4/5 |
| `category` | text | 100% | AI | galeria, filtr, chat | ⚠️ 3/5 — brak podkategorii |
| `colors` | text[] | 100% | AI | detale, chat | ⚠️ 3/5 — mix PL/EN |
| `dominant_color` | text | 50% | AI | chat context | ⚠️ 2/5 — tylko nowe rekordy |
| `secondary_colors` | text[] | 25% | AI | nieużywane w UI | ⚠️ 2/5 — rzadko wypełniane |
| `material` | text | 100% | AI | detale, pranie | ❌ 2/5 — 1 rekord po angielsku |
| `style_tags` | text[] | 100% | AI | detale, chat | ❌ 2/5 — mix PL/EN |
| `season` | text[] | 100% | AI | detale, filtr, chat | ❌ 1/5 — poważny mix: ["winter","autumn","jesień","zima"] |
| `washing_temp` | int4 | 100% | AI (z metki) | pranie, pielęgnacja | ✅ 5/5 |
| `washing_mode` | text | 100% | AI (z metki) | pranie, pielęgnacja | ✅ 5/5 |
| `drying` | text | 100% | AI (z metki) | pielęgnacja | ✅ 5/5 |
| `ironing` | text | 100% | AI (z metki) | pielęgnacja | ✅ 5/5 |
| `status` | text | 100% | użytkownik | galeria, pranie, chat | ✅ 5/5 |
| `last_washed` | timestamp | 25% | system (po praniu) | pranie (dni temu) | ✅ 4/5 — niska wartość bo nikt nie pierze |
| `notes` | text | 0% | użytkownik | detale | — nieużywane |
| `ai_description` | text | 100% | AI | detale, chat context | ❌ 2/5 — patrz sekcja 6 |
| `prompt_tags` | text[] | 75% | AI | chat context | ❌ 2/5 — mix PL/EN, mała trafność |
| `ai_confidence` | float | 75% | AI | nieużywane w UI | ⚠️ 3/5 — zbierane ale ignorowane |
| `ai_model` | text | 75% | system | nieużywane w UI | ✅ 4/5 — przydatne do audytu |
| `image_enhanced_url` | text | 0% | system (plan) | nieużywane | — feature niezaimplementowany |
| `embedding_ready` | bool | 100% | system | nieużywane | ⚠️ — flaga bez backendu embeddingów |
| `fit` | text | 50% | AI | detale, chat | ⚠️ 3/5 — tylko nowe rekordy |
| `neckline` | text | 50% | AI | detale | ⚠️ 3/5 — "nieokreślony" w danych |
| `sleeve_length` | text | 50% | AI | nieużywane w UI | ⚠️ 3/5 — tylko nowe rekordy |
| `length` | text | 50% | AI | nieużywane w UI | ⚠️ 3/5 — tylko nowe rekordy |
| `pattern` | text | 50% | AI | nieużywane w UI | ⚠️ 3/5 — tylko nowe rekordy |
| `formality` | text | 50% | AI | chat context | ⚠️ 3/5 — tylko nowe rekordy |
| `clothing_layer` | text | 25% | AI | logika warstw w chat | ❌ 1/5 — krytyczne, prawie puste |
| `is_favorite` | bool | 100% | użytkownik | filtr, detale | ✅ 5/5 |

---

## 3. System prompt AI — analiza

### groq.js — analyzeClothing

Model: `meta-llama/llama-4-scout-17b-16e-instruct` (Llama 4 Scout)
Temperature: 0.2 | Max tokens: 1536

**Pola JSON które AI zwraca:**
```
category, colors, material, style_tags, season,
washing_temp, washing_mode, drying, ironing,
ai_description, prompt_tags,
fit, neckline, sleeve_length, length, pattern, formality,
dominant_color, secondary_colors, clothing_layer
```

**Czego AI NIE zwraca (brakuje w prompcie):**
- marka/producent
- podkategoria
- okazja (praca/sport/wieczór)
- skład % materiałów
- typ zapięcia

### chat.js — kontekst dla rekomendacji

AI w chacie widzi: `id, category, dominant_color, material, formality, pattern, season, style_tags, prompt_tags, ai_description, fit, status, owner, clothing_layer`

**Czego chat NIE widzi:** `colors, neckline, sleeve_length, length, secondary_colors`

---

## 4. Ocena jakości danych AI — rzeczywiste problemy

### ❌ Problem 1: Wielojęzyczność danych

```
season: ["winter", "autumn", "jesień", "zima"]  ← TEN SAM REKORD
style_tags: ["casual", "winter", "denim"]        ← po angielsku
material: "denim with sherpa fleece lining"       ← po angielsku
prompt_tags: ["casual winter outfit", "denim jacket"] ← po angielsku
ai_description: "This is a blue denim jacket..."  ← po angielsku
```

**Przyczyna:** Prompt mówi "ZAWSZE odpowiadasz wyłącznie po polsku" ale AI ignoruje to dla niektórych ubrań (prawdopodobnie gdy zdjęcie zawiera angielskie napisy lub metki).

**Skutek:** Chat i filtrowanie działają niespójnie — "jesień" i "autumn" to ten sam sezon ale dwa różne stringi.

### ❌ Problem 2: ai_description opisuje pranie zamiast stylu

```
ai_description: "Czarny płaszcz z metką zalecającą pranie w 30°C 
w trybie delikatnym, bez suszenia w suszarce i prasowania powyżej 110°C."
```

Prompt żąda "2-3 zdania WYŁĄCZNIE o wyglądzie i stylu — BEZ informacji o praniu" — AI to ignoruje w tym rekordzie. Opis jest bezużyteczny dla rekomendacji stylu.

### ⚠️ Problem 3: clothing_layer = 25% wypełnione

Tylko 1 z 4 rekordów ma `clothing_layer`. To pole jest **krytyczne** dla logiki warstw w chacie — bez niego chat nie może poprawnie rekomendować pełnych stylizacji.

### ⚠️ Problem 4: Nowe pola tylko dla nowych rekordów

`fit`, `neckline`, `sleeve_length`, `length`, `pattern`, `formality`, `dominant_color` — wszystkie 50% wypełnione. Stare rekordy mają null. Chat je widzi, ale połowa szafy jest bez tych danych.

### ⚠️ Problem 5: prompt_tags mają niską trafność

```
prompt_tags płaszcza: ["czarny płaszcz", "zima", "formalny", "klasyczny", "delikatne pranie"]
```
"delikatne pranie" jako prompt tag do rekomendacji jest bezużyteczny. Tagi powinny opisywać kontekst użycia, nie pielęgnację.

---

## 5. Checklist luk w metadanych

### IDENTYFIKACJA UBRANIA
- [x] Kategoria główna — `category` ✅
- [ ] Podkategoria — BRAK (np. "koszula casual" vs "koszula formalna")
- [ ] Marka/producent — BRAK
- [x] Kolor dominujący — `dominant_color` ⚠️ 50%
- [x] Kolory pomocnicze — `secondary_colors` ⚠️ 25%
- [x] Wzór — `pattern` ⚠️ 50%
- [x] Materiał główny — `material` ⚠️ mix języków
- [ ] Skład % — BRAK (np. "80% cotton, 20% polyester")

### KRÓJ I FIT
- [x] Krój ogólny — `fit` ⚠️ 50%
- [x] Długość rękawa — `sleeve_length` ⚠️ 50%
- [x] Długość ubrania — `length` ⚠️ 50%
- [x] Dekolt/kołnierz — `neckline` ⚠️ 50%
- [ ] Typ zapięcia — BRAK (guziki, zamek, zatrzaski)

### STYL I KONTEKST
- [x] Formalność — `formality` ⚠️ 50%
- [x] Tagi stylu — `style_tags` ⚠️ mix języków
- [ ] Okazja — BRAK (praca, sport, wieczór, casualowe wyjście)
- [x] Pora roku — `season` ❌ mix PL/EN
- [x] Prompt tagi — `prompt_tags` ❌ niska jakość

### PIELĘGNACJA
- [x] Temperatura prania — `washing_temp` ✅
- [x] Tryb prania — `washing_mode` ✅
- [x] Suszenie — `drying` ✅
- [x] Prasowanie — `ironing` ✅
- [ ] Bielenie — BRAK
- [ ] Czyszczenie chemiczne — BRAK

### STAN I HISTORIA
- [x] Status — `status` ✅
- [x] Ostatnie pranie — `last_washed` ⚠️ 25%
- [x] Data dodania — `created_at` ✅
- [x] Ulubione — `is_favorite` ✅
- [x] Notatki — `notes` — pole istnieje, 0% użycia

### DANE AI
- [x] Model — `ai_model` ⚠️ 75%
- [x] Pewność — `ai_confidence` ⚠️ 75% (zbierane, nieużywane)
- [x] Embedding ready — `embedding_ready` ⚠️ flaga bez backendu
- [x] Opis AI — `ai_description` ❌ niska jakość
- [ ] Enhanced photo — `image_enhanced_url` — 0%, niezaimplementowane

---

## 6. Rekomendowane nowe pola (top 8)

| Pole | Typ | Uzasadnienie | AI ze zdjęcia? | Priorytet |
|------|-----|-------------|----------------|-----------|
| `occasion` | text[] | Kluczowe dla rekomendacji ("do pracy", "na wieczór", "sport") — AI ma `formality` ale nie kontekst okazji | ✅ tak | **WYSOKI** |
| `subcategory` | text | "Koszula casual" vs "koszula formalna" vs "koszula oxford" — rozbija ogólne kategorie | ✅ tak | **WYSOKI** |
| `brand` | text | Personalizacja, rozmiar, jakość materiału. AI może odczytać z metki | ⚠️ tylko z metki | **ŚREDNI** |
| `color_normalized` | text | Znormalizowany kolor (enum: czarny/biały/szary/niebieski/...) — eliminuje chaos "granatowy"/"dark blue"/"navy" | ✅ tak | **WYSOKI** |
| `season_normalized` | text[] | Enum tylko PL: ["wiosna","lato","jesień","zima"] — eliminuje mix języków | ✅ tak (refactor) | **WYSOKI** |
| `times_worn` | int4 | Licznik założeń — pozwala rekomendować rzadko używane ubrania | ❌ manualnie | **ŚREDNI** |
| `last_worn` | timestamp | Data ostatniego założenia — "Co dawno nie zakładałem?" bez tego nie działa rzetelnie | ❌ manualnie | **ŚREDNI** |
| `fabric_composition` | text | "80% bawełna, 20% poliester" — AI może odczytać z metki, ważne dla alergii i pielęgnacji | ⚠️ tylko z metki | **NISKI** |

---

## 7. Raport końcowy

### Ocena ogólna gotowości danych pod AI rekomendacje: **52%**

| Kategoria | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Kompletność pól | 60% | Nowsze pola (fit, layer, formality) tylko w połowie rekordów |
| Jakość języka | 30% | Poważny mix PL/EN w season, style_tags, material, ai_description |
| Użyteczność dla chatu | 55% | clothing_layer krytyczne dla warstw — 25% wypełnienia |
| Pielęgnacja | 95% | Najlepiej wypełniony obszar — metki działają świetnie |
| Opis stylistyczny | 25% | ai_description opisuje pranie zamiast stylu w 50% rekordów |
| Tagi do rekomendacji | 35% | prompt_tags mają niską trafność, mix języków |

### Trzy najpilniejsze naprawy

1. **Znormalizować język** — wymusić PL w system prompcie mocniej + dodać post-processing który normalizuje season do enum `["wiosna","lato","jesień","zima"]`
2. **Naprawić ai_description** — prompt jest poprawny ale AI go ignoruje; dodać walidację że opis nie zawiera słów "pranie/temperatura/suszarka"
3. **Backfill clothing_layer** — uruchomić re-analizę dla 3 rekordów bez tej wartości (bez re-uploadu zdjęć — tylko re-analiza z istniejącego photo_url)

### Dane które działają dobrze ✅
- Pielęgnacja (washing_temp/mode/drying/ironing) — bardzo wysoka jakość
- Status i historia prania — kompletne
- Podstawowe atrybuty (category, colors, material) — obecne wszędzie
- System warstwowy (clothing_layer) — logika w chacie gotowa, dane do uzupełnienia
