export function generateMarkdown(logs, stats) {
  const now = new Date().toLocaleString('pl-PL')

  const byCategory = Object.entries(stats.by_category)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- **${k}**: ${v}`)
    .join('\n')

  const byAction = Object.entries(stats.by_action)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => `- **${k}**: ${v}x`)
    .join('\n')

  const aiLine = stats.avg_ai_duration
    ? `- Średni czas analizy AI: **${stats.avg_ai_duration}ms**`
    : '- Brak danych AI'

  const tableRows = logs.map(l =>
    `| ${new Date(l.created_at).toLocaleString('pl-PL')} ` +
    `| ${l.action} ` +
    `| ${l.category} ` +
    `| ${l.owner || '—'} ` +
    `| ${l.duration_ms ?? '—'} ` +
    `| ${l.success ? '✅' : '❌'} |`
  ).join('\n')

  const errorDetails = logs.filter(l => !l.success).map(l => `
### ❌ ${l.action} — ${new Date(l.created_at).toLocaleString('pl-PL')}
- **Błąd:** ${l.error_message || '—'}
- **Kontekst:** ${JSON.stringify(l.details)}`
  ).join('\n') || '_Brak błędów_'

  const sessionIds = [...new Set(logs.map(l => l.session_id))]
  const sessionDetails = sessionIds.map(sid => {
    const sl = logs.filter(l => l.session_id === sid)
    return `### ${sid}
- Akcji: ${sl.length}
- Start: ${new Date(sl[sl.length - 1]?.created_at).toLocaleString('pl-PL')}
- Koniec: ${new Date(sl[0]?.created_at).toLocaleString('pl-PL')}`
  }).join('\n\n')

  const chatDetails = logs
    .filter(l => l.action === 'chat_message_sent')
    .map(l => {
      const d = l.details
      return `
### 💬 ${new Date(l.created_at).toLocaleString('pl-PL')} | ${l.duration_ms}ms | ${l.success ? '✅' : '❌'}

**Zapytanie:** "${d.query?.message}"
**Intencja:** ${d.query?.intent} | **Typ:** ${d.query?.query_type}

**Kontekst:**
- Pogoda: ${d.context?.weather_temp}°C, ${d.context?.weather_condition}, deszcz ${d.context?.weather_rain_chance}%
- Czas: ${d.context?.day_of_week}, ${d.context?.time_of_day}

**Szafa wysłana do AI:**
- Łącznie: ${d.wardrobe?.sent_to_ai} ubrań
- Warstwy: pierwsza:${d.wardrobe?.layers?.pierwsza} | środkowa:${d.wardrobe?.layers?.srodkowa} | zewnętrzna:${d.wardrobe?.layers?.zewnetrzna} | dół:${d.wardrobe?.layers?.dol}
${d.wardrobe?.warnings?.length > 0
  ? `- ⚠️ Ostrzeżenia: ${d.wardrobe.warnings.join(', ')}`
  : '- ✅ Brak ostrzeżeń'}

**Odpowiedź AI:**
- Tekst: "${d.response?.text_preview}..."
- Polecone ubrania: ${d.response?.item_ids_count} (${d.response?.item_ids?.join(', ')})
- Nazwa outfitu: ${d.response?.outfit_name || '—'}
- Reasoning: "${d.response?.reasoning || '—'}"
- Brakujące: ${d.response?.missing_items?.join(', ') || '—'}

**Jakość:**
- Ubrań z szafy znalezionych: ${d.quality?.items_found_in_wardrobe}/${d.quality?.items_recommended}
- Ma reasoning: ${d.quality?.has_reasoning ? '✅' : '❌'}
- Długość promptu: ${d.quality?.prompt_length} znaków
- Model: ${d.quality?.model}`
    }).join('\n\n---\n') || '_Brak interakcji chat_'

  return `# Wardrobe Wizard — Dev Logs
_Eksport: ${now}_
_Łącznie akcji: ${stats.total_actions}_
_Sesje: ${stats.sessions}_
_Błędy: ${stats.errors}_
_Okres: ${stats.date_range.from?.split('T')[0]} → ${stats.date_range.to?.split('T')[0]}_

---

## Statystyki

### Akcje według kategorii
${byCategory}

### Najczęstsze akcje
${byAction}

### AI Performance
${aiLine}

---

## Logi (ostatnie 500)

| Czas | Akcja | Kategoria | Właściciel | Czas(ms) | Status |
|------|-------|-----------|------------|----------|--------|
${tableRows}

---

## Szczegóły błędów

${errorDetails}

---

## Sesje

${sessionDetails}

---

## Szczegóły interakcji Chat

${chatDetails}

---
_Wygenerowano przez Wardrobe Wizard Dev Tools_`
}
