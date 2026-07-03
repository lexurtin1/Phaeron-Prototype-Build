'use client'

import { useState } from 'react'
import { CATEGORY_META } from '@/lib/market-movement/global-alert-events'
import type {
  BrazilAccount,
  BrazilSignal,
  BrazilSignalSourceType,
  FeedScope,
  GlobalAlertEvent,
  GlobalRegion,
} from '@/lib/market-movement/types'
import { FeedRow } from './FeedRow'
import styles from './signal-feed-panel.module.css'

const REGIONS: Array<{ id: GlobalRegion | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'emea', label: 'EMEA' },
  { id: 'americas', label: 'Americas' },
  { id: 'asia', label: 'Asia' },
  { id: 'australia', label: 'Australia' },
]

const SOURCE_TYPES: Array<{ id: BrazilSignalSourceType; label: string }> = [
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'news', label: 'News' },
  { id: 'account', label: 'Account' },
  { id: 'document', label: 'Document' },
]

function sourceTypeLabel(t: BrazilSignalSourceType): string {
  const found = SOURCE_TYPES.find((s) => s.id === t)
  return found ? found.label : t
}
function sourceTypeIcon(t: BrazilSignalSourceType): string {
  switch (t) {
    case 'regulatory': return '⚖️'
    case 'competitor': return '🎯'
    case 'news': return '📰'
    case 'account': return '🏢'
    case 'document': return '📄'
    default: return '•'
  }
}
function agoLabel(days: number): string {
  if (days <= 1) return days <= 0 ? 'today' : '1 day ago'
  if (days < 7) return `${days} days ago`
  const w = Math.round(days / 7)
  return `${w} week${w === 1 ? '' : 's'} ago`
}
function timeAgoFromIso(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return agoLabel(Math.max(0, days))
}

export interface SignalFeedPanelProps {
  scope: FeedScope
  globalEvents?: GlobalAlertEvent[]
  brazilSignals?: BrazilSignal[]
  brazilAccounts?: BrazilAccount[]
  selectedId: string | null
  onSelect: (id: string) => void
  regionFilter?: GlobalRegion | 'all'
  onRegionChange?: (region: GlobalRegion | 'all') => void
  activeSourceTypes?: Set<BrazilSignalSourceType>
  onToggleSourceType?: (type: BrazilSignalSourceType) => void
  onSelectRelatedAccount?: (accountId: string) => void
}

/** One shared feed component for both scopes — only the filter row and
 * data source differ; row rendering/selection is a single code path. */
export function SignalFeedPanel({
  scope,
  globalEvents = [],
  brazilSignals = [],
  brazilAccounts = [],
  selectedId,
  onSelect,
  regionFilter = 'all',
  onRegionChange,
  activeSourceTypes,
  onToggleSourceType,
  onSelectRelatedAccount,
}: SignalFeedPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const accountById = new Map(brazilAccounts.map((a) => [a.id, a]))

  const sortedGlobal =
    scope === 'global'
      ? [...globalEvents].filter((e) => regionFilter === 'all' || e.region === regionFilter).sort((a, b) => a.days - b.days)
      : []

  const sortedBrazil =
    scope === 'brazil'
      ? [...brazilSignals]
          .filter((s) => !activeSourceTypes || activeSourceTypes.size === 0 || activeSourceTypes.has(s.sourceType))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : []

  const count = scope === 'global' ? sortedGlobal.length : sortedBrazil.length

  return (
    <aside className={`${styles.rail} ${collapsed ? styles.collapsed : ''}`}>
      <button type="button" className={styles.toggle} aria-label="Toggle live feed" onClick={() => setCollapsed((c) => !c)}>
        <span className={styles.chev}>{collapsed ? '‹' : '›'}</span>
        <span className={styles.pip} />
        <span className={styles.vlabel}>Live feed</span>
      </button>
      <div className={styles.head}>
        <div className={styles.title}>
          <span className={styles.live} />
          {scope === 'global' ? 'Live Alert Feed' : 'Brazil Signal Feed'}
        </div>
        <div className={styles.sub}>
          {count} active signal{count === 1 ? '' : 's'} · sorted by recency
        </div>
        {scope === 'global' && (
          <div className={styles.chipRow}>
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`${styles.chip} ${regionFilter === r.id ? styles.chipActive : ''}`}
                onClick={() => onRegionChange?.(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        {scope === 'brazil' && (
          <div className={styles.chipRow}>
            {SOURCE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.chip} ${!activeSourceTypes || activeSourceTypes.has(t.id) ? styles.chipActive : ''}`}
                onClick={() => onToggleSourceType?.(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.list}>
        {scope === 'global' &&
          sortedGlobal.map((e) => {
            const meta = CATEGORY_META[e.cat]
            return (
              <FeedRow
                key={e.eid}
                selected={selectedId === e.eid}
                dotColor={meta.color}
                pulsing={e.sev === 'high'}
                icon={e.flag}
                title={
                  <>
                    {e.cty} <span className={styles.dash}>–</span> <span className={styles.ctype}>{e.type}</span>
                  </>
                }
                timestampLabel={agoLabel(e.days)}
                bodyText={e.summary}
                badgeLabel={meta.label}
                badgeClassName={styles[`badge_${e.cat}`]}
                onClick={() => onSelect(e.eid)}
                expandableContent={
                  <div>
                    <div className={styles.expLoc}>📍 {e.city}</div>
                    <h6 className={styles.expHeading}>What&apos;s happening</h6>
                    <p className={styles.expText}>{e.details.what}</p>
                    <h6 className={styles.expHeading}>Why it matters</h6>
                    <p className={styles.expText}>{e.details.why}</p>
                    <h6 className={styles.expHeading}>Key facts</h6>
                    <ul className={styles.expFacts}>
                      {e.details.facts.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div className={styles.expSource}>
                      <div className={styles.expSourceLbl}>Source</div>
                      <a href={e.source.url} target="_blank" rel="noopener noreferrer">
                        {e.source.name} <span className={styles.expSourceExt}>↗</span>
                      </a>
                    </div>
                    {e.author && (
                      <div className={styles.expAuthor}>
                        <div className={styles.expAuthorAv}>{e.author.initials}</div>
                        <div className={styles.expAuthorInfo}>
                          <strong>{e.author.name}</strong>
                          {e.author.role} · Calastone
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            )
          })}
        {scope === 'brazil' &&
          sortedBrazil.map((s) => {
            const related = s.relatedAccountId ? accountById.get(s.relatedAccountId) : undefined
            return (
              <FeedRow
                key={s.id}
                selected={selectedId === s.id}
                dotColor="var(--teal-500)"
                pulsing={s.priority === 1}
                icon={sourceTypeIcon(s.sourceType)}
                title={<>{related ? related.name : sourceTypeLabel(s.sourceType)}</>}
                timestampLabel={timeAgoFromIso(s.timestamp)}
                bodyText={s.headline}
                badgeLabel={sourceTypeLabel(s.sourceType)}
                badgeClassName={styles.badge_signal}
                onClick={() => {
                  onSelect(s.id)
                  if (s.relatedAccountId) onSelectRelatedAccount?.(s.relatedAccountId)
                }}
                expandableContent={<p className={styles.expText}>{s.summary}</p>}
              />
            )
          })}
        {count === 0 && <div className={styles.empty}>No signals match current filters</div>}
      </div>
    </aside>
  )
}
