# Visual Audit — Wardrobe App

## 1. Border-Radius — wszystkie unikalne wartości

| Wartość | Zmienna | Gdzie użyta |
|---------|---------|-------------|
| `16px` | `--radius` | `.dialog`, `.clothing-card`, `.photo-zone`, `.scanner-photo-zone`, `.label-fullscreen`, `.outfit-card`, `.load-card` |
| `12px` | `--radius-sm` | `.btn-ghost`, `.btn-danger`, `textarea`, `.pill-tag`, `.washing-card`, `.outfit-thumb`, `.outfit-picker-card`, `.scanner-match-card`, `.laundry-item-row`, `.load-thumb`, `.chat-item-chip-photo`, `.chat-item-chip-placeholder`, `.detail-label-thumb img` |
| `8px` | `--radius-xs` | `textarea`, `.error-msg`, `.detail-section-label`, `.outfit-name-edit`, `.outfit-picker-header h3` |
| `100px` | `--radius-pill` | `.btn-primary`, `.owner-pill`, `.toggle-chip`, `.pill-tag`, `.view-toggle`, `.filter-trigger`, `.sheet-chip`, `.search-chip`, `.nav-soon-badge`, `.status-pill`, `.sheet-handle` |
| `50%` | — | `.btn-icon-header`, `.spinner`, `.gallery-avatar`, `.label-close-btn`, `.laundry-action-btn`, `.chat-send-btn`, `.chat-typing span`, `.chat-send-spinner` |
| `24px` | — | `.filter-sheet` (top corners), `.scanner-photo-zone` (top corners) |
| `20px` | — | `.detail-photo-wrap` |
| `18px` | — | `.chat-bubble`, `.chat-bubble-user`, `.chat-bubble-assistant` |
| `5px` | — | `.chat-bubble-user` (border-bottom-right-radius), `.chat-bubble-assistant` (border-bottom-left-radius) |
| `6px`, `10px`, `3px–14px` | — | Inline styles na elementach `<img>` z ikonami pixel-art (rozrzucone po komponentach) |

---

## 2. Box-Shadow — wszystkie unikalne wartości

| Wartość | Zmienna / Gdzie użyta |
|---------|-----------------------|
| `0 2px 12px rgba(0,0,0,0.07)` | `--shadow-card` → `.outfit-card`, `.laundry-item-row`, `.load-card`, `.chat-suggestion-chip`, `.chat-item-chip-photo` |
| `0 -4px 32px rgba(0,0,0,0.10)` | `--shadow-sheet` → `.filter-sheet` |
| `0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)` | `.clothing-card`, `.scanner-match-card` |
| `0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)` | `.clothing-card:hover` |
| `0 1px 4px rgba(0,0,0,0.06)` | `.clothing-card:active` |
| `0 1px 4px rgba(0,0,0,0.05)` | `.search-chip` |
| `0 1px 4px rgba(0,0,0,0.06)` | `.view-pill.active` |
| `0 24px 56px rgba(0,0,0,0.15)` | `.dialog`, `.outfit-picker-modal` |
| `0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)` | `.detail-photo-wrap` |
| `0 0 0 2.5px var(--accent), 0 4px 12px rgba(0,0,0,0.12)` | `.scanner-match-card.selected` |
| `drop-shadow(...)` (filter) | Ikony pixel-art — inline styles w komponentach |

---

## 3. Font-Family i Font-Size nagłówków

**Font-family globalny (body):**
```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif
```
Brak importu Google Fonts — wyłącznie system font stack.

| Klasa / Element | font-size | font-weight | Ekran |
|----------------|-----------|-------------|-------|
| `.login-title` | `28px` | 700 | Login |
| `.gallery-greeting` | `1.75rem` (28px) | 700 | Gallery |
| `.laundry-title` | `1.75rem` (28px) | 700 | Laundry |
| `.step-title` | `1.6rem` (25.6px) | 700 | AddClothing |
| `.scanner-title` | `1.5rem` (24px) | 700 | StyleScanner |
| `.detail-category` | `1.5rem` (24px) | 700 | ClothingDetail |
| `.chat-title` | `1.25rem` (20px) | 700 | Chat |
| `.laundry-empty-title` | `1.15rem` (18.4px) | 700 | Laundry empty state |
| `.sheet-title` | `1.1rem` (17.6px) | 700 | FilterSheet |
| `.outfit-picker-header h3` | `1.1rem` (17.6px) | 700 | OutfitPicker modal |
| `.gallery-empty-title` | `1.1rem` (17.6px) | 600 | Gallery empty state |
| `.outfit-name-btn` | `1rem` (16px) | 600 | OutfitCard |
| `.header-title` | `0.95rem` (15.2px) | 600 | screen-header (edycja) |
| `.load-card-title` | `0.9rem` (14.4px) | 600 | LaundryScreen |

---

## 4. Klasy CSS według kategorii

### Przyciski (btn, button, pill, trigger, add)
```
.btn-primary         .btn-ghost           .btn-ghost-sm
.btn-danger          .btn-danger-ghost     .btn-signout
.btn-back            .btn-edit             .btn-login
.btn-icon-header     .btn-outfit-add       .btn-scan-outfit
.nav-add
.owner-pill          .toggle-chip          .view-pill
.view-toggle         .filter-trigger       .sheet-chip
.search-chip         .favorite-filter-pill .favorite-btn
.pill-tag            .pill-tag-input       .pill-input-field
.pill-remove         .status-pill
.outfit-delete-btn   .laundry-action-btn   .load-clean-btn
.chat-suggestion-chip .chat-send-btn
```

### Karty (card, clothing-card)
```
.clothing-card       .card-photo-wrap      .card-photo
.card-photo-loaded   .card-photo-placeholder .card-photo-shimmer
.card-status-icon    .card-owner-badge     .card-info
.card-category       .card-subtitle
.outfit-card         .outfit-card-header   .outfit-card-meta
.outfit-strip        .outfit-thumb         .outfit-name-btn
.outfit-name-edit    .outfit-picker-card   .outfit-picker-grid
.outfit-picker-modal .washing-card         .washing-grid
.load-card           .load-card-header     .load-card-title
.load-card-count     .load-thumbs          .load-thumb
.load-thumb-more     .laundry-item-row     .scanner-match-card
.scanner-no-match    .chat-bubble          .chat-bubble-user
.chat-bubble-assistant .chat-item-chip     .chat-item-chip-photo
.chat-item-chip-placeholder
```

### Nagłówki sekcji (section-label, header, title)
```
.form-section-header  .detail-section       .detail-section-label
.sheet-header         .sheet-section        .sheet-section-label
.search-chip-group    .search-chip-label
.scanner-results-header .scanner-item-header
.laundry-section      .laundry-section-label .laundry-owner-group
.laundry-owner-label  .outfit-card-header
.gallery-header       .gallery-header-right  .gallery-subtitle
.gallery-controls     .gallery-empty-title   .gallery-empty-sub
.screen-header        .chat-header           .chat-title
.chat-title-icon      .chat-suggestions-label
```

### Bottom navigation (nav, bottom)
```
.bottom-nav     .nav-tab       .nav-tab.active
.nav-tab-img    .nav-label     .nav-soon-badge
.nav-add
```

---

## 5. Google Fonts

**Nie ma.** `index.html` nie zawiera żadnego `<link>` do `fonts.googleapis.com` ani `@import` Google Fonts. Cała typografia opiera się na system font stack.
