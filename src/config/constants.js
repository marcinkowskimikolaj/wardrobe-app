// Właściciele ubrań — hardcoded, zmień tutaj jeśli trzeba
export const OWNERS = ['Mikołaj', 'Emilka']

// Email konta deweloperskiego — tylko ten użytkownik widzi tryb ręczny
export const DEV_EMAIL = 'mikolo321@gmail.com'

// Mapowanie email → imię właściciela (do powitania i domyślnego filtra)
export const OWNER_EMAILS = {
  'mikolo321@gmail.com': 'Mikołaj',
  'aemilka@gmail.com': 'Emilka',
}

export function getOwnerFromEmail(email) {
  return OWNER_EMAILS[email] ?? null
}

// Dostępne statusy ubrań
export const STATUSES = {
  CLEAN: 'czyste',
  USED: 'używane',
  WASHING: 'w praniu',
}

export const STATUS_LABELS = {
  czyste: 'Czyste',
  używane: 'Używane',
  'w praniu': 'W praniu',
}

export const STATUS_COLORS = {
  czyste: '#22c55e',     // zielony
  używane: '#eab308',    // żółty
  'w praniu': '#3b82f6', // niebieski
}

// Kategorie ubrań
export const CATEGORIES = [
  'koszula',
  'bluza',
  'sweter',
  't-shirt',
  'top',
  'spodnie',
  'szorty',
  'sukienka',
  'spódnica',
  'kurtka',
  'płaszcz',
  'marynarka',
  'garnitur',
  'dres',
  'bielizna',
  'skarpety',
  'buty',
  'akcesoria',
  'inne',
]

// Warstwy ubrania
export const CLOTHING_LAYERS = [
  'bielizna',
  'pierwsza warstwa',
  'środkowa warstwa',
  'zewnętrzna warstwa',
  'dodatek',
  'inne',
]

// Sezony
export const SEASONS = ['wiosna', 'lato', 'jesień', 'zima']

// Tryby prania
export const WASHING_MODES = [
  'delikatne',
  'normalne',
  'intensywne',
  'ręczne',
  'pranie w sieci',
  'tylko chemiczne',
]

// Tryby suszenia
export const DRYING_OPTIONS = [
  'suszarka bębnowa',
  'suszenie na powietrzu',
  'suszenie płaskie',
  'nie używać suszarki',
]

// Opcje prasowania
export const IRONING_OPTIONS = [
  'niska temperatura',
  'średnia temperatura',
  'wysoka temperatura',
  'nie prasować',
  'prasować przez ściereczkę',
]

// Grupy kolorystyczne prania
export const WASH_COLOR_GROUPS = [
  'białe', 'jasne', 'kolorowe', 'ciemne', 'delikatne',
]

// Filtry w galerii — klucze owner_ muszą zawierać dokładną nazwę właściciela
export const GALLERY_FILTERS = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'owner_Mikołaj', label: 'Mikołaj' },
  { key: 'owner_Emilka', label: 'Emilka' },
  { key: 'status_czyste', label: 'Czyste' },
  { key: 'status_używane', label: 'Używane' },
  { key: 'status_w praniu', label: 'W praniu' },
]
