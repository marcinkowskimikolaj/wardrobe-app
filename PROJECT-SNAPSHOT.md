# PROJECT-SNAPSHOT.md — Wardrobe Wizard
> Handoff dla następnej sesji Claude · 2026-04-22 · Sesja 2
> **Czytaj to przed jakimkolwiek pytaniem do użytkownika.**

---

## 1. Stan projektu na dziś

**Snapshot:** 2026-04-22, koniec sesji 2

**Status jednozdaniowy:** Aplikacja działa produkcyjnie, onboarding tour jest ukończony i połączony z Supabase, sesja 2 była dokumentacyjna — kod nie był zmieniany, powstały 3 pliki MD.

### Co działa produkcyjnie ✅
- Logowanie / wylogowanie (Supabase Auth, email+hasło)
- Galeria ubrań z filtrami (właściciel, status, kolor, marka, sezon, okazja) i wyszukiwarką
- Dodawanie ubrań — 3-krokowy wizard: zdjęcie → analiza AI → formularz
- Analiza AI (Groq vision, `meta-llama/llama-4-scout-17b-16e-instruct`) — kategoria, kolor, materiał, instrukcje prania, opis, tagi
- Szczegóły ubrania — cykl statusów, edycja, usuwanie z cleanup zdjęcia w Storage
- Ulubione (tabela `user_favorites`)
- Outfity — zapisywanie, edycja, usuwanie
- Skaner stylizacji — zdjęcie outfitu z internetu → dopasowanie do szafy
- Pranie — grupowanie brudnych po temperaturze/trybie
- Chat SZAFir — AI stylista z kontekstem szafy i pogody (Open-Meteo)
- WizardTour — 7-krokowy onboarding, persystencja w `user_preferences` (per-konto, nie per-urządzenie)
- WizardHint — 8 kontekstowych ? bubbles w kluczowych miejscach UI
- Kokos easter egg — ukryty w ChatScreen, wyświetla zdjęcie psa
- Dev tools — dostępne tylko dla mikolo321@gmail.com: toolbar, manual AI mode, log export
- Analytics — `dev_logs` tabela w Supabase, pełne metryki AI i nawigacji

### Co jest w trakcie budowy 🔨
- Nic aktywnie nie jest w trakcie — aplikacja jest feature-complete dla bieżącego zakresu

### Co jest zepsute / wymaga uwagi ⚠️
- `ai_description` w starszych rekordach zawiera info o praniu (przed guardrailem) — `normalizeClothingData` usuwa to dla nowych, stare dane są "brudne"
- Historia chatu nie jest persystowana — resetuje się po przeładowaniu strony
- Brak `last_worn_at` — intent `unused` w chat.js nie ma danych do filtrowania po dacie użycia
- `FilterBar.jsx` istnieje w `src/components/Gallery/` ale jest nieużywany (legacy, zastąpiony przez `FilterSheet`)
- `ai-features.js` istnieje w `src/services/` ale jest placeholder bez implementacji

---

## 2. Środowisko

| Parametr | Wartość |
|----------|---------|
| **URL produkcyjny** | https://wardrobe-app-sage.vercel.app |
| **Supabase projekt ID** | `altitfgqnxnohiqdkmrq` |
| **Supabase region** | West EU (Ireland) |
| **Supabase URL** | `https://altitfgqnxnohiqdkmrq.supabase.co` |
| **Groq model — vision** | `meta-llama/llama-4-scout-17b-16e-instruct` |
| **Groq model — chat** | `llama-3.3-70b-versatile` |
| **DEV_EMAIL** | `mikolo321@gmail.com` |
| **Właściciel 1** | Mikołaj → `mikolo321@gmail.com` |
| **Właściciel 2** | Emilka → `aemilka@gmail.com` |
| **Deploy** | Vercel (auto-deploy z gita) |
| **Env vars** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY` |
| **Node / Vite** | React 18.3.1 / Vite 5.4.8 |

**CLI token Supabase** (zapisany w memory projektu):
`sbp_52ebd5da3c7fc5595074821cc7c583f7d045c9af`
Użycie: `SUPABASE_ACCESS_TOKEN=sbp_52ebd5da... npx supabase ...`

---

## 3. Zmiany w tej sesji (sesja 2, 2026-04-22)

Sesja 2 była **czysto dokumentacyjna** — zero zmian w kodzie produkcyjnym. Powstały pliki:

### Zmiana 1: WARDROBE-WIZARD-INVENTORY.md
- **Co:** 14-sekcyjna dokumentacja projektu (product, users, tech stack, file tree, screens, DB schema, feature registry, external services, design system, logging, onboarding, known issues, metrics, asset registry)
- **Dlaczego:** Kontekst projektu dla przyszłych sesji Claude bez potrzeby eksploracji kodu
- **Status:** ✅ Gotowe, 21.9 KB
- **Pliki:** `/Users/mikolajmarcinkowski/Documents/Wardrobe App/WARDROBE-WIZARD-INVENTORY.md`

### Zmiana 2: AI-CONFIG.md
- **Co:** 9-sekcyjna dokumentacja logiki AI (filozofia SZAFira, dwa modele i dlaczego, analiza zdjęć z guardrailsami, chat przepływ krok po kroku, intencje, filtry, formatowanie szafy, odpowiedź AI, pogoda, logging, ograniczenia, prompt engineering, roadmap)
- **Dlaczego:** Nowa sesja Claude musi rozumieć decyzje AI bez czytania promptów w kodzie
- **Status:** ✅ Gotowe, 33.5 KB
- **Pliki:** `/Users/mikolajmarcinkowski/Documents/Wardrobe App/AI-CONFIG.md`

### Zmiana 3: PROJECT-SNAPSHOT.md (ten plik)
- **Co:** Handoff document dla następnej sesji
- **Status:** ✅ Gotowe (właśnie tworzony)
- **Pliki:** `/Users/mikolajmarcinkowski/Documents/Wardrobe App/PROJECT-SNAPSHOT.md`

---

### Zmiany z sesji 1 (2026-04-21/22) — dla pełnego obrazu

Sesja 1 była intensywna — wiele zmian kodu:

| Zmiana | Pliki | Status |
|--------|-------|--------|
| WizardTour redesign — większy obraz SZAFira, karta premium u dołu ekranu, highlight BottomNav przycisków | `WizardTour.jsx`, `index.css` | ✅ |
| WizardTour — `highlightSelector` + useEffect + `.tour-highlighted` pulsing CSS | `WizardTour.jsx`, `index.css` | ✅ |
| WizardTour — usunięcie progress dots (nakładały się z kartą) | `WizardTour.jsx`, `index.css` | ✅ |
| WizardTour persystencja — localStorage → Supabase `user_preferences` | `supabase.js`, `App.jsx` | ✅ |
| SQL migration — tabela `user_preferences` z RLS | Supabase SQL Editor | ✅ |
| BottomNav — dodanie `data-tab` atrybutów do wszystkich przycisków | `BottomNav.jsx` | ✅ |
| WizardHint redesign — poziomy layout, avatar, checkmark zamiast "Rozumiem" | `WizardHint.jsx`, `index.css` | ✅ |
| WizardHint fix — usunięcie backdrop-filter (jank) + fix translateX w keyframes | `index.css` | ✅ |
| WizardHint w ClothingDetail — przeniesienie z absolute wrapper do inline w status bar | `ClothingDetail.jsx` | ✅ |
| Gallery controls — kompresja (padding, gap) żeby "Filtruj" nie wychodziło poza ekran | `index.css` | ✅ |
| Kokos easter egg — fix position:fixed zamiast absolute | `index.css` | ✅ |

---

## 4. Stan bazy danych

### Tabele

| Tabela | Opis | RLS |
|--------|------|-----|
| `clothes` | Główna tabela ubrań (~25+ kolumn) | ✅ |
| `user_favorites` | Ulubione — user_id + clothing_id | ✅ |
| `outfits` | Zapisane stylizacje | ✅ |
| `user_preferences` | Preferencje per-user (tour_completed) | ✅ |
| `dev_logs` | Analytics i logi AI interakcji | ✅ (prawdopodobnie) |

### Migracje SQL wykonane w sesji 1

**Tabela `user_preferences` — wykonana z sukcesem:**
```sql
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_completed BOOLEAN NOT NULL DEFAULT false,
  tour_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Migracja nowych kolumn AI** (plik `supabase-migration-new-columns.sql` — status nieznany, może być niezaaplikowana):
```sql
ALTER TABLE public.clothes
  ADD COLUMN IF NOT EXISTS subcategory    text,
  ADD COLUMN IF NOT EXISTS occasion       text[],
  ADD COLUMN IF NOT EXISTS warmth_level   smallint,
  ADD COLUMN IF NOT EXISTS formality_score smallint,
  ADD COLUMN IF NOT EXISTS texture        text;
```
⚠️ **Sprawdź w Supabase Dashboard czy te kolumny istnieją przed uruchomieniem `AddClothing`.**

### Dane w bazie

- `DATA-AUDIT.md` (2026-04-21) raportuje 4 rekordy w `clothes` — dane testowe Mikołaja
- Dane rzeczywiste, nie seed — Mikołaj i Emilka używają produkcyjnie
- Jedna ze znalezionych anomalii: `ai_description` w starym rekordzie zawierał info o praniu (bug który już naprawiony w kodzie)

---

## 5. Otwarte zadania

### 🔴 Krytyczne — blokują użycie
*Brak krytycznych blokerów — aplikacja jest w pełni funkcjonalna.*

### 🟡 Następna sesja — zaplanowane

**[NEXT-1] Weryfikacja kolumn AI w Supabase**
Plik `supabase-migration-new-columns.sql` istnieje w projekcie ale nie wiadomo czy był wykonany. Kolumny `subcategory`, `occasion`, `warmth_level`, `formality_score`, `texture` są używane w kodzie — jeśli nie istnieją w bazie, `AddClothing` może rzucać błędy przy zapisie.
Akcja: sprawdź w Dashboard → Table Editor → tabela `clothes` czy kolumny istnieją.

**[NEXT-2] Wyczyszczenie martwego kodu**
- `src/components/Gallery/FilterBar.jsx` — nieużywany, zastąpiony przez `FilterSheet.jsx`
- `src/services/ai-features.js` — pusty placeholder
- Usunięcie lub implementacja

**[NEXT-3] Persystencja historii chatu**
Historia rozmowy z SZAFirem resetuje się przy każdym przeładowaniu. Tabela `chat_history` w Supabase lub localStorage rozwiązałoby problem.

**[NEXT-4] last_worn_at dla intent "unused"**
`detectIntent` w `chat.js` rozpoznaje intencję `unused` ("dawno nie zakładałem") ale nie ma danych do posortowania po dacie ostatniego użycia. Potrzebne: pole `last_worn_at` w `clothes`, aktualizowane gdy status zmienia się na 'używane'.

### 🟢 Backlog — kiedyś

**[BACK-1] Embedding search**
Przy 200+ ubraniach kontekst szafy w chacie może przekroczyć limity tokenów. Rozwiązanie: vector embeddings dla ubrań + semantic search. Szczegóły w `AI-CONFIG.md §9`.

**[BACK-2] Streaming odpowiedzi chatu**
Groq obsługuje SSE streaming — odpowiedź pojawiałaby się token po tokenie. Poprawia perceived performance.

**[BACK-3] Dynamiczni właściciele**
Mikołaj i Emilka są hardcoded w `constants.js`. Nowy użytkownik nie ma `ownerName` → chat nie filtruje po właścicielu. Wymaga: tabela `profiles` lub rozszerzenie OWNER_EMAILS.

**[BACK-4] Reanaliza AI dla wszystkich użytkowników**
Przycisk "ponowna analiza AI" istnieje w `ClothingDetail` ale tylko dla DEV_EMAIL. Przydatny gdy pierwsze zdjęcie było złej jakości.

---

## 6. Decyzje podjęte w tej sesji / sesjach

### Decyzja 1: Tour persystencja w Supabase, nie localStorage

**Zdecydowano:** Supabase `user_preferences.tour_completed`

**Dlaczego:** localStorage = per-urządzenie. Jeśli Emilka zaloguje się na nowym telefonie, zobaczy tour ponownie. Supabase = per-konto — tour widziany raz, na zawsze, na wszystkich urządzeniach.

**Odrzucono:** localStorage — zbyt wąski zakres, dezorientuje użytkownika na nowym urządzeniu.

**Ryzyko:** Supabase może być niedostępne przy pierwszym zalogowaniu → `hasCompletedTour` zwraca `false` (try/catch) → tour się pokaże ponownie. Acceptable.

---

### Decyzja 2: Dwa modele Groq zamiast jednego

**Zdecydowano:** `llama-4-scout-17b` (vision) + `llama-3.3-70b` (chat)

**Dlaczego:** Vision model jest szybszy/tańszy dla ekstrakcji faktów z obrazów. 70B jest lepszy w konwersacji i rozumowaniu. Użycie jednego modelu do obu = kompromis w dół.

**Odrzucono:** Jeden model 70B do wszystkiego — wolniejszy dla analizy zdjęć, droższy.

**Ryzyko:** Dwa różne modele = dwa różne profile błędów. Akceptowalne.

---

### Decyzja 3: Pogoda w promptcie AI, nie jako filtr JS

**Zdecydowano:** Cała szafa (po filtrze status+właściciel) idzie do AI. Pogoda jest w systemowym prompcie.

**Dlaczego:** JS filtr `warmth_level >= 3` przy zimnie usuwałby lekkie ubrania które są użyteczne jako pierwsza warstwa pod kurtką. AI rozumuje kontekstowo — JS nie.

**Odrzucono:** Filtr JS po warmth_level — zbyt sztywny, wyrzucałby kontekstowo ważne ubrania.

**Ryzyko:** Duże szafy → duży kontekst tokenów. Mitigacja: kompaktowy format `formatWardrobe`. Długoterminowe rozwiązanie: embedding search.

---

### Decyzja 4: position:fixed dla WizardHint i KokosEasterEgg

**Zdecydowano:** `position:fixed` zamiast `position:absolute`

**Dlaczego:** Elementy wewnątrz kontenerów z `overflow:auto` / `overflow:hidden` nie mogą "uciec" przez `position:absolute` — są przycinane do rodzica. `position:fixed` jest relatywny do viewport.

**Odrzucono:** position:absolute — niewidoczne elementy, debugging frustrating.

**Ryzyko:** `position:fixed` może kolidować z innymi fixed elementami (BottomNav, czat input). Rozwiązanie: `bottom: calc(var(--nav-h) + var(--safe-bottom) + Xpx)`.

---

### Decyzja 5: Brak backdrop-filter na animowanych elementach

**Zdecydowano:** WizardHint popup ma `background: #fff` (solid) bez `backdrop-filter: blur()`

**Dlaczego:** `backdrop-filter` na elemencie który się pojawia (animacja `hint-appear`) powoduje jank — GPU musi rekomponować warstwę w każdej klatce animacji. Efekt: widoczne zacinanie na iOS Safari.

**Odrzucono:** `backdrop-filter: blur(12px)` — estetyczniejsze ale powodowało jank.

**Ryzyko:** Brak — solid white jest akceptowalny wizualnie.

---

## 7. Kontekst który trzeba znać

### Nazewnictwo i persona
- **SZAFir** — to imię AI asystenta. Nie "Wizard", nie "AI", nie "asystent". SZAFir = szafa + szafir (kamień). Gdy mówisz o chacie, używasz "SZAFir".
- Kod w `chat.js` nazywa go "Wizard" w systemowym prompcie — to wewnętrzna nazwa modelu. Dla użytkownika i w UI to zawsze "SZAFir".

### Easter egg
- **Kokos** — pies Mikołaja. Easter egg w ChatScreen. Wyzwalany przez specyficzną interakcję (ukrytą). Wyświetla `kokos-easter.png` (2.6 MB, prawdziwe zdjęcie). NIE usuwaj — to celowa feature.

### Właściciele szafy
- Dwie osoby: Mikołaj i Emilka (para). Dzielą jedną instancję aplikacji / bazę danych.
- Każde ubranie ma pole `owner` — string 'Mikołaj' lub 'Emilka'.
- Chat filtruje automatycznie po zalogowanym użytkowniku → jego ubrania. Fallback na wszystkie czyste jeśli brak jego ubrań.
- Nowy użytkownik (inny email) nie będzie miał `ownerName` → chat nie filtruje. Hardcoded design decision.

### CSS — jeden plik
- Wszystkie style są w `src/index.css` — ~1981 linii (wg RAPORT.md), brak CSS modules, brak styled-components. To celowa decyzja, nie dług techniczny. Nie proponuj refactoringu na modules bez pytania użytkownika.

### CSS variable --nav-h
- `--nav-h: 83px` — wysokość BottomNav włącznie z safe area. **Używaj jej** dla wszystkich elementów pozycjonowanych nad navbarem. Chat input jest na `bottom: calc(var(--nav-h) + var(--safe-bottom))`. Kokos trigger musi być `+76px` wyżej żeby nie zakryć 65px input bara w chacie.

### data-tab atrybuty w BottomNav
- Każdy przycisk w BottomNav ma `data-tab="gallery|outfits|add|laundry|chat"`. Służą do CSS/querySelector targetowania przez WizardTour (highlight na odpowiednim przycisku podczas kroku toura).

### Pixel art styl
- Wszystkie ikonki to pixel art PNG. CSS: `image-rendering: pixelated`. Nie zmieniaj rozmiaru z width/height na czymś innym niż CSS `height: Xpx; width: auto` dla zachowania proporcji. Hardcoded `width="X" height="X"` może powodować złe skalowanie nie-kwadratowych sprite'ów.

### Przycisk "?" (WizardHint)
- Popup jest `position: fixed` — nie `absolute`. Animacja hint-appear używa TYLKO `translateY` — NIE `translateX`. Dodanie `translateX(-50%)` do keyframes zepsuje popup (element skacze bo `left:16px; right:16px` już centruje).

### Skrócone ID w chacie
- `formatWardrobe` pokazuje AI skrócone ID (6 znaków) dla czytelności promptu. AI często zwraca te 6-znakowe skróty w `item_ids`. Kod po odpowiedzi AI automatycznie mapuje skróty na pełne UUID przez `filtered.find(c => c.id.startsWith(id))`. Nie "naprawiaj" skrótów w promptcie — mapping jest celowy.

### Dokumentacja w katalogu projektu
W root projektu jest kilka MD plików — kontekst historyczny:
- `RAPORT.md` — 2026-04-20, stan sprzed sesji 1
- `DATA-AUDIT.md` — 2026-04-21, audyt danych w bazie
- `VISUAL-AUDIT.md` — audyt wizualny UI
- `WARDROBE-WIZARD-INVENTORY.md` — 2026-04-22 (sesja 2), kompletna inwentaryzacja projektu
- `AI-CONFIG.md` — 2026-04-22 (sesja 2), logika AI
- `PROJECT-SNAPSHOT.md` — ten plik

---

## 8. Smoke testy — jak sprawdzić że wszystko działa

Po każdej większej zmianie sprawdź:

### Auth
- [ ] Logowanie działa (mikolo321@gmail.com lub aemilka@gmail.com)
- [ ] Po zalogowaniu tour pojawia się tylko dla nowych użytkowników (sprawdź `user_preferences`)
- [ ] Wylogowanie czyści sesję i pokazuje ekran login

### Tour
- [ ] Nowy użytkownik (czyste `user_preferences`) → tour się pokazuje
- [ ] Po przejściu toura (lub pominięciu) → `user_preferences.tour_completed = true` w Supabase
- [ ] Drugi login → tour NIE pokazuje się
- [ ] Kliknięcie avatara w Gallery → tour restartuje się
- [ ] Highlight na odpowiednim przycisku BottomNav w krokach gallery/add/outfits/laundry/chat

### Gallery
- [ ] Ubrania ładują się po zalogowaniu
- [ ] Filtr właściciela działa (Mikołaj vs Emilka)
- [ ] Filtr statusu działa
- [ ] Wyszukiwanie tekstowe działa
- [ ] Kliknięcie ubrania → ClothingDetail otwiera się z animacją

### AddClothing
- [ ] Zdjęcie z kamery/galerii ładuje się
- [ ] Analiza AI zwraca wyniki (sprawdź konsolę na błędy API)
- [ ] Formularz wypełniony danymi z AI
- [ ] Zapis do bazy działa (ubranie pojawia się w Gallery)
- [ ] WizardHint (?) przy polu w FormStep działa i nie zacina się

### Chat
- [ ] Chat otwiera się, SZAFir odpowiada
- [ ] Ubrania z szafy są cytowane po nazwie, nie po UUID
- [ ] item_ids w odpowiedzi → ClothingChip klikalne karty pojawiają się
- [ ] Pogoda ładuje się (lub graceful fallback)
- [ ] WizardHint w chacie działa

### WizardHint
- [ ] `?` button klikalne wszędzie gdzie istnieje
- [ ] Popup pojawia się bez zacinania (smooth animation)
- [ ] Kliknięcie checkmark zamyka popup
- [ ] Kliknięcie tła (backdrop) zamyka popup
- [ ] Popup nie jest przycięty przez overflow rodzica

### Pranie
- [ ] Ubrania ze statusem 'używane'/'w praniu' pojawiają się na liście
- [ ] Grupowanie po temperaturze/trybie działa

### Ogólne
- [ ] BottomNav działa, wszystkie 5 zakładek przełączają ekrany
- [ ] Animacje przejść (slide left/right) są płynne
- [ ] Na iPhone (Safari) — safe area nie zakrywa contentu

---

## 9. Roadmap — gdzie zmierzamy

### Faza 0 — Gotowe ✅
Podstawowa funkcjonalność: auth, galeria, AI analiza, chat, pranie, outfity, onboarding.

### Faza 1 — Jakość danych (następna sesja)
**Priorytet: NEXT-1 i NEXT-2**
- Weryfikacja migracji kolumn AI w Supabase
- Czyszczenie martwego kodu (FilterBar, ai-features)
- `last_worn_at` dla intent "unused"

**Dlaczego teraz:** Dane są fundamentem — brakujące kolumny mogą powodować ciche błędy. Martwy kod mylił w tej sesji podczas dokumentacji.

### Faza 2 — Chat UX (2-3 sesje)
- Persystencja historii chatu (Supabase)
- Streaming odpowiedzi (SSE)
- Intent "unused" z `last_worn_at`

**Dlaczego:** Chat jest najczęściej używaną funkcją. Utrata historii to biggest UX pain point.

### Faza 3 — Skalowalność AI
- Embedding search (vector DB dla szafy 200+ ubrań)
- Lepsza normalizacja / reanaliza dla wszystkich użytkowników

**Dlaczego po fazach 1-2:** Embedding wymaga stabilnych danych (faza 1) i nie jest potrzebny przy małej szafie (< 100 ubrań).

### Faza 4 — Rozszerzenie społeczne
- Dynamiczni właściciele (nie hardcoded)
- Sharing outfitów
- Historia noszenia z statystykami

**Dlaczego na końcu:** Nice-to-have, nie core feature.

---

## CHANGELOG

| Data | Co zmieniono | Sesja |
|------|-------------|-------|
| 2026-04-20 | Pierwsza wersja aplikacji (wg RAPORT.md) | Sesja 0 |
| 2026-04-21 | Audyt danych, DATA-AUDIT.md | Sesja 0/1 |
| 2026-04-22 | WizardTour redesign, persystencja toura (Supabase), WizardHint polish, CSS fixes, dokumentacja | Sesja 1 + 2 |
| 2026-04-22 | WARDROBE-WIZARD-INVENTORY.md, AI-CONFIG.md, PROJECT-SNAPSHOT.md | Sesja 2 |

---

*Koniec PROJECT-SNAPSHOT.md · Następna sesja: zacznij od §5 (otwarte zadania) i §1 (stan projektu) · 2026-04-22*
