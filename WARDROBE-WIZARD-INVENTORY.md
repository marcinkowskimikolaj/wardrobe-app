# WARDROBE WIZARD — PROJECT INVENTORY
> Senior AI Architect Documentation · Generated 2026-04-22 · Context file for future Claude sessions

---

## 1. PRODUCT DESCRIPTION

**Wardrobe Wizard** (internal codename: SZAFir) is a Polish-language mobile PWA that acts as a personal AI stylist and wardrobe manager. Users photograph clothing items; the AI identifies them, extracts care instructions, and stores structured records. The AI assistant (named SZAFir) answers natural-language questions in Polish about what to wear — factoring in current weather, occasion, and the user's actual wardrobe inventory.

**Live URL:** https://wardrobe-app-sage.vercel.app  
**Codebase:** `/Users/mikolajmarcinkowski/Documents/Wardrobe App`  
**Platform:** React 18 PWA, Vercel deployment, iOS/Android via browser

---

## 2. USERS & ROLES

Two named users, hardcoded in `src/config/constants.js`:

| User | Email | Owner Name | Role |
|------|-------|------------|------|
| Mikołaj | mikolo321@gmail.com | Mikołaj | Admin / Developer |
| Emilka | aemilka@gmail.com | Emilka | Regular user |

- **DEV_EMAIL** (`mikolo321@gmail.com`) gets extra dev tools: manual AI override mode, dev toolbar (refresh/delete/wrench), access to log export
- **ownerName** is derived from authenticated email via `getOwnerFromEmail()` — used for gallery filter defaults and AI chat context
- Supabase Auth handles authentication (email/password)
- Both users share the same `clothes` table — each item has an `owner` field (string: 'Mikołaj' or 'Emilka')

---

## 3. TECH STACK

| Layer | Technology | Version / Detail |
|-------|-----------|-----------------|
| Frontend | React | 18.3.1 |
| Build | Vite | 5.4.8 |
| PWA | vite-plugin-pwa | 0.21.0 |
| Backend / DB | Supabase (PostgreSQL) | @supabase/supabase-js ^2.45.4 |
| Auth | Supabase Auth | Email/password |
| Storage | Supabase Storage | Bucket: `clothes-photos` |
| AI Vision | Groq API | `meta-llama/llama-4-scout-17b-16e-instruct` |
| AI Chat | Groq API | `llama-3.3-70b-versatile` |
| Weather | Open-Meteo | Free, no API key, geolocation-based |
| Deployment | Vercel | Auto-deploy from git |
| Styling | Pure CSS (index.css) | No CSS framework |

**Environment variables** (set in Vercel + `.env.local`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GROQ_API_KEY
```

---

## 4. APP STRUCTURE (FILE TREE)

```
src/
├── App.jsx                          # Root: routing, auth guard, tour control
├── main.jsx                         # React root mount
├── index.css                        # All styles (single file, ~1000+ lines)
├── config/
│   └── constants.js                 # OWNERS, STATUSES, CATEGORIES, filters etc.
├── services/
│   ├── supabase.js                  # All DB/storage operations + auth
│   ├── groq.js                      # AI clothing analysis + outfit scanning
│   ├── chat.js                      # Chat intent detection + stylist logic
│   ├── laundry.js                   # Dirty clothes grouping + load recommendations
│   ├── weather.js                   # Open-Meteo fetch + context formatting
│   ├── devLogger.js                 # Analytics event logging (dev_logs table)
│   ├── logExporter.js               # CSV export of dev logs
│   ├── ai-features.js               # AI feature flags / helpers
│   └── styleScanner.js              # Outfit style detection service
├── hooks/
│   ├── useAuth.js                   # Auth state (user, loading)
│   ├── useClothes.js                # Clothes list with optimistic updates
│   └── useOutfits.js                # Outfits list with optimistic updates
├── components/
│   ├── Auth/
│   │   └── Login.jsx                # Login form
│   ├── Gallery/
│   │   ├── Gallery.jsx              # Main wardrobe grid view
│   │   ├── ClothingCard.jsx         # Individual item card
│   │   ├── SearchBar.jsx            # Search input with chips
│   │   └── FilterSheet.jsx          # Bottom sheet: color/brand/season/occasion filters
│   ├── AddClothing/
│   │   ├── AddClothing.jsx          # 3-step wizard orchestrator
│   │   ├── PhotoStep.jsx            # Camera/upload step
│   │   ├── AnalyzingStep.jsx        # "AI is thinking" animation
│   │   └── FormStep.jsx             # Review/edit AI results form
│   ├── ClothingDetail/
│   │   ├── ClothingDetail.jsx       # Full item detail overlay
│   │   └── WashingInfo.jsx          # Care label display
│   ├── Outfits/
│   │   ├── OutfitsScreen.jsx        # Saved outfits grid
│   │   ├── OutfitCard.jsx           # Outfit card with item thumbnails
│   │   ├── OutfitPicker.jsx         # Item picker for building outfits
│   │   └── StyleScanner.jsx         # Photo-to-outfit matching
│   └── UI/
│       ├── BottomNav.jsx            # 5-tab bottom navigation
│       ├── WizardTour.jsx           # 7-step onboarding tour overlay
│       ├── WizardHint.jsx           # Contextual ? help bubbles
│       ├── KokosEasterEgg.jsx       # Hidden dog easter egg
│       ├── ConfirmDialog.jsx        # Delete confirmation dialog
│       ├── LoadingSpinner.jsx       # Global loading indicator
│       ├── StatusBadge.jsx          # Status color pill
│       └── TagList.jsx              # Tag chip list renderer
public/
├── assets/                          # 56 pixel-art PNG icons (see §14)
├── manifest.json                    # PWA manifest
└── sw.js / workbox                  # Service worker (generated by vite-plugin-pwa)
```

---

## 5. SCREENS & NAVIGATION

Navigation is state-based in `App.jsx` — no router library. Screen transitions use CSS classes (`screen-enter-right`, `screen-enter-left`, `screen-slide-up`, `screen-slide-exit`).

### Screen Map

| Screen key | Component | Presentation | Notes |
|-----------|-----------|-------------|-------|
| `gallery` | `Gallery` | Always rendered as base layer | Default/home screen |
| `detail` | `ClothingDetail` | Fixed overlay, slide-up | Selected clothing item |
| `add` | `AddClothing` | Fixed overlay, slide-up | 3-step wizard |
| `outfits` | `OutfitsScreen` | Fixed overlay, slides L/R | |
| `laundry` | `LaundryScreen` | Fixed overlay, slides L/R | |
| `chat` | `ChatScreen` | Fixed overlay, slides L/R | |

### BottomNav Tabs (data-tab attributes)
```
[gallery]  [outfits]  [add/+]  [laundry]  [chat]
  Szafa     Outfity   Dodaj    Pranie     Chat
```
- `data-tab` attributes enable CSS/querySelector targeting by WizardTour for highlight effects
- BottomNav hidden on `add` and `detail` screens

### Slide Direction Logic
```js
const TAB_INDEX = { gallery:0, outfits:1, laundry:2, chat:3 }
// newIdx >= oldIdx → slide from right; newIdx < oldIdx → slide from left
```

---

## 6. DATABASE SCHEMA (Supabase PostgreSQL)

### Table: `clothes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| created_at | timestamptz | |
| owner | text | 'Mikołaj' or 'Emilka' |
| name | text | AI-generated or user-edited |
| category | text | From CATEGORIES constant |
| colors | text[] | Array of color strings |
| dominant_color | text | Primary color |
| secondary_colors | text[] | |
| material | text | |
| style_tags | text[] | |
| season | text[] | ['wiosna','lato','jesień','zima'] subset |
| washing_temp | int | e.g. 30, 40, 60 |
| washing_mode | text | From WASHING_MODES |
| drying | text | From DRYING_OPTIONS |
| ironing | text | From IRONING_OPTIONS |
| ai_description | text | Natural language description |
| prompt_tags | text[] | For AI search context |
| status | text | 'czyste' / 'używane' / 'w praniu' |
| photo_url | text | Supabase Storage public URL |
| fit | text | |
| neckline | text | |
| sleeve_length | text | |
| length | text | |
| pattern | text | |
| formality | text | |
| formality_score | int | 1–10 |
| subcategory | text | |
| occasion | text[] | |
| texture | text | |
| warmth_level | int | |
| clothing_layer | text | From CLOTHING_LAYERS |
| brand | text | |
| embedding_ready | bool | true if AI filled key fields |
| notes | text | User notes |

### Table: `user_favorites`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → auth.users |
| clothing_id | uuid | FK → clothes.id |

### Table: `outfits`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| created_at | timestamptz | |
| name | text | |
| item_ids | uuid[] | Array of clothing IDs |
| occasion | text | |
| season | text | |
| notes | text | |
| cover_photo_url | text | Optional |

### Table: `user_preferences`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid (PK) | FK → auth.users |
| tour_completed | bool | Onboarding tour seen |
| tour_completed_at | timestamptz | |

RLS enabled — users can only read/write their own rows.

### Table: `dev_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| created_at | timestamptz | |
| session_id | text | Random per app session |
| action | text | e.g. 'clothing_added' |
| category | text | LOG_CATEGORY enum |
| details | jsonb | Structured event data |
| duration_ms | int | Operation duration |
| success | bool | |
| error_message | text | |
| owner | text | Which user's data was affected |

### Storage Bucket: `clothes-photos`
- Path pattern: `clothing/{timestamp}-{random}.jpg`
- Label photos: `labels/{timestamp}-{random}.jpg`
- Images compressed to max 1200px JPEG quality 0.82 before upload

---

## 7. FEATURE REGISTRY

### F1 · AI Clothing Recognition
- **Entry:** AddClothing → PhotoStep (camera/file upload) → `analyzeClothing()` in `groq.js`
- **Model:** `meta-llama/llama-4-scout-17b-16e-instruct` (vision)
- **Input:** clothing photo + optional label photo (both converted to base64)
- **Output:** JSON with ~25 fields (name, category, colors, material, washing instructions, seasonal tags, formality, layer, texture, warmth, occasions, brand)
- **Manual override:** DEV_EMAIL users can bypass AI and fill form manually

### F2 · AI Chat Stylist (SZAFir)
- **Entry:** ChatScreen → `sendChatMessage()` in `chat.js`
- **Model:** `llama-3.3-70b-versatile` (text)
- **Context provided:** full wardrobe inventory (formatted by owner + layer), current weather from Open-Meteo
- **Intent detection:** full_outfit, weather_based, occasion_based, color_based, brand_query, inventory_check, care_advice, missing_items
- **Output format:** `{ text, item_ids[], outfit_name, reasoning, missing_items[], asking_clarification }`
- **Rule:** always recommend ≥2 items; never suggest single pieces
- **Suggested prompts:** 8 contextual shortcuts updated based on weather/time

### F3 · Outfit Scanner
- **Entry:** OutfitsScreen → StyleScanner → photo upload → `scanOutfitStyle()` in `groq.js`
- **Purpose:** scan Instagram/web outfit photos, match to user's wardrobe items
- **Output:** style description + matched item IDs

### F4 · Laundry Manager
- **Entry:** LaundryScreen (clothes with status 'używane' or 'w praniu')
- **Logic:** `recommendLaundryLoads()` in `laundry.js` — groups by washing_temp + washing_mode
- **Display:** sorted by temperature; each "load" shows items, temp, mode

### F5 · Gallery with Filters
- **Filters:** owner, status, color, brand, season, occasion (composable)
- **Search:** text search + filter chips in `SearchBar.jsx` / `FilterSheet.jsx`
- **Views:** grid vs list toggle
- **Favorites:** star icon, stored in `user_favorites` table

### F6 · Clothing Detail
- **Status cycle:** czyste → używane → w praniu → czyste (tap cycling)
- **Edit:** inline field editing with save
- **Delete:** with confirmation dialog + photo cleanup from storage
- **Outfit membership:** shows which outfits include this item

### F7 · Onboarding Tour (WizardTour)
- 7-step overlay tour triggered on first login (per account, stored in `user_preferences`)
- Highlights BottomNav buttons via `data-tab` CSS selectors + `.tour-highlighted` class
- Restartable via avatar button in Gallery header
- `markTourCompleted(userId)` upserts to `user_preferences` on finish/skip

### F8 · Contextual Help (WizardHint)
- `?` buttons at key UI locations
- 8 hint keys: `gallery-filters`, `gallery-search`, `clothing-status`, `clothing-layer`, `outfits-scanner`, `laundry-loads`, `chat-suggestions`, `add-ai`
- Popup: `position:fixed; bottom:calc(...)` — escapes all overflow:hidden parents

### F9 · Kokos Easter Egg
- Hidden trigger in ChatScreen (specific interaction)
- Displays full-screen overlay with dog photo (`kokos-easter.png`)
- Component: `KokosEasterEgg.jsx`

### F10 · Developer Tools
- Only visible to `mikolo321@gmail.com`
- Dev toolbar in Gallery: refresh, delete all, wrench (log export)
- Manual AI mode in AddClothing (skip AI, fill form manually)
- Log export as CSV

---

## 8. EXTERNAL SERVICES

### Groq API
- **Key env:** `VITE_GROQ_API_KEY`
- **Base URL:** `https://api.groq.com/openai/v1/chat/completions`
- **Vision model:** `meta-llama/llama-4-scout-17b-16e-instruct`
- **Chat model:** `llama-3.3-70b-versatile`
- **Image format:** base64 data URL in `image_url` content part
- **Temperature:** 0.2 (analysis), ~0.7 (chat)
- **System prompt:** Polish language, detailed clothing taxonomy

### Supabase
- **Project ref:** `altitfgqnxnohiqdkmrq`
- **Region:** West EU (Ireland)
- **URL env:** `VITE_SUPABASE_URL`
- **Anon key env:** `VITE_SUPABASE_ANON_KEY`
- **CLI token (in memory):** `[TOKEN UNIEWAŻNIONY]`
- **Storage bucket:** `clothes-photos` (public)

### Open-Meteo
- **URL:** `https://api.open-meteo.com/v1/forecast`
- **No API key** required
- **Data:** current conditions + 3-day forecast
- **Requires:** browser geolocation permission

---

## 9. DESIGN SYSTEM

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6D28D9` | Buttons, active states, tour highlights |
| Status clean | `#22c55e` | Green |
| Status used | `#eab308` | Yellow |
| Status washing | `#3b82f6` | Blue |

### CSS Variables
```css
--nav-h: 83px        /* BottomNav height */
--safe-bottom        /* env(safe-area-inset-bottom, 0px) */
```

### Positioning Patterns
- **Fixed overlays:** All major screens use `position:fixed` overlays
- **Safe area:** `calc(env(safe-area-inset-bottom, 0px) + Xpx)` for bottom-positioned elements
- **Escape hatch:** Elements inside `overflow:auto` containers that need screen-relative position must use `position:fixed` (not `absolute`) — WizardHint popup and KokosEasterEgg follow this pattern

### Animations
- Screen transitions: `screen-enter-right`, `screen-enter-left` (translateX slide, 260ms)
- Screen exit: `screen-slide-exit` (translateX, 260ms)
- Tour highlight pulse: `tour-pulse` keyframe, 1.5s ease infinite
- Hint appear: `hint-appear` — `translateY(10px)→0`, NO translateX (breaks with `left:16px; right:16px` layout)
- Performance: `will-change: transform, opacity` on animated popup elements; avoid `backdrop-filter` on appearing elements (causes GPU recomposition jank)

### Pixel Art Icons
- All icons are pixel-art PNG sprites
- CSS: `image-rendering: pixelated` on pixel icons
- Navigation icons: 32×32px, active = normal, inactive = `grayscale(60%) opacity(0.55)`
- BottomNav add button: 40×40px, always full color

---

## 10. LOGGING & ANALYTICS

### devLogger.js
Full event tracking via `logAction()` → `dev_logs` Supabase table.

**LOG_CATEGORY enum:**
```
CLOTHING, OUTFIT, LAUNDRY, CHAT, AI, AUTH, NAVIGATION, ERROR, SCANNER, SEARCH
```

**Key logged events:**
- `clothing_added` — with AI analysis quality metrics (null fields, language issues, washing validation)
- `clothing_deleted`, `clothing_viewed`, `favorite_toggled`
- `ai_analysis` — duration_ms, success, field counts, language detection, label used
- `chat_message` — intent, item_ids recommended, weather context used, response time
- `outfit_saved`, `scanner_used`
- `navigation` — from/to screen
- `filter_used`, `search_performed`
- `error` — component + stack trace

### logExporter.js
- `fetchLogs(limit=500)` — raw log rows
- `fetchLogStats()` — aggregate analytics
- CSV export available via dev toolbar

---

## 11. ONBOARDING / TOUR SYSTEM

### WizardTour (7 steps)
```
welcome → gallery → add → outfits → laundry → chat → finish
```

Each step:
```js
{
  id: string,
  screen: 'gallery' | 'outfits' | 'laundry' | 'chat',
  image: '/assets/szafir-*.png',
  titleIcon: '/assets/*.png' | null,
  title: string,              // supports {name} interpolation
  message: string,
  highlightSelector: string | null  // CSS selector for BottomNav element to pulse
}
```

**Highlight mechanism:**
```js
useEffect(() => {
  const el = document.querySelector(currentStep.highlightSelector)
  if (el) el.classList.add('tour-highlighted')
  return () => el?.classList.remove('tour-highlighted')
}, [step])
```

**CSS for highlight:**
```css
.tour-highlighted {
  z-index: 10001;
  box-shadow: 0 0 0 3px #6D28D9, 0 0 0 6px rgba(109,40,217,0.3);
  animation: tour-pulse 1.5s ease infinite;
}
```

**Persistence:** `user_preferences.tour_completed` via Supabase (per-account, not per-device)

**Restart:** Gallery header avatar button → `handleRestartTour()` in App.jsx → `setShowTour(true)`

### WizardHint (8 hint keys)
```
gallery-filters | gallery-search | clothing-status | clothing-layer
outfits-scanner | laundry-loads  | chat-suggestions | add-ai
```
Popup is `position:fixed` to escape all overflow parents. Animation: `hint-appear` (translateY only).

---

## 12. KNOWN ISSUES & CONSTRAINTS

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Gallery base layer always rendered | By design | All overlays are `position:fixed` on top |
| 2 | No router — history/back button may not work correctly | Known | State-based navigation |
| 3 | GROQ vision model requires base64 (not URL) | Known | ~2MB file → ~2.7MB base64, stays under Groq limits |
| 4 | Two hardcoded users | By design | Multi-user support not planned |
| 5 | Single index.css file | By design | ~1000+ lines, no CSS modules |
| 6 | `position:fixed` required for popups inside overflow:auto parents | Pattern | WizardHint, KokosEasterEgg both use this |
| 7 | `backdrop-filter` on animating elements causes jank | Fixed | Removed from WizardHint popup |
| 8 | `translateX(-50%)` in keyframes conflicts with `left:16px; right:16px` layout | Fixed | Keyframes use translateY only |
| 9 | Kokos easter egg: use `bottom: calc(var(--nav-h) + var(--safe-bottom) + 76px)` to clear 65px chat input bar | Fixed | |
| 10 | Gallery controls row overflow on 390px screens | Fixed | Reduced padding/gap on `.gallery-controls`, `.view-pill` |

---

## 13. KEY METRICS & SCALE

- **Target devices:** iOS Safari + Android Chrome (PWA)
- **Min screen width supported:** 390px (iPhone 14/15)
- **Image compression:** max 1200px, JPEG 0.82 quality — typical upload ~150–400KB
- **AI analysis time:** ~2–5 seconds per item (Groq inference)
- **Chat response time:** ~1–3 seconds
- **Wardrobe size:** designed for 50–500 items per user
- **Weather forecast:** 3-day window, auto-timezone

---

## 14. ASSET REGISTRY

All assets in `/public/assets/` — pixel-art PNG format.

### Navigation & UI
| File | Usage |
|------|-------|
| Wieszak.png | Gallery/Szafa tab icon |
| outfit.png | Outfits tab icon |
| Pralka.png | Laundry tab icon |
| Rozdzka.png | Chat tab icon |
| plus.png | Add button (40×40) |
| checkmark.png | WizardHint close button; finish tour icon |
| checkmark-fresh.png | Alternative checkmark |
| star.png | Favorites |
| Lupa.png | Search icon |
| Slonce.png | Gallery header (sunny) |

### Weather Icons
| File | Condition |
|------|-----------|
| weather-rain.png | Rain |
| weather-cloudy.png | Cloudy |
| weather-fog.png | Fog |
| weather-partly.png | Partly cloudy |
| snieg.png | Snow |

### Season Icons
| File | Season |
|------|--------|
| spring.png | Spring |
| season-autumn.png | Autumn |

### Status Icons
| File | Status |
|------|--------|
| status-clean.png | Czyste |
| status-used.png | Używane |
| status-washing.png | W praniu |

### Chat / Wizard
| File | Usage |
|------|-------|
| wizard-idle.png | SZAFir: default state |
| wizard-thinking.png | SZAFir: processing |
| wizard-speaking.png | SZAFir: responding + WizardHint avatar |
| reasoning-bulb.png | Chat reasoning reveal icon |
| outfit-sparkle.png | Outfit name display |

### WizardTour SZAFir Images
| File | Step |
|------|------|
| szafir-welcome.png | welcome + finish steps |
| szafir-gallery.png | gallery step |
| szafir-add.png | add step |
| szafir-outfits.png | outfits step |
| szafir-laundry.png | laundry step |
| szafir-chat.png | chat step |

### Clothing / Care
| File | Usage |
|------|-------|
| washing-machine-action.png | Laundry screen header |
| washing-drop.png | Washing info |
| temperature.png | Temp display |
| drying.png | Drying info |
| ironing.png | Ironing info |
| tshirt.png | Generic clothing placeholder |
| label-tag.png | Label photo in AddClothing |
| no-photo.png | Missing photo fallback |

### Suggestion Icons (Chat quick prompts)
| File | Prompt type |
|------|-------------|
| cloud-rain-outfit.png | Weather-based outfit |
| heart-clothes.png | Favorites/favorite outfit |
| party-star.png | Party/event outfit |
| sneaker.png | Casual/sneaker outfit |
| suit-tie.png | Formal outfit |
| scan-photo.png | Style scanner |
| camera.png | Add photo |

### Action Icons
| File | Usage |
|------|-------|
| edit-pencil.png | Edit button |
| save.png | Save button |

### User Avatars
| File | User |
|------|------|
| avatar-mikolaj.png | Mikołaj |
| avatar-emilka.png | Emilka |

### Dev Tools
| File | Usage |
|------|-------|
| dev-refresh.png | Dev: reload data |
| dev-tools.png | Dev: toolbar toggle |
| dev-trash.png | Dev: delete all |
| dev-wrench.png | Dev: wrench/settings |

### Easter Egg
| File | Notes |
|------|-------|
| kokos-easter.png | Full-screen dog photo (~2.6MB) |

### Misc
| File | Notes |
|------|-------|
| login-hero.png | Login screen illustration (~940KB) |

---

*End of WARDROBE-WIZARD-INVENTORY.md — 14 sections, complete as of 2026-04-22*
