function normalize(s) {
  return (s ?? '').toLowerCase().trim()
}

function textMatch(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

function seasonOverlap(detectedSeasons, itemSeasons) {
  if (!detectedSeasons?.length || !itemSeasons?.length) return false
  const ds = detectedSeasons.map(normalize)
  const is = itemSeasons.map(normalize)
  return ds.some(s => is.includes(s))
}

export function matchItemToWardrobe(detectedItem, clothes) {
  return clothes
    .map(item => {
      let score = 0
      if (textMatch(detectedItem.item_type, item.category)) score += 40
      if (
        textMatch(detectedItem.dominant_color, item.dominant_color) ||
        (item.colors ?? []).some(c => textMatch(detectedItem.dominant_color, c))
      ) score += 25
      if (textMatch(detectedItem.pattern, item.pattern)) score += 15
      if (textMatch(detectedItem.formality, item.formality)) score += 10
      if (seasonOverlap(detectedItem.season, item.season)) score += 10
      return { ...item, _score: score }
    })
    .filter(item => item._score > 30)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
}
