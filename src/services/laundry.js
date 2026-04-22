import { STATUSES, WASH_COLOR_GROUPS } from '../config/constants'

const DIRTY = [STATUSES.USED, STATUSES.WASHING]

export function getDirtyClothes(clothes) {
  return clothes.filter(c => DIRTY.includes(c.status))
}

export function groupByOwner(clothes) {
  const groups = {}
  for (const item of clothes) {
    const owner = item.owner ?? 'Nieznany'
    if (!groups[owner]) groups[owner] = []
    groups[owner].push(item)
  }
  return groups
}

const COLOR_ORDER = ['białe', 'jasne', 'kolorowe', 'ciemne', 'delikatne']

export function recommendLaundryLoads(clothes) {
  const dirty = getDirtyClothes(clothes)
  if (!dirty.length) return []

  const groups = {}
  for (const item of dirty) {
    const temp = item.washing_temp ?? null
    const mode = item.washing_mode ?? null
    const colorGroup = WASH_COLOR_GROUPS.includes(item.wash_color_group) ? item.wash_color_group : null
    const key = `${temp ?? 'brak'}__${mode ?? 'brak'}__${colorGroup ?? 'brak'}`
    if (!groups[key]) groups[key] = { temp, mode, colorGroup, items: [] }
    groups[key].items.push(item)
  }

  return Object.values(groups).sort((a, b) => {
    const ta = a.temp ?? 999
    const tb = b.temp ?? 999
    if (ta !== tb) return ta - tb
    const ca = COLOR_ORDER.indexOf(a.colorGroup ?? '')
    const cb = COLOR_ORDER.indexOf(b.colorGroup ?? '')
    return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb)
  })
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
