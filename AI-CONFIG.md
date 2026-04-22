# AI-CONFIG.md — Konfiguracja i logika AI w Wardrobe Wizard
> Dokumentacja dla przyszłych sesji Claude · Senior AI Architect · 2026-04-22
> **Cel:** nowa sesja bez kontekstu musi w pełni rozumieć jak, dlaczego i w jakich granicach działa AI.

---

## 1. Filozofia AI w aplikacji

### Kim jest SZAFir

SZAFir to **persona, nie narzędzie**. Nie jest ogólnym asystentem który "pomaga z modą" — jest konkretną postacią: przyjacielskim osobistym stylistą który **zna Twoją szafę na pamięć** i mówi Ci wprost co założyć. Kluczowe rozróżnienie: ChatGPT odpowie na pytanie o modę w ogóle; SZAFir odpowiada wyłącznie tym, co fizycznie wisi w Twojej szafie.

### Ton i persona

- **Ciepły, naturalny, jak dobry znajomy** — nie robot, nie asystent korporacyjny
- **Ma opinię** — gdy coś nie pasuje, mówi to życzliwie ale wprost ("ta kombinacja trochę nie gra, spróbuj...")
- **Ma poczucie humoru** — może żartować, używa polskich zwrotów potocznych
- **Konkretny** — nie odpowiada ogólnikami. Zamiast "może jakiś sweter?" mówi "szary sweter wełniany z szafy, ten z kratą"
- **Adresuje braki** — gdy szafa nie ma kurtki a na dworze 5°C, informuje o tym raz i sugeruje zakup

### Wartości do respektowania

1. **Prawdziwość szafy** — nigdy nie wymyślaj ubrań które nie istnieją w danych
2. **Kompletność** — minimum 2 elementy na każdą rekomendację (pojedynczy element to niepełna porada)
3. **Kontekst** — uwzględniaj pogodę, porę dnia, dzień tygodnia, okazję
4. **Właściciel** — rekomenduj ubrania właściwej osoby (Mikołaj vs Emilka)

### Guardrails — czego SZAFir nie wolno

| Zakaz | Dlaczego |
|-------|----------|
| Wymyślać ubrania których nie ma | Frustrowałoby użytkownika ("ale nie mam tego") |
| Rekomendować brudne/w praniu | Nie można ich założyć — filtr na poziomie JS |
| Polecać jedno ubranie | Stylizacja to zestaw, nie element |
| Używać UUID w odpowiedzi tekstowej | Brzydkie, dezorientujące dla użytkownika |
| Kłamać gdy szafa pusta | Lepiej powiedzieć "brak czystych ubrań" |

### Balans: elastyczność vs konkretność

AI operuje na skali: gdy zapytanie jest vague (samo "co założyć?"), zadaje **jedno** pytanie pomocnicze (nie zasypuje pytaniami). Gdy kontekst jest jasny (np. "co na randkę przy 8°C?"), od razu rekomenduje. Zasada: **pytaj tylko gdy brak kluczowej informacji uniemożliwia dobrą odpowiedź**.

---

## 2. Architektura — dwa modele

### Model 1: Vision — `meta-llama/llama-4-scout-17b-16e-instruct`

**Do czego:** Analiza zdjęć ubrań i metek (AddClothing + StyleScanner).

**Dlaczego ten model:**
- Multimodal (przyjmuje obrazy w base64)
- Szybki — Groq inference ~2–5s dla analizy ubrania
- Wystarczająco precyzyjny dla ustrukturyzowanych pól (kategoria, kolor, materiał)
- Tańszy niż GPT-4V przy podobnej jakości dla tego zadania

**Parametry:** `temperature: 0.2` — niska temperatura bo oczekujemy deterministycznych, faktycznych odpowiedzi (kolor to kolor, temp prania to liczba). Wysoka temperatura dodałaby "kreatywność" która tu jest błędem.

### Model 2: Reasoning — `llama-3.3-70b-versatile`

**Do czego:** Chat stylistyczny — rozumienie zapytań, rekomendacje, konwersacja.

**Dlaczego ten model:**
- 70B parametrów = znacznie lepsza rozumowanie niż modele vision (17B)
- "versatile" = dobry w konwersacji, stylizacji tekstu, logicznym wnioskowaniu
- Brak konieczności widzenia obrazów (szafa jest przekazana jako tekst)

**Parametry:** `temperature: 0.7` — wyższa temperatura bo tu liczy się naturalność języka i kreatywność w łączeniu ubrań. Zbyt niska temperatura dawałaby sztywne, robotyczne odpowiedzi.

### Dlaczego nie jeden model do wszystkiego

1. **Koszt i szybkość:** Model 70B do analizy zdjęć byłby wolniejszy i droższy. Użytkownik dodający ubranie czeka już 2–5s — 70B vision przedłużyłoby to 2–3x.
2. **Specjalizacja:** Modele vision są trenowane pod ekstrakcję faktów z obrazu; modele reasoning pod konwersację. Użycie jednego do obu zadań to kompromis w dół.
3. **Flexiblność:** Można wymienić jeden model niezależnie od drugiego (np. gdy wyjdzie lepszy model vision, chat pozostaje niezmieniony).

### Kompromisy tej decyzji

- **Pro:** optymalna prędkość i jakość dla każdego zadania, niższe koszty
- **Con:** dwa API key paths do zarządzania (oba używają tego samego `VITE_GROQ_API_KEY`), różne zachowania błędów, trudniej testować end-to-end

---

## 3. Analiza zdjęć ubrań

### Co AI widzi i co rozpoznaje

Prompt przekazuje: zdjęcie ubrania (zawsze) + opcjonalnie zdjęcie metki. AI zwraca ~25 pól JSON. Każde pole ma konkretne uzasadnienie dla aplikacji:

| Pole | Co oznacza | Dlaczego ważne dla aplikacji |
|------|-----------|------------------------------|
| `name` | Krótka nazwa opisowa (max 5 słów, bez kategorii) | Wyświetlana w galerii i w chacie — musi być czytelna. "Jeansowa z futerkiem sherpa" jest lepsza niż "kurtka jeansowa z futerkiem sherpa" |
| `category` | Jedna z 19 predefiniowanych kategorii | Galeria filtruje po kategorii. Nieustrukturyzowane kategorie uniemożliwiają filtrowanie |
| `subcategory` | Uszczegółowienie kategorii | Precyzja — "koszula oxford" vs "koszula hawajska" to różne okazje użycia |
| `colors` + `dominant_color` | Kolory ubrania | Filtrowanie w galerii po kolorze; chat może powiedzieć "dobierz do niebieskiej koszuli" |
| `material` | Materiał tkaniny | Wpływa na rekomendacje prania; chat może uwzględnić materiał przy stylu |
| `washing_temp` + `washing_mode` + `drying` + `ironing` | Instrukcje pielęgnacji | Wyświetlane w ClothingDetail; silnik prania grupuje po `washing_temp` |
| `season` | Sezony odpowiednie dla ubrania | Chat filtruje po sezonie przy rekomendacjach; galeria może filtrować sezonowo |
| `occasion` | Okazje użycia | Kluczowe dla chatu: "co na randkę?" → filtruj po occasion zawierającym 'na wieczór' |
| `clothing_layer` | Warstwa w stylizacji | **Najkrytyczniejsze pole dla chatu** — patrz §3 poniżej |
| `formality` + `formality_score` | Poziom formalności | Chat łączy ubrania o podobnym `formality_score`; nie rekomenduje garnituru z dresami |
| `warmth_level` | Ciepłość 1–5 | Przy zimnej pogodzie chat preferuje wyższe wartości ciepłości |
| `ai_description` | 2–3 zdania o wyglądzie i stylu | Przekazywana do chatu — AI widzi opis i może rekomendować "ten sweter w kratę z kaszmiru" |
| `prompt_tags` | 5–8 tagów kontekstu użycia | Kompaktowy kontekst dla chatu: "do biura", "smart casual", "wiosenna stylizacja" |
| `brand` | Nazwa marki jeśli rozpoznana | Filtr marki w galerii; zapytania "pokaż Zara" w chacie |
| `fit`, `neckline`, `sleeve_length`, `length` | Krój, dekolt, rękawy, długość | Szczegóły stylistyczne dla chatu i opisu |
| `pattern`, `texture` | Wzór, faktura | Kontekst stylistyczny |

### Guardrails w prompcie i dlaczego

**"JĘZYK: Każda wartość MUSI być po polsku"**
Bez tego AI zwracałoby mieszane wyniki (angielskie metki → "cotton", "hand wash"). Baza danych byłaby niespójna — filtr "niebieski" nie znajdowałby "blue".

**"KATEGORIE UBRAŃ — używaj WYŁĄCZNIE tych wartości"**
Bez predefiniowanej listy AI wymyślałoby kategorie: "hoodie", "pullover", "sweatshirt" zamiast "bluza". Galeria nie może dynamicznie dodawać kategorii — to łamałoby filtry.

**Szczegółowe definicje kategorii (kołnierzyk = koszula, etc.)**
AI myli bluzę ze swetrem i koszulą. Definicje z przykładami zmniejszają błędy o ~70%. Zasada "kołnierzyk → koszula" jest kluczowym disambiguation rule.

**"brand: NIE zgaduj — wpisuj tylko gdy jesteś pewny"**
Bez tego AI halucynowałoby marki (widzi podobny krój → "to chyba Zara"). Błędna marka w bazie → filtr marki zwraca fałszywe wyniki i dezorientuje użytkownika.

**"ai_description: ZERO informacji o praniu"**
Bez tego AI włącza do opisu "prać w 30°C" — bo model jest trenowany łączyć informacje. Opis jest przekazywany do chatu i wyświetlany użytkownikowi. Informacje o praniu są redundantne (są w osobnych polach) i zaśmiecają kontekst.

**"Zwróć TYLKO JSON"**
Modele LLM naturalnie owijają JSON w tekst ("Oczywiście, oto analiza..."). Regex `/{[\s\S]*}/` wyciąga JSON, ale tekst przed nim psuje parsowanie. Guardrail redukuje ryzyko błędu parsowania.

### Zdjęcie ubrania vs zdjęcie metki — dlaczego dwa są lepsze

**Samo zdjęcie ubrania:**
- AI widzi wygląd, może oszacować materiał i kolory
- Instrukcje prania to zgadywanie (AI wie że denim zwykle 30–40°C, ale nie zna konkretnego produktu)
- Dokładność washing_temp: ~60–70%

**Zdjęcie ubrania + zdjęcie metki:**
- Metka zawiera symbole ISO 3758 — jednoznaczne instrukcje
- Prompt zmienia tekst: "Użyj metki priorytetowo do pól prania"
- Model wizualny odczytuje symbole: wanienka + cyfra = temperatura, ikony suszarki/prasowania = konkretne instrukcje
- Dokładność washing_temp z metką: ~90–95%
- Kolejność w messages: `[ubranie, metka, text]` — model widzi oba obrazy z kontekstem który jest do czego

### Normalizacja po odpowiedzi AI i dlaczego

Kod w `normalizeClothingData()` wykonuje 4 operacje:

**1. Wielka litera w `name`:** AI czasem zwraca małą — `capitalize()` poprawia. Estetyka wyświetlania w galerii.

**2. Normalizacja sezonów (SEASON_MAP):**
Mimo guardrailsa AI i tak czasem zwraca 'spring', 'fall', 'summer'. SEASON_MAP tłumaczy na polskie warianty. Bez normalizacji filtr "lato" nie znajdzie elementu z sezonem "summer".

**3. Normalizacja formalności (FORMALITY_MAP):**
AI zwraca 'casual', 'business', 'very casual' zamiast polskich odpowiedników. FORMALITY_MAP mapuje oba języki. Bez tego pole jest niespójne i bezużyteczne dla filtrów.

**4. Usunięcie info o praniu z ai_description:**
Sprawdza listę słów kluczowych (`WASHING_WORDS`). Jeśli opis zawiera "pranie", "temperatura", "suszarka" itp. — pole jest nullowane z ostrzeżeniem w konsoli. Bez tego czat pokazywałby redundantne/mylące informacje.

**5. Walidacja kategorii:**
Jeśli `category` nie jest w `VALID_CATEGORIES` — zamieniane na 'inne' z ostrzeżeniem. Chroni przed halucynowanymi kategoriami.

### Kategorie ubrań — dlaczego taka lista

19 kategorii to wynik projektowego trade-off:
- **Za mało kategorii** (5–8): za grubo ziarniste, "top" i "koszula" wpadają w "ubranie górne"
- **Za dużo kategorii** (50+): AI myli się częściej, filtry stają się nieporęczne dla użytkownika, interfejs galerii nie zmieści wszystkich filtrów

19 kategorii to:
- Dostateczna granularność dla sensownego filtrowania
- Dokładne definicje w prompcie redukują błędy klasyfikacji
- Pokrywa ~98% typowych ubrań w europejskiej szafie

### clothing_layer — dlaczego to pole jest krytyczne dla chatu

`clothing_layer` to **architektoniczny kręgosłup systemu rekomendacji**. Bez niego chat nie wiedziałby jak budować stylizację.

Warstwa określa **rolę ubrania w zestawie**:
- `pierwsza warstwa` → zakładane na ciało (koszula, t-shirt, top)
- `środkowa warstwa` → ciepło, pod kurtkę (bluza, sweter, hoodie)
- `zewnętrzna warstwa` → okrycie wierzchnie (kurtka, płaszcz, trencz)
- `dół (spodnie/sukienki)` → wydzielone osobno w `formatWardrobe` dla czytelności
- `dodatek` → buty, akcesoria, spodnie (w pewnych kontekstach)

Chat może dzięki temu budować **pełne stylizacje warstwowe**:
> "koszula (1sza) + bluza (środkowa) + płaszcz (zewnętrzna) + jeansy (dół)"

Bez tego pola AI widziałoby płaską listę ubrań bez struktury i nie wiedziałoby że "do kurtki potrzebujesz czegoś pod spodem".

Prompt chatu zawiera logikę warstw:
> "Koszula + bluza = smart casual. Koszula + bluza + płaszcz = pełna stylizacja na zimno."

---

## 4. Chat asystent SZAFir

### 4a. Przepływ zapytania (krok po kroku)

```
Użytkownik wpisuje wiadomość
         │
         ▼
1. detectIntent(message)
   → Klasyfikacja intencji z listy 8 kategorii
   → Zwraca: full_outfit / single_item / weather_based / occasion_based /
             favorites / unused / laundry / general
         │
         ▼
2. classifyQueryType(message, intent)
   → Klasyfikacja typu zapytania
   → Zwraca: inventory / brand / specific / recommendation
         │
         ▼
3. baseFilter(clothes, currentOwner)
   → Filtruje szafę: tylko właściciel + tylko status 'czyste'
   → Fallback: jeśli brak ubrań właściciela → wszystkie czyste
         │
         ▼
4. Detekcja braków w szafie (warnings[])
   → Czy są czyste spodnie/szorty?
   → Czy jest kurtka przy temp < 10°C?
         │
         ▼
5. formatWardrobe(filtered)
   → Kompaktowy tekst pogrupowany po warstwach
   → ~50–200 tokenów per ubranie
         │
         ▼
6. getWeatherContext() (wykonane wcześniej w ChatScreen)
   → Dodany jako weatherCtx do system promptu
         │
         ▼
7. Budowa historii wiadomości
   → recentHistory = history.slice(-10) (ostatnie 10 wiadomości)
   → Dołącz listę shownIds (ID już poleconych ubrań)
   → enrichedMessage = userMessage + "[Już polecono: X, Y — zaproponuj inne]"
         │
         ▼
8. Wywołanie Groq API (llama-3.3-70b-versatile, temp 0.7)
   → systemPrompt + historia + enrichedMessage
         │
         ▼
9. Parsowanie odpowiedzi JSON
   → Strip ```json wrappers
   → Walidacja item_ids — mapowanie skróconych ID (6 znaków) na pełne UUID
   → Jeśli parsowanie się nie uda → fallback na raw text
         │
         ▼
10. logChatInteraction() → dev_logs table
         │
         ▼
11. Zwrot do ChatScreen → renderowanie wiadomości + chipów ubrań
```

### 4b. Wykrywanie intencji (detectIntent)

Prosta metoda: dla każdej intencji sprawdza czy wiadomość (lowercase) zawiera któreś ze słów kluczowych. Pierwsza pasująca intencja wygrywa. Jeśli brak dopasowania → `'general'`.

| Intencja | Słowa kluczowe | Co AI robi inaczej | Przykładowe zapytania |
|----------|---------------|-------------------|----------------------|
| `full_outfit` | stylizacja, outfit, co założyć, ubierz mnie, kompletny, cały strój, od góry do dołu, co na siebie | Priorytet na kompletny zestaw ze wszystkich warstw | "Ubierz mnie na dziś", "Zaproponuj outfit na wyjście" |
| `single_item` | koszula, spodnie, kurtka, bluza, sweter, buty, płaszcz, sukienka, coś na górę, coś na dół, okrycie | Skupia się na jednym typie ubrania ale nadal dołącza 2+ elementy | "Pokaż mi jakąś kurtkę", "Co mam na nogi?" |
| `weather_based` | pogoda, deszcz, zimno, ciepło, dziś, dzisiaj, na zewnątrz, temperatura | Mocniej waga na warmth_level, kurtki przy zimnie | "Co dziś na siebie?", "Jest zimno co założyć?" |
| `occasion_based` | praca, biuro, spotkanie, randka, impreza, wieczór, casual, sport, weekend, wyjście | Filtruje po `occasion` i `formality_score` | "Co na imprezę?", "Ubranie do biura" |
| `favorites` | ulubione, ulubion, najlepsze | Preferuje ubrania z `is_favorite: true` | "Pokaż moje ulubione", "Najlepsze ubrania?" |
| `unused` | dawno, nieużywane, zapomniałem, leży, nie zakładał | AI może sugerować odkurzenie zapomnianych elementów | "Co dawno nie zakładałam?" |
| `laundry` | czyste, brudne, pranie, dostępne | `queryType` → 'inventory', AI listuje co jest czyste | "Co mam czyste?", "Czy mam coś do założenia?" |
| `general` | (fallback) | Standardowy przepływ | Dowolne inne pytanie |

**Ograniczenie:** Intencje są wzajemnie wykluczające — wygrywa pierwsza. "Co mam czyste na randkę?" będzie intencją `laundry` (pierwsze pasowanie), nie `occasion_based`. To akceptowalny kompromis przy prostej implementacji.

### 4c. Klasyfikacja zapytania (classifyQueryType)

| Typ | Kiedy | Jak zmienia zachowanie AI | Dlaczego ta klasyfikacja |
|-----|-------|--------------------------|--------------------------|
| `inventory` | intent=='laundry' LUB frazy jak "co mam", "które mam", "ile mam", "wszystkie", "lista" | System prompt instruuje AI: "wymień wszystko co czyste, nie filtruj, nie pomijaj" | Użytkownik chce stan faktyczny, nie rekomendację — AI nie powinno selekcjonować |
| `brand` | Wiadomość zawiera nazwę marki (h&m, zara, nike, reserved, mango...) | System prompt mówi: "filtruj po [marka] w liście" | Pytanie "pokaż Zara" = pytanie inwentaryzacyjne, nie stylistyczne |
| `specific` | Wiadomość zawiera kategorię (koszulę, kurtkę) BEZ słów "założyć"/"stylizacj" | AI skupia się na tej kategorii | Rozróżnienie: "pokaż mi koszule" (inventory) vs "co założyć?" (recommendation) |
| `recommendation` | Wszystkie pozostałe | Pełna swoboda stylizacyjna z uwzględnieniem warstw, pogody, okazji | Domyślny tryb "zrób mi stylizację" |

`queryType` jest wstrzykiwany do system promptu jako `Typ zapytania: ${queryType}` — AI widzi klasyfikację i może dostosować odpowiedź.

### 4d. Filtrowanie szafy (baseFilter)

**Co ZAWSZE jest filtrowane:**

1. **Właściciel (`owner === currentOwner`):** Mikołaj nie widzi ubrań Emilki i odwrotnie. `currentOwner` pochodzi z `getOwnerFromEmail(user.email)`. Rationale: szafa jest prywatna.

2. **Status czysty (`status === 'czyste'`):** Brudne i w praniu nie mogą być założone — nie ma sensu ich rekomendować.

**Fallback:** Jeśli po filtrze właściciela+statusu zostaje 0 ubrań → rozluźniamy do wszystkich czystych (bez filtra właściciela). Rationale: lepiej pokazać coś niż nic. Może się zdarzyć gdy Emilka nie ma jeszcze żadnych ubrań.

**Co NIE jest filtrowane w JS:**

- Sezon (AI decyduje na podstawie pogody i opisu)
- Okazja (AI decyduje na podstawie intencji)
- Warmth level (AI decyduje na podstawie temperatury)
- Kolor (AI decyduje na podstawie zapytania)

**Kluczowa decyzja architekturalna — dlaczego pogoda NIE jest filtrem JS:**

Gdyby JS filtrował po `warmth_level >= 3` przy zimnej pogodzie, AI traciłoby widoczność lżejszych ubrań. Problem: użytkownik pyta "co mam casualowego?" przy 5°C — AI powinno zaproponować lekkiego t-shirta pod kurtkę (pierwsza warstwa), ale JS filtr by go usunął. **AI jest lepsze w rozumowaniu kontekstowym niż hard-coded filtry.** Filtrujemy JS tylko to co jest absolutnie binarne i niezależne od kontekstu (status, właściciel).

**Co się stanie gdy filtr zwróci 0 wyników:**
`formatWardrobe([])` zwraca `'Szafa jest pusta.'` — AI widzi ten string i informuje użytkownika że nie ma czystych ubrań, sugeruje zajrzenie do stanu prania.

### 4e. Format szafy dla AI (formatWardrobe)

**Jak szafa jest pogrupowana:**

```
[PIERWSZA WARSTWA]           ← koszule, t-shirty, topy
  abc123 | biały t-shirt ★ | biały | [H&M] | ciepłość:1/5 formal:3/10 | lato | na co dzień | casual, na spacer
    📝 Klasyczny biały t-shirt z bawełny, świetnie pasuje do jeansów i spodni chino...

[ŚRODKOWA WARSTWA]           ← bluzy, swetry
[ZEWNĘTRZNA WARSTWA]         ← kurtki, płaszcze
[DÓŁ (SPODNIE/SUKIENKI)]     ← spodnie, szorty, sukienki, spódnice
[DODATEK]                    ← buty, akcesoria
[INNE]                       ← elementy bez warstwy
```

`dół` jest wydzielony ze swojego bucketu (który by był `dodatek`) bo spodnie to osobna sekcja stylizacji — AI musi je widzieć oddzielnie od butów i pasków.

**Co każde pole w formacie oznacza dla AI:**
- `abc123` — skrót ID (6 znaków) dla czytelności. Pełne UUID w odpowiedzi AI są mapowane z powrotem
- `★` — ulubione (sygnał "to ubranie jest cenione")
- `ciepłość:X/5` — liczbowy wskaźnik ciepłości (AI może logicznie "dodawać" ciepłość warstw)
- `formal:X/10` — formality score (AI może dopasować spodnie do koszuli po zbliżonym score)
- Sezony + okazje — kontekst użycia
- Tagi prompt_tags — pierwszy 3 dla zwięzłości
- `📝 ai_description` — wyłącznie gdy istnieje — pełny opis który AI może cytować

**Dlaczego kompaktowy tekst zamiast JSON:**
JSON byłby bardziej ustrukturyzowany, ale zajmuje 3–4x więcej tokenów. Przy 150 ubraniach to różnica między ~3000 a ~10000 tokenów kontekstu. Kompaktowy tekst z separatorem ` | ` jest nadal czytelny dla modelu (trenowanego na tabelarycznych danych) i dramatycznie tańszy.

**Szacowany rozmiar kontekstu przy 150 ubraniach:**
- Bez ai_description: ~3000–4000 tokenów
- Z ai_description dla każdego: ~8000–12000 tokenów (przekraczałoby limity i podnosiło koszt)
- Praktycznie: ai_description renderowany tylko gdy istnieje — ~30–50% ubrań ma go po analizie AI

**Jak ai_description wpływa na jakość:**
Gdy AI widzi `📝 Klasyczny biały t-shirt z bawełny, świetnie pasuje do jeansów...` — może powiedzieć użytkownikowi **dlaczego** poleca to ubranie, zamiast tylko podawać nazwy. Znacząco podnosi naturalność odpowiedzi.

### 4f. Odpowiedź AI — schemat JSON

```json
{
  "text": "...",
  "item_ids": ["uuid1", "uuid2"],
  "outfit_name": "...",
  "reasoning": "...",
  "missing_items": [],
  "asking_clarification": false
}
```

| Pole | Typ | Co oznacza | Kiedy null | Jak używane w UI |
|------|-----|-----------|-----------|-----------------|
| `text` | string | Główna odpowiedź tekstowa, 2–4 zdania | Nigdy (fallback: tekst błędu) | Wyświetlana jako bubble wiadomości |
| `item_ids` | string[] | Pełne UUID rekomendowanych ubrań | [] gdy brak rekomendacji / pytanie klaryfikacyjne | Renderuje `ClothingChip` klikalne karty ubrań |
| `outfit_name` | string\|null | Nazwa stylizacji (np. "Smart casual na poniedziałek") | null gdy rekomendacja < 2 elementy lub pytanie | Wyświetlana jako nagłówek nad chipami |
| `reasoning` | string\|null | 1 zdanie logiki doboru, BEZ UUID, po nazwie ubrania | null gdy inventory/brand/klaryfikacja | Wyświetlana po kliknięciu ikonki "żarówki" (reasoning reveal) |
| `missing_items` | string[] | Sugestie zakupów których brak w szafie | [] gdy szafa kompletna | Wyświetlane jako tekst sugestii poniżej odpowiedzi |
| `asking_clarification` | boolean | Czy AI zadaje pytanie zamiast rekomendować | false normalnie | true → UI nie renderuje chipów ubrań |

**Co się dzieje gdy AI zwróci zły format:**
1. Strip `\`\`\`json` wrappers (AI często opakowuje JSON w markdown)
2. `JSON.parse()` — jeśli rzuci wyjątek → fallback: `{ text: rawText, item_ids: [] }`
3. Po parsowaniu: walidacja item_ids — każde ID mapowane:
   - Jeśli 36 znaków i istnieje w filtered → OK
   - Jeśli 6 znaków (skrót) → `filtered.find(c => c.id.startsWith(id))` → pełne UUID
   - Jeśli brak dopasowania → filtrowane przez `.filter(Boolean)`

Ta walidacja jest konieczna bo AI widzi tylko 6-znakowe skróty ID w formacie szafy (dla czytelności), ale musi zwrócić pełne UUID. Model czasem zwraca skrócone ID — kod to naprawia automatycznie.

### 4g. Zarządzanie historią

**Ile wiadomości pamiętamy:** `history.slice(-10)` — ostatnie 10 wiadomości konwersacji (5 par pytanie/odpowiedź).

**Dlaczego 10:** Więcej = większy kontekst = więcej tokenów = wolniej i drożej. Mniej = AI nie pamięta co właśnie polecił. 10 wiadomości = ~2000 tokenów historii, wystarczy dla spójnej rozmowy.

**Jak unikamy powtarzania ubrań:**
```js
const shownIds = history
  .filter(m => m.role === 'assistant')
  .flatMap(m => m.item_ids || [])
```
Zbieramy ID ze wszystkich poprzednich odpowiedzi asystenta (max `slice(-10)`) i doklejamy do wiadomości użytkownika:
> `[Już polecono: uuid1, uuid2, uuid3 — zaproponuj inne jeśli możesz]`

AI widzi tę wskazówkę i stara się nie powtarzać. Słowa "jeśli możesz" dają mu wyjście gdy nie ma alternatyw.

**Co się dzieje gdy historia jest bardzo długa:**
`slice(-10)` automatycznie obcina starsze wiadomości. Historia w pamięci przeglądarki nie jest limitowana (useState w ChatScreen), ale do API wysyłamy zawsze max 10 ostatnich. Przy przeładowaniu strony historia jest tracona (brak persystencji historii chatu).

---

## 5. Integracja pogody

### Skąd pochodzi pogoda

`getWeatherContext()` w `weather.js`:
1. `navigator.geolocation.getCurrentPosition()` — przeglądarka pyta użytkownika o lokalizację
2. Timeout: 5000ms — jeśli za długo → zwraca null
3. `fetch('https://api.open-meteo.com/v1/forecast?...')` — API Open-Meteo (bezpłatne, bez klucza)
4. Dane: temperatura aktualna, odczuwalna, opady, prędkość wiatru, kod pogody, prognoza 3 dni

### Jakie dane pogodowe trafiają do AI

```
POGODA TERAZ:
- 7°C (odczuwalna 4°C)
- częściowe zachmurzenie
- Deszcz: 15%
- Wiatr: 22 km/h
```
Plus prognoza 3-dniowa (date, temp min/max, condition, rain_chance).

Dodatkowe dane wstrzyknięte przez JS (bez API):
- Dzień tygodnia (`today`)
- Pora dnia (`rano / popołudniu / wieczorem`)

### Jak pogoda wpływa na rekomendacje

Bezpośrednio przez prompt — AI "widzi" pogodę i samodzielnie wnioskuje:
- `temp < 10°C` → AI wybiera wyższe warmth_level, dodaje zewnętrzną warstwę
- `deszcz > 50%` → AI preferuje wiatrówki, nie poleca jasnych kolorów
- `temp > 25°C` → AI wybiera niskie warmth_level, lekkie materiały

JS generuje też `warnings[]` gdy brak kurtki przy < 10°C — AI widzi te ostrzeżenia w promptcie i może je adresować.

### Co się dzieje gdy brak lokalizacji

`getWeatherContext()` zwraca `null` przy braku pozwolenia lub timeout.
`weatherCtx` w promptcie staje się `'Brak danych pogodowych.\n'`.
AI nie ma kontekstu temperatury — pyta użytkownika ("na jaką pogodę szukasz?") lub pomija rekomendacje temperaturowe.

### Dlaczego pogoda jest w prompcie a nie w filtrze

Patrz §4d — fundamentalna decyzja architekturalna. Krótko: filtr JS byłby zbyt sztywny i wyrzucałby ubrania które są użyteczne w warstwach. AI rozumie że lekki t-shirt pod kurtką jest właściwą odpowiedzią na zimno — statyczny filtr nie.

---

## 6. System logowania interakcji AI

### Co jest zapisywane — analiza ubrania

`logAIAnalysis()` zapisuje do `dev_logs`:
- Czas analizy (`duration_ms`)
- Sukces/błąd
- Wyniki jakości: liczba null-owych pól, czy ai_description zawierał słowa o praniu (błąd), walidacja washing_temp
- Czy była metka (`label_used: boolean`)
- Model i temperatura

### Co jest zapisywane — chat

`logChatInteraction()` — pełne metryki:

**Wejście:**
- `user_message` — treść zapytania
- `intent`, `query_type` — jak sklasyfikowaliśmy
- `weather_temp`, `weather_condition`, `weather_rain_chance` — kontekst pogodowy
- `day_of_week`, `time_of_day` — kontekst czasu

**Szafa:**
- `clothes_total` — ile ubrań w bazie
- `clothes_sent_to_ai` — ile po filtrze (właściciel + czyste)
- `wardrobe_layers` — rozkład po warstwach (`{ pierwsza: N, srodkowa: N, zewnetrzna: N, dol: N }`)
- `wardrobe_warnings` — jakie ostrzeżenia (brak spodni, brak kurtki)

**Wyjście:**
- `ai_response_text` — pełna odpowiedź tekstowa
- `ai_item_ids` — polecone ubrania
- `ai_outfit_name`, `ai_reasoning`, `ai_missing_items`
- `ai_asking_clarification`
- `items_found_in_wardrobe` — ile z poleconych ID istnieje w szafie (miara halucynacji)

**Metryki:**
- `duration_ms` — czas odpowiedzi
- `response_length` — długość tekstu
- `model_used`, `prompt_length`

### Dlaczego to logujemy

1. **Jakość AI:** `items_found_in_wardrobe < polecone.length` → AI halucynuje ID. Można monitorować trend.
2. **Wzorce użycia:** jakie intencje dominują, o jakiej porze, przy jakiej pogodzie
3. **Optymalizacja promptu:** `prompt_length` vs `response_length` vs `duration_ms` — kiedy prompt jest za długi
4. **Problemy z szafą:** `wardrobe_warnings` często → użytkownicy mają braki w konkretnych warstwach
5. **Debugowanie:** pełna historia interakcji z kontekstem — reprodukcja błędów AI

---

## 7. Ograniczenia i ryzyka

| # | Problem | Kiedy | Impact | Mitygacja | Co można ulepszyć |
|---|---------|-------|--------|-----------|-------------------|
| 1 | **Halucynacja ID** — AI zwraca skrócone lub nieistniejące ID | Duże szafy (150+ ubrań), skompresowany format | Chipek ubrania nie renderuje się | Walidacja ID po odpowiedzi, mapowanie skrótów na UUID | Embedding search (vector DB) zamiast pełnej szafy w kontekście |
| 2 | **Przekroczenie kontekstu** — szafa 200+ ubrań + historia + prompt | Zaawansowani użytkownicy | Groq odrzuca request lub obcina kontekst | slice(-10) historii, kompaktowy format szafy | Warunkowe ograniczenie liczby ubrań w kontekście |
| 3 | **Błędna kategoria** — AI myli bluzę ze swetrem lub koszulę | Nieatypowe ubrania, złe zdjęcie | Filtr galerii nie działa poprawnie | Normalizacja na 'inne', warning w konsoli | Reanalysis button (już istnieje w ClothingDetail) |
| 4 | **Angielskie wartości** | AI ignoruje guardrail języka | Filtr galerii po polskim kolorze nie działa | SEASON_MAP, FORMALITY_MAP normalizują | Szerszy mapping dla częstych błędów |
| 5 | **Brak pogody** — użytkownik odmawia lokalizacji | Zawsze gdy brak pozwolenia | AI nie ma kontekstu pogodowego | Null → "brak danych pogodowych" w promptcie | Manualne wpisanie miasta jako alternatywa |
| 6 | **Powtarzanie ubrań** | Długa rozmowa, mała szafa | Frustrujące dla użytkownika | shownIds w enrichedMessage | Persystencja historii między sesjami |
| 7 | **Brak persystencji chatu** | Przeładowanie strony | Historia rozmowy znikna | Brak mitygacji | LocalStorage lub Supabase dla historii chatu |
| 8 | **Rate limiting Groq** | Intensywne użycie | Błąd API | fetchWithRetry (2 retry, exp backoff) | Caching popularnych zapytań |
| 9 | **Analiza złej jakości zdjęć** | Zdjęcie zamazane, słabe oświetlenie | Błędna kategoria/kolor | Retry mechanism, manual mode dla DEV | Walidacja jakości zdjęcia przed wysłaniem |
| 10 | **Hardcoded użytkownicy** | Nowy użytkownik spoza OWNER_EMAILS | ownerName = null, brak filtra właściciela | getOwnerFromEmail zwraca null → fallback | Dynamiczna rejestracja właścicieli |

---

## 8. Prompt engineering — zasady

### Techniki używane

**Format forcing (oba modele)**
Prompt kończy się `"Zwróć TYLKO JSON"` / `"FORMAT — zawsze TYLKO JSON, zero tekstu poza nim"`. Bez tego LLM owijają odpowiedź w tekst wyjaśniający. Używamy regex `/{[\s\S]*}/` jako dodatkowe zabezpieczenie.

**Persona (chat)**
"Jesteś Wizard — przyjacielski osobisty stylista" + konkretny opis tonu i zachowań. Persona jest opisana zachowaniem ("masz opinię, poczucie humoru") a nie tylko rolą ("jesteś asystentem"). Konkretna persona = spójny ton przez całą rozmowę.

**Chain-of-thought w reasoning field (chat)**
AI jest proszone o wypełnienie pola `reasoning` — 1 zdanie logiki doboru. To wymusza wewnętrzne uzasadnienie przed podaniem item_ids. Efekt: mniej losowych rekomendacji, lepsze połączenia ubrań.

**Few-shot przez przykłady (analiza ubrań)**
Prompt kategorii zawiera definicje z przykładami kontrastu:
> "NIE myl z bluzą — koszula MA kołnierzyk"
> "Gdy widzisz kołnierzyk → koszula"

To one-shot disambiguation — model widzi konkretny decision rule, nie tylko definicję.

**Guardrails przez przykłady złych odpowiedzi (chat)**
```
Przykład ZŁEJ odpowiedzi:
"Polecam bluzę z kapturem." ← za mało, jedno ubranie
```
Negatywny przykład jest bardziej efektywny niż "nie rób X" — model rozumie konkretnie co jest złe.

**Kontekst dynamiczny (chat)**
System prompt jest budowany dynamycznie przy każdym wywołaniu: `${weatherCtx}`, `${today}`, `${timeOfDay}`, `${queryType}`, `${warnings}`. Model dostaje świeży kontekst — nie musi go pamiętać.

**Warunkowe ostrzeżenia (chat)**
`warnings[]` są wstrzyknięte do promptu tylko gdy istnieją:
```
${warnings.length > 0 ? '⚠️ OSTRZEŻENIA:\n' + warnings.join('\n') : ''}
```
Model zwraca na nie uwagę bo są oznaczone ⚠️ i są separowane wizualnie.

**Normalizacja jako post-processing zamiast prompt-only**
Nie polegamy wyłącznie na prompcie dla poprawności (seasons, formality). Normalizacja w JS jest dodatkową siatką bezpieczeństwa. Zasada: "prompt redukuje błędy, kod je naprawia".

**Temperatura jako projektowy sygnał**
`temperature: 0.2` dla analizy = deterministyczna ekstrakcja faktów
`temperature: 0.7` dla chatu = naturalna, zróżnicowana konwersacja
Różnica nie jest przypadkowa — to świadomy wybór trybu działania modelu.

---

## 9. Ewolucja AI — co planowane

### Priorytet 1: Embedding search (zastąpienie pełnego kontekstu szafy)

**Problem:** Przy 200+ ubraniach kontekst szafy = ~8000–15000 tokenów. To wolne, drogie i zbliża się do limitów.

**Rozwiązanie:** Każde ubranie → embedding vector (np. text-embedding-3-small). Zapytanie użytkownika → embedding. Cosine similarity → top 20 najtrafniejszych ubrań → tylko te do AI.

**Dlaczego priorytet:** Jedyne skalowalne rozwiązanie dla szafy 500+ ubrań.

### Priorytet 2: Persystencja historii chatu

**Problem:** Zamknięcie aplikacji = utrata rozmowy. Nie można kontynuować "tamtej rozmowy o weekendowym wyjeździe".

**Rozwiązanie:** Tabela `chat_history` w Supabase, ładowana przy otwarciu chatu.

**Dlaczego priorytet:** Znacząco podnosi użyteczność asystenta dla powracających użytkowników.

### Priorytet 3: Reanaliza AI na żądanie

**Kontekst:** Istnieje już przycisk reanalysis w ClothingDetail (dla DEV_EMAIL).

**Planowane:** Dostępność dla wszystkich użytkowników, szczególnie gdy pierwsze zdjęcie było złej jakości lub AI popełniło błąd kategorii.

### Priorytet 4: Lepsze intencje dla "unused"

**Problem:** Intent `unused` jest zaimplementowany w detectIntent ale nie ma dedykowanej logiki filtrowania (sortowanie po `created_at` lub `last_worn_at`).

**Rozwiązanie:** Pole `last_worn_at` w tabeli clothes, aktualizowane przy zmianie statusu na 'używane'. AI może filtrować po tej dacie.

### Priorytet 5: Streaming odpowiedzi

**Problem:** Użytkownik czeka 1–3s na całą odpowiedź bez feedbacku (tylko animacja "thinking").

**Rozwiązanie:** Groq obsługuje SSE streaming. Odpowiedź pojawia się token po tokenie jak w ChatGPT.

---

## CHANGELOG

| Data | Co zmieniono | Sesja |
|------|-------------|-------|
| 2026-04-22 | Pierwsza dokumentacja AI-CONFIG.md | Sesja 2 |

---

*Koniec AI-CONFIG.md — 9 sekcji, kompletna dokumentacja logiki AI · 2026-04-22*
