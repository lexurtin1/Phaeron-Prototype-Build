'use client'

import { useEffect, useRef, useState } from 'react'
import { ALERT_EVENTS, CATEGORY_META } from '@/lib/market-movement/global-alert-events'
import type { GlobalEventCategory, GlobalRegion } from '@/lib/market-movement/types'
import {
  BRAZIL_POV,
  REGION_POV,
  WORLD_POV,
  animateCount,
  createGlobeEngine,
  type GlobeEngine,
} from './global-globe-engine'
import styles from './global-globe-view.module.css'
import './global-globe-markers.css'

const ALL_CATEGORIES: GlobalEventCategory[] = ['regulatory', 'competitor', 'market', 'call']

export interface GlobalGlobeViewHandle {
  flyToBrazil: () => Promise<void>
  flyToEvent: (lat: number, lng: number) => void
  pingMarker: (eid: string) => void
}

export interface GlobalGlobeViewProps {
  onCountryClick: (iso3: string) => void
  onSelectEvent: (eventId: string | null) => void
  regionFilter: GlobalRegion | 'all'
  activeCategories: Set<GlobalEventCategory>
  onToggleCategory: (cat: GlobalEventCategory) => void
  /** Called with an imperative handle once the engine is ready, and with
   * null on unmount. Used instead of forwardRef so this component stays
   * safe to load via next/dynamic. */
  onReady?: (handle: GlobalGlobeViewHandle | null) => void
}

export function GlobalGlobeView({
  onCountryClick,
  onSelectEvent,
  regionFilter,
  activeCategories,
  onToggleCategory,
  onReady,
}: GlobalGlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GlobeEngine | null>(null)
  const filtersRef = useRef({ activeCategories, regionFilter })
  const heroRefs = useRef<{ alerts: HTMLSpanElement | null; high: HTMLSpanElement | null }>({ alerts: null, high: null })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [wantAutoRotate, setWantAutoRotate] = useState(true)

  filtersRef.current = { activeCategories, regionFilter }

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    createGlobeEngine(container, {
      getActiveCategories: () => filtersRef.current.activeCategories,
      getRegionFilter: () => filtersRef.current.regionFilter,
      onSelectEvent,
      onCountryClick,
    })
      .then((engine) => {
        if (cancelled) {
          engine.destroy()
          return
        }
        engineRef.current = engine
        setStatus('ready')
        if (heroRefs.current.alerts) animateCount(heroRefs.current.alerts, ALERT_EVENTS.length)
        if (heroRefs.current.high) animateCount(heroRefs.current.high, ALERT_EVENTS.filter((e) => e.sev === 'high').length)

        onReady?.({
          flyToBrazil: async () => {
            engine.highlightCountry('BRA', 500)
            await new Promise((resolve) => setTimeout(resolve, 350))
            await engine.flyTo(BRAZIL_POV, 1200)
          },
          flyToEvent: (lat, lng) => {
            engine.flyTo({ lat, lng, altitude: 1.6 }, 1200)
          },
          pingMarker: (eid) => {
            engine.pingMarker(eid)
          },
        })
      })
      .catch((err) => {
        console.error('[GlobalGlobeView] failed to initialise', err)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      onReady?.(null)
      engineRef.current?.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.refreshFilters()
  }, [activeCategories, regionFilter])

  const isFirstRegionRender = useRef(true)
  useEffect(() => {
    if (isFirstRegionRender.current) {
      isFirstRegionRender.current = false
      return
    }
    engineRef.current?.flyTo(REGION_POV[regionFilter] ?? WORLD_POV, 1200)
  }, [regionFilter])

  const countries = new Set(ALERT_EVENTS.map((e) => e.iso)).size

  return (
    <div className={styles.stage}>
      <div ref={containerRef} className={styles.globeContainer} />
      {status === 'loading' && <div className={styles.loading}>Initialising network…</div>}
      {status === 'error' && (
        <div className={styles.error}>
          <div className={styles.errorBox}>
            <h3>Network map couldn&apos;t load</h3>
            <p>The country boundary data didn&apos;t reach your browser. This is usually a temporary connection issue.</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
              Retry loading map
            </button>
          </div>
        </div>
      )}

      <div className={styles.hero}>
        <div className={styles.heroBig}>
          <span ref={(el) => { heroRefs.current.alerts = el }}>0</span>
          <span className={styles.heroUnit}>alerts</span>
        </div>
        <div className={styles.heroLead}>
          live across <b>{countries}</b> markets — regulatory shifts, competitor moves and order-flow signals, <b>tracked in real time</b>.
        </div>
        <div className={styles.heroMini}>
          <div>
            <div className={styles.heroMiniValue}>{countries}</div>
            <div className={styles.heroMiniLabel}>Countries Monitored</div>
          </div>
          <div>
            <div className={`${styles.heroMiniValue} ${styles.heroMiniValueAlert}`}>
              <span ref={(el) => { heroRefs.current.high = el }}>0</span>
            </div>
            <div className={styles.heroMiniLabel}>High Priority</div>
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendTitle}>Order Intelligence</span>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const on = activeCategories.has(cat)
          return (
            <button
              key={cat}
              type="button"
              className={`${styles.legendItem} ${on ? styles.legendItemOn : ''}`}
              onClick={() => onToggleCategory(cat)}
            >
              <span className={styles.legendDot} style={{ background: meta.color }} />
              {meta.label.charAt(0) + meta.label.slice(1).toLowerCase()}
            </button>
          )
        })}
      </div>

      <div className={styles.pills}>
        <button
          type="button"
          className={`${styles.pill} ${wantAutoRotate ? styles.pillActive : ''}`}
          onClick={() => {
            setWantAutoRotate(true)
            engineRef.current?.setAutoRotate(true)
          }}
        >
          Auto-rotate
        </button>
        <button
          type="button"
          className={`${styles.pill} ${!wantAutoRotate ? styles.pillActive : ''}`}
          onClick={() => {
            setWantAutoRotate(false)
            engineRef.current?.setAutoRotate(false)
          }}
        >
          Pause spin
        </button>
        <button type="button" className={styles.pill} onClick={() => engineRef.current?.flyTo(WORLD_POV, 1000)}>
          Reset view
        </button>
      </div>
    </div>
  )
}
