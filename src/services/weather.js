const WEATHER_CODES = {
  0: 'bezchmurnie',
  1: 'częściowe zachmurzenie', 2: 'częściowe zachmurzenie', 3: 'częściowe zachmurzenie',
  45: 'mgła', 48: 'mgła',
  51: 'deszcz', 53: 'deszcz', 55: 'deszcz', 61: 'deszcz', 63: 'deszcz', 65: 'deszcz',
  71: 'śnieg', 73: 'śnieg', 75: 'śnieg', 77: 'śnieg',
  80: 'przelotne opady', 81: 'przelotne opady', 82: 'przelotne opady',
  95: 'burza', 96: 'burza', 99: 'burza'
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('no geolocation')); return }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
  })
}

export async function getWeatherContext() {
  try {
    const pos = await getPosition()
    const { latitude: lat, longitude: lon } = pos.coords

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,windspeed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=1`

    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const c = data.current
    const d = data.daily
    const condition = WEATHER_CODES[c.weathercode] ?? 'nieznane warunki'
    const rainChance = d.precipitation_probability_max?.[0] ?? 0
    const windKmh = Math.round(c.windspeed_10m)

    return {
      current_temp: Math.round(c.temperature_2m),
      feels_like: Math.round(c.apparent_temperature),
      condition,
      rain_chance: rainChance,
      wind_kmh: windKmh,
      temp_max: Math.round(d.temperature_2m_max?.[0] ?? c.temperature_2m),
      temp_min: Math.round(d.temperature_2m_min?.[0] ?? c.temperature_2m),
      summary: `${Math.round(c.temperature_2m)}°C, ${condition}, szansa deszczu ${rainChance}%, wiatr ${windKmh} km/h`
    }
  } catch {
    return null
  }
}
