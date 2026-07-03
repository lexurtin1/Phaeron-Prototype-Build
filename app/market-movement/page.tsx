'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'
import { useMapMode } from '@/hooks/useMapMode'
import { BRAZIL_ACCOUNTS } from '@/lib/market-movement/brazil-seed-data'
import { ALERT_EVENTS } from '@/lib/market-movement/global-alert-events'
import type {
  BrazilAccount,
  BrazilSignal,
  BrazilSignalSourceType,
  GlobalEventCategory,
  GlobalRegion,
} from '@/lib/market-movement/types'
import type { GlobalGlobeViewHandle } from '@/components/market-movement/GlobalGlobeView'
import { SignalFeedPanel } from '@/components/market-movement/SignalFeedPanel'
import { BackToGlobalButton } from '@/components/market-movement/BackToGlobalButton'
import styles from './market-movement.module.css'

const GlobalGlobeView = dynamic(
  () => import('@/components/market-movement/GlobalGlobeView').then((m) => m.GlobalGlobeView),
  { ssr: false },
)
const BrazilDrilldownView = dynamic(
  () => import('@/components/market-movement/BrazilDrilldownView').then((m) => m.BrazilDrilldownView),
  { ssr: false },
)

const ALL_CATEGORIES: GlobalEventCategory[] = ['regulatory', 'competitor', 'market', 'call']
const ALL_SOURCE_TYPES: BrazilSignalSourceType[] = ['regulatory', 'competitor', 'news', 'account', 'document']

export default function MarketMovementPage() {
  const { mode, focusedAccountId, goToBrazil, goToGlobal, focusAccount } = useMapMode('global')
  const globeHandleRef = useRef<GlobalGlobeViewHandle | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [accounts, setAccounts] = useState<BrazilAccount[]>(BRAZIL_ACCOUNTS)
  const [signals, setSignals] = useState<BrazilSignal[]>([])

  const [activeCategories, setActiveCategories] = useState<Set<GlobalEventCategory>>(new Set(ALL_CATEGORIES))
  const [regionFilter, setRegionFilter] = useState<GlobalRegion | 'all'>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const [activeSourceTypes, setActiveSourceTypes] = useState<Set<BrazilSignalSourceType>>(new Set(ALL_SOURCE_TYPES))
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null)

  const handleCountryClick = useCallback(
    async (iso3: string) => {
      if (iso3 !== 'BRA' || isTransitioning) return
      setIsTransitioning(true)
      if (globeHandleRef.current) {
        await globeHandleRef.current.flyToBrazil()
      }
      goToBrazil()
      setIsTransitioning(false)
    },
    [goToBrazil, isTransitioning],
  )

  const handleToggleCategory = useCallback((cat: GlobalEventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const handleToggleSourceType = useCallback((t: BrazilSignalSourceType) => {
    setActiveSourceTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }, [])

  const handleSelectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId)
    if (eventId) {
      const ev = ALERT_EVENTS.find((e) => e.eid === eventId)
      if (ev) {
        globeHandleRef.current?.flyToEvent(ev.lat, ev.lng)
        globeHandleRef.current?.pingMarker(ev.eid)
      }
    }
  }, [])

  const handleSignalCreated = useCallback((signal: BrazilSignal) => {
    setSignals((prev) => [signal, ...prev])
    if (signal.relatedAccountId) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === signal.relatedAccountId
            ? {
                ...a,
                temperatureScore: Math.min(100, a.temperatureScore + 8),
                latestSignal: { headline: signal.headline, date: signal.timestamp.slice(0, 10), source: 'Document' },
              }
            : a,
        ),
      )
    }
  }, [])

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.homeLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          Pulse Home
        </Link>
        <span className={styles.headerTitle}>Market Movement</span>
      </header>

      <div className={styles.body}>
        <div className={styles.stageArea}>
          <AnimatePresence mode="wait">
            {mode === 'global' ? (
              <motion.div
                key="global"
                className={styles.viewLayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32 }}
              >
                <GlobalGlobeView
                  onCountryClick={handleCountryClick}
                  onSelectEvent={handleSelectEvent}
                  regionFilter={regionFilter}
                  activeCategories={activeCategories}
                  onToggleCategory={handleToggleCategory}
                  onReady={(handle) => {
                    globeHandleRef.current = handle
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="brazil"
                className={styles.viewLayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32 }}
              >
                <BackToGlobalButton onClick={goToGlobal} />
                <BrazilDrilldownView
                  accounts={accounts}
                  focusedAccountId={focusedAccountId}
                  onAccountSelect={() => {}}
                  onSignalCreated={handleSignalCreated}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={styles.feedArea}
        >
          {mode === 'global' ? (
            <SignalFeedPanel
              scope="global"
              globalEvents={ALERT_EVENTS.filter((e) => activeCategories.has(e.cat))}
              selectedId={selectedEventId}
              onSelect={handleSelectEvent}
              regionFilter={regionFilter}
              onRegionChange={setRegionFilter}
            />
          ) : (
            <SignalFeedPanel
              scope="brazil"
              brazilSignals={signals}
              brazilAccounts={accounts}
              selectedId={selectedSignalId}
              onSelect={setSelectedSignalId}
              activeSourceTypes={activeSourceTypes}
              onToggleSourceType={handleToggleSourceType}
              onSelectRelatedAccount={focusAccount}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
