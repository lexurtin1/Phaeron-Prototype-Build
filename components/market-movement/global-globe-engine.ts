// Framework-agnostic port of the globe.gl/three.js/anime.js logic from
// pulse/tools/market-movement/index.html. Loaded via the same CDN scripts
// the static prototype already uses (not npm deps), so this stays provably
// equivalent to the existing view. GlobalGlobeView.tsx is the thin React
// wrapper around this engine.

import type * as THREEType from 'three'
import {
  ALERT_EVENTS,
  CATEGORY_META,
  COUNTRY_DETAILS,
} from '@/lib/market-movement/global-alert-events'
import type { GlobalAlertEvent, GlobalEventCategory, GlobalRegion } from '@/lib/market-movement/types'
import { WORLD_COUNTRIES_GEO_URLS, fetchFirstAvailable, type GeoFeatureCollection } from '@/lib/market-movement/geo-sources'

interface GeoFeature {
  type: 'Feature'
  properties: Record<string, string | number | null | undefined>
  geometry: { type: string; coordinates: unknown }
}

interface Pov {
  lat: number
  lng: number
  altitude: number
}

interface OrbitControlsLike {
  autoRotate: boolean
  autoRotateSpeed: number
  enableZoom: boolean
  minDistance: number
  maxDistance: number
}

interface ThreeSceneLike {
  children: Array<{ type: string }>
  remove: (obj: unknown) => void
  add: (obj: unknown) => void
}

interface GlobeGLInstance {
  (container: HTMLElement): GlobeGLInstance
  width(w: number): GlobeGLInstance
  height(h: number): GlobeGLInstance
  backgroundColor(c: string): GlobeGLInstance
  showGlobe(b: boolean): GlobeGLInstance
  showGraticules(b: boolean): GlobeGLInstance
  showAtmosphere(b: boolean): GlobeGLInstance
  atmosphereColor(c: string): GlobeGLInstance
  atmosphereAltitude(n: number): GlobeGLInstance
  globeMaterial(m: unknown): GlobeGLInstance
  polygonsData(d: GeoFeature[]): GlobeGLInstance
  polygonCapColor(fn: (d: GeoFeature) => string): GlobeGLInstance
  polygonSideColor(fn: () => string): GlobeGLInstance
  polygonStrokeColor(fn: () => string): GlobeGLInstance
  polygonAltitude(fn: (d: GeoFeature) => number): GlobeGLInstance
  polygonLabel(fn: (d: GeoFeature) => string): GlobeGLInstance
  onPolygonHover(fn: (d: GeoFeature | null) => void): GlobeGLInstance
  onPolygonClick(fn: (d: GeoFeature) => void): GlobeGLInstance
  htmlElementsData(d: GlobalAlertEvent[]): GlobeGLInstance
  htmlLat(k: string): GlobeGLInstance
  htmlLng(k: string): GlobeGLInstance
  htmlAltitude(n: number): GlobeGLInstance
  htmlElement(fn: (d: GlobalAlertEvent) => HTMLElement): GlobeGLInstance
  pointOfView(pov?: Pov, durationMs?: number): unknown
  controls(): OrbitControlsLike
  scene(): ThreeSceneLike
  renderer(): { forceContextLoss: () => void; dispose: () => void }
}

type GlobeGLFactory = () => GlobeGLInstance

interface AnimeParams {
  targets: unknown
  opacity?: number[]
  translateY?: number[]
  delay?: number | ((el: unknown, i: number) => number)
  duration?: number
  easing?: string
  round?: number
  v?: number
  update?: () => void
  complete?: () => void
}
interface AnimeStatic {
  (params: AnimeParams): unknown
  stagger(n: number): (el: unknown, i: number) => number
}

declare global {
  interface Window {
    THREE?: typeof THREEType
    Globe?: GlobeGLFactory
    anime?: AnimeStatic
  }
}

const SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
  'https://cdn.jsdelivr.net/npm/globe.gl@2.27.1/dist/globe.gl.min.js',
  'https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js',
]

let scriptsLoadedPromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.src = src
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(el)
  })
}

export function loadGlobeScripts(): Promise<void> {
  if (!scriptsLoadedPromise) {
    scriptsLoadedPromise = SCRIPTS.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve(),
    )
  }
  return scriptsLoadedPromise
}

export const WORLD_POV: Pov = { lat: 25, lng: 8, altitude: 2.1 }
export const REGION_POV: Record<GlobalRegion | 'all', Pov> = {
  all: WORLD_POV,
  emea: { lat: 30, lng: 20, altitude: 1.8 },
  americas: { lat: 10, lng: -80, altitude: 1.9 },
  asia: { lat: 20, lng: 105, altitude: 1.8 },
  australia: { lat: -28, lng: 135, altitude: 1.9 },
}
export const BRAZIL_POV: Pov = { lat: -14, lng: -51, altitude: 0.9 }

const catRank: Record<GlobalEventCategory, number> = { regulatory: 4, competitor: 3, market: 2, call: 1 }

function buildCountryTopCat(): Record<string, { cat: GlobalEventCategory; rank: number }> {
  const map: Record<string, { cat: GlobalEventCategory; rank: number }> = {}
  ALERT_EVENTS.forEach((e) => {
    const cur = map[e.iso]
    if (!cur || catRank[e.cat] > cur.rank) map[e.iso] = { cat: e.cat, rank: catRank[e.cat] }
  })
  return map
}
const countryTopCat = buildCountryTopCat()

function buildHoverCard(iso: string, name: string): string {
  const det = COUNTRY_DETAILS[iso]
  if (!det) return `<div class="mm-hover-card"><div class="mm-hc-cty">${name}</div><div class="mm-hc-empty">No active alerts</div></div>`
  const evs = ALERT_EVENTS.filter((e) => e.iso === iso).length
  return `<div class="mm-hover-card"><div class="mm-hc-cty">${det.flag} ${det.name}</div>
    <div class="mm-hc-meta">${det.corridors} corridors · ${det.monthlyOrders}/mo · ${evs} alert${evs > 1 ? 's' : ''}</div></div>`
}

export interface GlobeEngineCallbacks {
  getActiveCategories: () => Set<GlobalEventCategory>
  getRegionFilter: () => GlobalRegion | 'all'
  onSelectEvent: (eid: string) => void
  onCountryClick: (iso3: string) => void
}

export interface GlobeEngine {
  refreshFilters(): void
  flyTo(pov: Pov, durationMs: number): Promise<void>
  highlightCountry(iso: string, durationMs: number): void
  pingMarker(eid: string): void
  setAutoRotate(on: boolean): void
  destroy(): void
}

function matchesRegion(e: GlobalAlertEvent, region: GlobalRegion | 'all'): boolean {
  return region === 'all' || e.region === region
}

export async function createGlobeEngine(
  container: HTMLDivElement,
  callbacks: GlobeEngineCallbacks,
): Promise<GlobeEngine> {
  await loadGlobeScripts()
  const THREE = window.THREE
  const GlobeFactory = window.Globe
  if (!THREE || !GlobeFactory) throw new Error('Globe scripts failed to initialise')

  const geo = await fetchFirstAvailable<GeoFeatureCollection>(WORLD_COUNTRIES_GEO_URLS)
  const features = (geo.features as unknown as GeoFeature[]).filter(
    (f) => f.properties['ISO_A3'] !== 'ATA',
  )

  function visiblePoints(): GlobalAlertEvent[] {
    const activeCats = callbacks.getActiveCategories()
    const region = callbacks.getRegionFilter()
    return ALERT_EVENTS.filter((e) => activeCats.has(e.cat) && matchesRegion(e, region))
  }

  function activeAlt(d: GeoFeature): number {
    const iso = String(d.properties['ISO_A3'] ?? '')
    const activeCats = callbacks.getActiveCategories()
    const region = callbacks.getRegionFilter()
    const top = countryTopCat[iso]
    if (!top || !activeCats.has(top.cat)) return 0.006
    if (region !== 'all' && !ALERT_EVENTS.some((e) => e.iso === iso && e.region === region && activeCats.has(e.cat))) {
      return 0.006
    }
    return 0.014
  }

  function polygonCapColor(d: GeoFeature): string {
    const iso = String(d.properties['ISO_A3'] ?? '')
    if (highlightedIso === iso) return 'rgba(45, 153, 156, 0.55)'
    const activeCats = callbacks.getActiveCategories()
    const region = callbacks.getRegionFilter()
    const top = countryTopCat[iso]
    if (!top || !activeCats.has(top.cat)) return 'rgba(255,255,255,0.96)'
    if (region !== 'all' && !ALERT_EVENTS.some((e) => e.iso === iso && e.region === region && activeCats.has(e.cat))) {
      return 'rgba(255,255,255,0.96)'
    }
    return 'rgba(45, 153, 156, 0.32)'
  }

  let highlightedIso: string | null = null

  const globe = GlobeFactory()
    .width(container.clientWidth)
    .height(container.clientHeight)
    .backgroundColor('rgba(0,0,0,0)')
    .showGlobe(true)
    .showGraticules(false)
    .showAtmosphere(true)
    .atmosphereColor('#9fc6d4')
    .atmosphereAltitude(0.16)
    .globeMaterial(new THREE.MeshBasicMaterial({ color: 0xf4f8fa, transparent: true, opacity: 1 }))
    .polygonsData(features)
    .polygonCapColor(polygonCapColor)
    .polygonSideColor(() => 'rgba(108,123,131,0.10)')
    .polygonStrokeColor(() => 'rgba(108,123,131,0.42)')
    .polygonAltitude((d) => (highlightedIso === String(d.properties['ISO_A3'] ?? '') ? 0.045 : activeAlt(d)))
    .polygonLabel((d) => buildHoverCard(String(d.properties['ISO_A3'] ?? ''), String(d.properties['NAME'] ?? d.properties['ADMIN'] ?? '')))
    .onPolygonHover((hoverP) => {
      globe.polygonAltitude((d) => {
        if (hoverP && d === hoverP) return 0.03
        return highlightedIso === String(d.properties['ISO_A3'] ?? '') ? 0.045 : activeAlt(d)
      })
    })
    .onPolygonClick((d) => {
      const iso = String(d.properties['ISO_A3'] ?? '')
      if (iso === 'BRA') {
        highlightedIso = 'BRA'
        globe.polygonCapColor(polygonCapColor).polygonAltitude((dd) =>
          String(dd.properties['ISO_A3'] ?? '') === 'BRA' ? 0.045 : activeAlt(dd),
        )
        callbacks.onCountryClick('BRA')
        return
      }
      const activeCats = callbacks.getActiveCategories()
      const ev = ALERT_EVENTS.find((x) => x.iso === iso && activeCats.has(x.cat))
      if (ev) {
        callbacks.onSelectEvent(ev.eid)
        globe.pointOfView({ lat: ev.lat, lng: ev.lng, altitude: 1.6 }, 1200)
      }
    })
    .htmlElementsData(visiblePoints())
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(0.01)
    .htmlElement((e) => makeFlashMarker(e, callbacks.onSelectEvent))(container)

  const ctrl = globe.controls()
  ctrl.autoRotate = true
  ctrl.autoRotateSpeed = 0.34
  ctrl.enableZoom = true
  ctrl.minDistance = 180
  ctrl.maxDistance = 520
  globe.pointOfView(WORLD_POV, 0)

  const scene = globe.scene()
  scene.children.filter((c) => c.type.includes('Light')).forEach((l) => scene.remove(l))
  scene.add(new THREE.AmbientLight(0xffffff, 1.05))
  const dir = new THREE.DirectionalLight(0xffffff, 0.25)
  dir.position.set(1, 1, 1)
  scene.add(dir)

  let autoResumeTimer: ReturnType<typeof setTimeout> | undefined
  let wantAutoRotate = true

  const onPointerDown = () => {
    ctrl.autoRotate = false
    clearTimeout(autoResumeTimer)
  }
  const onPointerUp = () => {
    clearTimeout(autoResumeTimer)
    if (wantAutoRotate) autoResumeTimer = setTimeout(() => { ctrl.autoRotate = true }, 3000)
  }
  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointerup', onPointerUp)

  const onResize = () => globe.width(container.clientWidth).height(container.clientHeight)
  window.addEventListener('resize', onResize)

  return {
    refreshFilters() {
      globe.htmlElementsData(visiblePoints())
      globe.polygonCapColor(polygonCapColor).polygonAltitude(activeAlt)
    },
    flyTo(pov, durationMs) {
      globe.pointOfView(pov, durationMs)
      return new Promise((resolve) => setTimeout(resolve, durationMs))
    },
    highlightCountry(iso, durationMs) {
      highlightedIso = iso
      globe.polygonCapColor(polygonCapColor).polygonAltitude((d) =>
        String(d.properties['ISO_A3'] ?? '') === iso ? 0.045 : activeAlt(d),
      )
      setTimeout(() => {
        highlightedIso = null
      }, durationMs)
    },
    pingMarker(eid) {
      const marker = container.querySelector<HTMLElement>(`.mm-flash-marker[data-eid="${eid}"]`)
      if (marker) {
        marker.classList.remove('ping')
        void marker.offsetWidth
        marker.classList.add('ping')
      }
    },
    setAutoRotate(on) {
      wantAutoRotate = on
      ctrl.autoRotate = on
      clearTimeout(autoResumeTimer)
    },
    destroy() {
      window.removeEventListener('resize', onResize)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointerup', onPointerUp)
      clearTimeout(autoResumeTimer)
      // Explicitly free the WebGL context so a subsequent MapLibre/deck.gl
      // canvas isn't starved of a GPU context slot during the crossfade.
      try {
        const renderer = globe.renderer()
        renderer.forceContextLoss()
        renderer.dispose()
      } catch (err) {
        console.warn('[GlobalGlobeView] renderer cleanup failed', err)
      }
      container.innerHTML = ''
    },
  }
}

function makeFlashMarker(e: GlobalAlertEvent, onSelectEvent: (eid: string) => void): HTMLElement {
  const meta = CATEGORY_META[e.cat]
  const wrap = document.createElement('div')
  wrap.className = 'mm-flash-marker' + (e.sev === 'high' ? ' high' : '')
  wrap.dataset.eid = e.eid
  wrap.style.setProperty('--mc', meta.color)
  wrap.innerHTML = '<span class="mm-fm-ring"></span><span class="mm-fm-ring mm-fm-ring2"></span><span class="mm-fm-core"></span>'
  wrap.title = `${e.cty} – ${e.type}`
  wrap.addEventListener('click', (ev) => {
    ev.stopPropagation()
    onSelectEvent(e.eid)
  })
  return wrap
}

export function animateCount(el: HTMLElement, target: number): void {
  const anime = window.anime
  if (!anime) {
    el.textContent = String(target)
    return
  }
  const obj = { v: 0 }
  anime({
    targets: obj,
    v: target,
    duration: 1400,
    easing: 'easeOutExpo',
    round: 1,
    update: () => {
      el.textContent = String(Math.round(obj.v))
    },
  })
}
