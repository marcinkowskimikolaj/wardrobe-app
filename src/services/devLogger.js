import { supabase } from './supabase'

const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

const APP_VERSION = '1.0.0'

export const LOG_CATEGORY = {
  CLOTHING: 'clothing',
  OUTFIT: 'outfit',
  LAUNDRY: 'laundry',
  CHAT: 'chat',
  AI: 'ai',
  AUTH: 'auth',
  NAVIGATION: 'navigation',
  ERROR: 'error',
  SCANNER: 'scanner',
  SEARCH: 'search',
}

export const logAction = async ({
  action,
  category,
  details = {},
  duration_ms = null,
  success = true,
  error_message = null,
  owner = null,
}) => {
  try {
    await supabase.from('dev_logs').insert({
      owner,
      session_id: SESSION_ID,
      action,
      category,
      details,
      duration_ms,
      success,
      error_message,
      app_version: APP_VERSION,
    })
  } catch (err) {
    console.warn('Logger error:', err)
  }
}

export const withTiming = async (fn) => {
  const start = Date.now()
  try {
    const result = await fn()
    return { result, duration_ms: Date.now() - start, success: true }
  } catch (err) {
    return { error: err, duration_ms: Date.now() - start, success: false }
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function detectLanguageIssues(data) {
  const issues = []
  const englishPattern = /^[a-zA-Z\s,]+$/
  if (data.material && englishPattern.test(data.material)) issues.push('material')
  if (data.season?.some(s => ['spring', 'summer', 'autumn', 'winter'].includes(s))) issues.push('season')
  if (data.style_tags?.some(t => englishPattern.test(t))) issues.push('style_tags')
  return issues
}

function countNullFields(data) {
  const importantFields = [
    'clothing_layer', 'formality', 'formality_score',
    'warmth_level', 'dominant_color', 'pattern', 'fit', 'occasion', 'subcategory',
  ]
  return importantFields.filter(f => !data[f]).length
}

function containsWashingInfo(text) {
  return ['pranie', 'temperatura', 'suszarka', 'prasowanie', '°c']
    .some(w => text.toLowerCase().includes(w))
}

// ─── CLOTHING ────────────────────────────────────────────────────────────────

export const logClothingAdded = (item, duration_ms) =>
  logAction({
    action: 'clothing_added',
    category: LOG_CATEGORY.CLOTHING,
    owner: item.owner,
    duration_ms,
    details: {
      category: item.category,
      subcategory: item.subcategory,
      dominant_color: item.dominant_color,
      material: item.material,
      clothing_layer: item.clothing_layer,
      formality: item.formality,
      formality_score: item.formality_score,
      warmth_level: item.warmth_level,
      season: item.season,
      occasion: item.occasion,
      has_label_photo: !!item.label_photo_url,
      manual_mode: !item.ai_model,
      ai_model: item.ai_model,
      prompt_tags_count: item.prompt_tags?.length || 0,
      style_tags_count: item.style_tags?.length || 0,
      washing_temp: item.washing_temp,
      description_length: item.ai_description?.length || 0,
    },
  })

export const logClothingDeleted = (item) =>
  logAction({
    action: 'clothing_deleted',
    category: LOG_CATEGORY.CLOTHING,
    owner: item.owner,
    details: {
      category: item.category,
      age_days: Math.floor((Date.now() - new Date(item.created_at)) / 86400000),
    },
  })

export const logClothingViewed = (item) =>
  logAction({
    action: 'clothing_viewed',
    category: LOG_CATEGORY.CLOTHING,
    owner: item.owner,
    details: {
      category: item.category,
      clothing_layer: item.clothing_layer,
      status: item.status,
      days_since_added: Math.floor((Date.now() - new Date(item.created_at)) / 86400000),
    },
  })

export const logFavoriteToggled = (item, is_favorite) =>
  logAction({
    action: 'favorite_toggled',
    category: LOG_CATEGORY.CLOTHING,
    owner: item.owner,
    details: {
      category: item.category,
      is_favorite,
      days_since_added: Math.floor((Date.now() - new Date(item.created_at)) / 86400000),
    },
  })

export const logReanalysis = (item, duration_ms, success, changed_fields) =>
  logAction({
    action: 'clothing_reanalyzed',
    category: LOG_CATEGORY.AI,
    owner: item.owner,
    duration_ms,
    success,
    details: {
      category: item.category,
      changed_fields,
      changed_fields_count: changed_fields?.length || 0,
    },
  })

// ─── AI ──────────────────────────────────────────────────────────────────────

export const logAIAnalysis = (duration_ms, success, result, had_label_photo = false) =>
  logAction({
    action: 'ai_analysis',
    category: LOG_CATEGORY.AI,
    duration_ms,
    success,
    details: {
      model: result?.ai_model,
      category_detected: result?.category,
      subcategory_detected: result?.subcategory,
      clothing_layer: result?.clothing_layer,
      had_label_photo,
      language_issues: result ? detectLanguageIssues(result) : null,
      null_fields: result ? countNullFields(result) : null,
      season_count: result?.season?.length || 0,
      prompt_tags_count: result?.prompt_tags?.length || 0,
      formality_score: result?.formality_score,
      warmth_level: result?.warmth_level,
      description_ok: result?.ai_description
        ? !containsWashingInfo(result.ai_description)
        : false,
    },
  })

// ─── LAUNDRY ─────────────────────────────────────────────────────────────────

export const logStatusChanged = (item, from_status, to_status) =>
  logAction({
    action: 'status_changed',
    category: LOG_CATEGORY.LAUNDRY,
    owner: item.owner,
    details: {
      category: item.category,
      from_status,
      to_status,
      days_in_previous_status: item.last_washed
        ? Math.floor((Date.now() - new Date(item.last_washed)) / 86400000)
        : null,
    },
  })

// ─── CHAT ────────────────────────────────────────────────────────────────────

export const logChatMessage = (prompt, response, duration_ms, success, weatherData) =>
  logAction({
    action: 'chat_message_sent',
    category: LOG_CATEGORY.CHAT,
    duration_ms,
    success,
    details: {
      prompt_length: prompt.length,
      prompt_preview: prompt.substring(0, 80),
      intent: response?.intent || null,
      items_recommended: response?.item_ids?.length || 0,
      has_outfit_name: !!response?.outfit_name,
      has_reasoning: !!response?.reasoning,
      response_preview: response?.text?.substring(0, 100),
      weather_available: !!weatherData,
      weather_temp: weatherData?.current_temp || null,
    },
  })

export const logChatInteraction = async ({
  owner,
  duration_ms,
  success,
  error_message = null,
  user_message,
  intent,
  query_type,
  weather_temp,
  weather_condition,
  weather_rain_chance,
  day_of_week,
  time_of_day,
  clothes_total,
  clothes_sent_to_ai,
  wardrobe_layers,
  wardrobe_warnings,
  ai_response_text,
  ai_item_ids,
  ai_outfit_name,
  ai_reasoning,
  ai_missing_items,
  ai_asking_clarification,
  items_found_in_wardrobe,
  response_length,
  model_used,
  prompt_length,
}) => logAction({
  action: 'chat_message_sent',
  category: LOG_CATEGORY.CHAT,
  owner,
  duration_ms,
  success,
  error_message,
  details: {
    query: {
      message: user_message,
      message_length: user_message?.length,
      intent,
      query_type,
    },
    context: {
      weather_temp,
      weather_condition,
      weather_rain_chance,
      day_of_week,
      time_of_day,
    },
    wardrobe: {
      total_clothes: clothes_total,
      sent_to_ai: clothes_sent_to_ai,
      layers: wardrobe_layers,
      warnings: wardrobe_warnings,
    },
    response: {
      text_preview: ai_response_text?.substring(0, 200),
      text_length: ai_response_text?.length,
      item_ids_count: ai_item_ids?.length || 0,
      item_ids: ai_item_ids,
      outfit_name: ai_outfit_name,
      reasoning: ai_reasoning,
      missing_items: ai_missing_items,
      asking_clarification: ai_asking_clarification,
    },
    quality: {
      items_found_in_wardrobe,
      items_recommended: ai_item_ids?.length || 0,
      has_reasoning: !!ai_reasoning,
      has_outfit_name: !!ai_outfit_name,
      response_length,
      model: model_used,
      prompt_length,
    },
  },
})

// ─── OUTFITS ─────────────────────────────────────────────────────────────────

export const logOutfitSaved = (outfit, source, scanner_match_rate = null) =>
  logAction({
    action: 'outfit_saved',
    category: LOG_CATEGORY.OUTFIT,
    owner: outfit.owner,
    details: {
      items_count: outfit.clothing_ids?.length,
      source,
      has_name: !!outfit.name,
      scanner_match_rate,
    },
  })

// ─── SCANNER ─────────────────────────────────────────────────────────────────

export const logScannerUsed = (
  duration_ms, success, detected_count, matched_count,
  skipped_count = 0, saved_as_outfit = false,
) =>
  logAction({
    action: 'scanner_used',
    category: LOG_CATEGORY.SCANNER,
    duration_ms,
    success,
    details: {
      detected_items: detected_count,
      matched_items: matched_count,
      skipped_items: skipped_count,
      saved_as_outfit,
      match_rate: detected_count > 0 ? Math.round((matched_count / detected_count) * 100) : 0,
      skip_rate: detected_count > 0 ? Math.round((skipped_count / detected_count) * 100) : 0,
    },
  })

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

export const logNavigation = (from, to) =>
  logAction({
    action: 'screen_navigation',
    category: LOG_CATEGORY.NAVIGATION,
    details: { from, to },
  })

export const logFilterUsed = (filters) =>
  logAction({
    action: 'filter_used',
    category: LOG_CATEGORY.NAVIGATION,
    details: {
      active_filters: Object.keys(filters).filter(k => filters[k]?.length > 0),
      filters_count: Object.values(filters).flat().length,
    },
  })

// ─── SEARCH ──────────────────────────────────────────────────────────────────

export const logSearch = (query, results_count, clicked_result = false) =>
  logAction({
    action: 'search_performed',
    category: LOG_CATEGORY.SEARCH,
    details: {
      query,
      query_length: query.length,
      results_count,
      clicked_result,
    },
  })

// ─── ERRORS ──────────────────────────────────────────────────────────────────

export const logError = (error, context) =>
  logAction({
    action: 'error_occurred',
    category: LOG_CATEGORY.ERROR,
    success: false,
    error_message: error.message,
    details: { context, stack: error.stack?.substring(0, 200) },
  })

// ─── FETCH / STATS ───────────────────────────────────────────────────────────

export const fetchLogs = async (limit = 500) => {
  const { data } = await supabase
    .from('dev_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export const fetchLogStats = async () => {
  const { data } = await supabase
    .from('dev_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (!data) return null

  const stats = {
    total_actions: data.length,
    by_category: {},
    by_action: {},
    errors: data.filter(l => !l.success).length,
    sessions: [...new Set(data.map(l => l.session_id))].length,
    avg_ai_duration: null,
    date_range: {
      from: data[data.length - 1]?.created_at,
      to: data[0]?.created_at,
    },
  }

  data.forEach(log => {
    stats.by_category[log.category] = (stats.by_category[log.category] || 0) + 1
    stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1
  })

  const aiLogs = data.filter(l => l.action === 'ai_analysis' && l.duration_ms)
  if (aiLogs.length) {
    stats.avg_ai_duration = Math.round(
      aiLogs.reduce((s, l) => s + l.duration_ms, 0) / aiLogs.length
    )
  }

  return stats
}
