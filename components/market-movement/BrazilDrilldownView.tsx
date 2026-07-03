'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import {
  BRAZIL_STATE_GEO_URLS,
  FALLBACK_MAPLIBRE_STYLE,
  MAPLIBRE_STYLE_URLS,
  WORLD_COUNTRIES_GEO_URLS,
  fetchFirstAvailable,
  isBrazilFeature,
  type GeoFeatureCollection,
} from '@/lib/market-movement/geo-sources'
import type { BrazilAccount, BrazilSignal } from '@/lib/market-movement/types'
import { useAccountMarkerLayer } from './markers/AccountMarkerLayer'
import { MarkerTooltip } from './markers/MarkerTooltip'
import { AccountSummaryCard } from './markers/AccountSummaryCard'
import { DocumentDropzone } from './upload/DocumentDropzone'
import styles from './brazil-drilldown-view.module.css'

const BRAZIL_CENTER: [number, number] = [-51, -14]
const BRAZIL_DEFAULT_ZOOM = 3.5

export interface BrazilDrilldownViewProps {
  accounts: BrazilAccount[]
  focusedAccountId: string | null
  onAccountSelect: (accountId: string | null) => void
  onSignalCreated: (signal: BrazilSignal) => void
}

export function BrazilDrilldownView({
  accounts,
  focusedAccountId,
  onAccountSelect,
  onSignalCreated,
}: BrazilDrilldownViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const justClickedMarkerRef = useRef(false)

  const [zoom, setZoom] = useState(BRAZIL_DEFAULT_ZOOM)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [hovered, setHovered] = useState<{ account: BrazilAccount; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ account: BrazilAccount; x: number; y: number } | null>(null)

  const handleHover = useCallback((info: { account: BrazilAccount; x: number; y: number } | null) => {
    setHovered(info)
  }, [])

  const handleClick = useCallback(
    (info: { account: BrazilAccount; x: number; y: number } | null) => {
      if (info) {
        justClickedMarkerRef.current = true
        setSelected(info)
        onAccountSelect(info.account.id)
      }
    },
    [onAccountSelect],
  )

  const layers = useAccountMarkerLayer({
    accounts,
    zoom,
    hoveredAccountId: hovered?.account.id ?? null,
    selectedAccountId: selected?.account.id ?? null,
    onHover: handleHover,
    onClick: handleClick,
  })

  // Map + deck.gl overlay setup — runs once per real mount. Guards against
  // React StrictMode's dev-only mount->cleanup->mount double-invoke, which
  // otherwise races two maplibregl.Map instances on the same container.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let activeMap: maplibregl.Map | null = null

    function tryStyle(styleIndex: number, mountEl: HTMLDivElement): void {
      if (cancelled) return
      const style = styleIndex < MAPLIBRE_STYLE_URLS.length ? MAPLIBRE_STYLE_URLS[styleIndex]! : FALLBACK_MAPLIBRE_STYLE
      const map = new maplibregl.Map({
        container: mountEl,
        style,
        center: BRAZIL_CENTER,
        zoom: BRAZIL_DEFAULT_ZOOM,
        pitch: 35,
      })
      activeMap = map
      mapRef.current = map

      let settled = false
      const finish = () => {
        if (cancelled || settled) return
        settled = true
        clearTimeout(loadTimeout)
        setLoadError(styleIndex >= MAPLIBRE_STYLE_URLS.length)
        void addBrazilBoundaries(map)

        const overlay = new MapboxOverlay({ interleaved: true, layers: [] })
        map.addControl(overlay as unknown as maplibregl.IControl)
        overlayRef.current = overlay
        setMapLoaded(true)
      }

      map.once('load', finish)
      // Fallback: some environments (constrained GPU/WebGL context churn
      // during the crossfade) can leave the style fully fetched without
      // MapLibre's 'load' event firing. Don't hang on "Loading…" forever.
      const loadTimeout = setTimeout(() => {
        if (cancelled || settled) return
        if (map.isStyleLoaded()) finish()
        else map.once('idle', finish)
      }, 8000)

      map.on('zoom', () => {
        if (!cancelled) setZoom(map.getZoom())
      })
      map.on('error', () => {
        if (cancelled || settled) return
        settled = true
        clearTimeout(loadTimeout)
        map.remove()
        tryStyle(styleIndex + 1, mountEl)
      })
      mountEl.addEventListener('click', () => {
        if (cancelled) return
        if (justClickedMarkerRef.current) {
          justClickedMarkerRef.current = false
          return
        }
        setSelected(null)
        onAccountSelect(null)
      })
    }

    tryStyle(0, container)

    return () => {
      cancelled = true
      activeMap?.remove()
      if (mapRef.current === activeMap) {
        mapRef.current = null
        overlayRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    overlayRef.current?.setProps({ layers })
  }, [layers, mapLoaded])

  useEffect(() => {
    if (!mapLoaded || !focusedAccountId || !mapRef.current) return
    const map = mapRef.current
    const account = accounts.find((a) => a.id === focusedAccountId)
    if (!account) return

    map.flyTo({ center: [account.lon, account.lat], zoom: 9, duration: 1200 })
    const handleMoveEnd = () => {
      const point = map.project([account.lon, account.lat])
      setSelected({ account, x: point.x, y: point.y })
      onAccountSelect(account.id)
    }
    map.once('moveend', handleMoveEnd)
    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [focusedAccountId, mapLoaded, accounts, onAccountSelect])

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      {!mapLoaded && <div className={styles.loading}>Loading Brazil map…</div>}
      {loadError && mapLoaded && <div className={styles.errorBanner}>Base map style unavailable — showing fallback cartography.</div>}
      {accounts.length === 0 && mapLoaded && <div className={styles.empty}>No accounts match current filters</div>}
      {hovered && !selected && <MarkerTooltip account={hovered.account} x={hovered.x} y={hovered.y} />}
      {selected && (
        <AccountSummaryCard
          account={selected.account}
          x={selected.x}
          y={selected.y}
          onDismiss={() => {
            setSelected(null)
            onAccountSelect(null)
          }}
        />
      )}
      <DocumentDropzone focusedAccountId={focusedAccountId} onSignalCreated={onSignalCreated} />
    </div>
  )
}

async function addBrazilBoundaries(map: maplibregl.Map): Promise<void> {
  try {
    const [worldGeo, brazilGeo] = await Promise.all([
      fetchFirstAvailable<GeoFeatureCollection>(WORLD_COUNTRIES_GEO_URLS),
      fetchFirstAvailable<GeoFeatureCollection>(BRAZIL_STATE_GEO_URLS),
    ])

    const southAmerica = {
      type: 'FeatureCollection' as const,
      features: worldGeo.features.filter((f) => f.properties['CONTINENT'] === 'South America' || f.properties['continent'] === 'South America'),
    }
    map.addSource('mm-south-america', { type: 'geojson', data: southAmerica as GeoJSON.FeatureCollection })
    map.addLayer({
      id: 'mm-south-america-fill',
      type: 'fill',
      source: 'mm-south-america',
      paint: { 'fill-color': '#eef2f6', 'fill-opacity': 0.6 },
    })
    map.addLayer({
      id: 'mm-south-america-line',
      type: 'line',
      source: 'mm-south-america',
      paint: { 'line-color': '#c3cdd5', 'line-width': 1 },
    })

    const brazilStates = {
      type: 'FeatureCollection' as const,
      features: brazilGeo.features.filter((f) => isBrazilFeature(f.properties)),
    }
    map.addSource('mm-brazil-states', { type: 'geojson', data: brazilStates as GeoJSON.FeatureCollection })
    map.addLayer({
      id: 'mm-brazil-states-fill',
      type: 'fill',
      source: 'mm-brazil-states',
      paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.4 },
    })
    map.addLayer({
      id: 'mm-brazil-states-line',
      type: 'line',
      source: 'mm-brazil-states',
      paint: { 'line-color': '#566571', 'line-width': 1.1 },
    })
  } catch (err) {
    console.warn('[BrazilDrilldownView] boundary data failed to load', err)
  }
}
