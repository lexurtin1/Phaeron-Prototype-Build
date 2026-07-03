// Shared GeoJSON sourcing — mirrors the fallback-array pattern already used
// by the static globe prototype's GEO_URLS, but as a typed, reusable helper.

export const WORLD_COUNTRIES_GEO_URLS: string[] = [
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson',
]

export const BRAZIL_STATE_GEO_URLS: string[] = [
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson',
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces.geojson',
  'https://raw.githubusercontent.com/giuliano-macedo/geodata-br-states/main/geojson/br_states.json',
]

export const MAPLIBRE_STYLE_URLS: string[] = [
  'https://tiles.openfreemap.org/styles/positron',
  'https://tiles.openfreemap.org/styles/liberty',
]

/** Minimal, always-available style so the map is never fully blank. */
export const FALLBACK_MAPLIBRE_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'fallback-bg',
      type: 'background' as const,
      paint: { 'background-color': '#eef2f6' },
    },
  ],
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: Record<string, unknown>
    geometry: { type: string; coordinates: unknown }
  }>
}

/** Tries each URL in order, returning the first successfully parsed JSON payload. */
export async function fetchFirstAvailable<T = GeoFeatureCollection>(urls: string[]): Promise<T> {
  let lastError: unknown
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastError = err
      console.warn('[geo-sources] source failed:', url, err)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All GeoJSON sources failed')
}

/** Natural Earth admin-1 properties use `admin`/`iso_a2`; the Brazil-only fallback uses `Estado`/`SIGLA`. Normalize both. */
export function normalizeBrazilStateName(properties: Record<string, unknown>): string {
  const admin1Name = properties['name']
  if (typeof admin1Name === 'string' && admin1Name.length > 0) return admin1Name
  const brStateName = properties['Estado']
  if (typeof brStateName === 'string' && brStateName.length > 0) return brStateName
  return 'Unknown'
}

export function isBrazilFeature(properties: Record<string, unknown>): boolean {
  return (
    properties['admin'] === 'Brazil' ||
    properties['iso_a2'] === 'BR' ||
    properties['SIGLA'] !== undefined // geodata-br-states is Brazil-only already
  )
}
