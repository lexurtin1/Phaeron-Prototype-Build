import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BRAZIL_ACCOUNTS } from '@/lib/market-movement/brazil-seed-data'
import { getTemperatureColor, getTemperatureLabel } from '@/lib/market-movement/temperature'
import type { AccountStatus, MarkerShape } from '@/lib/market-movement/types'
import styles from './account-detail.module.css'

const SHAPE_LABEL: Record<MarkerShape, string> = {
  hexagon: 'Fund Manager',
  triangle: 'Third-Party Administrator',
  circle: 'Distributor',
}

const STATUS_LABEL: Record<AccountStatus, string> = {
  Live: 'Live',
  InDiscussions: 'In Discussions',
  Prospect: 'Prospect',
  Disabled: 'Disabled',
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function generateStaticParams() {
  return BRAZIL_ACCOUNTS.map((a) => ({ accountId: a.id }))
}

export default async function BrazilAccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const account = BRAZIL_ACCOUNTS.find((a) => a.id === accountId)
  if (!account) notFound()

  return (
    <main className={styles.page}>
      <Link href="/market-movement" className={styles.backLink}>
        ← Back to Market Movement
      </Link>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.name}>{account.name}</h1>
          <p className={styles.subline}>
            {SHAPE_LABEL[account.primaryShape]} · {account.city}
          </p>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status_${account.status}`]}`}>{STATUS_LABEL[account.status]}</span>
      </div>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Temperature</div>
          <div className={styles.statValue} style={{ color: getTemperatureColor(account.temperatureScore) }}>
            {getTemperatureLabel(account.temperatureScore)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Open opportunities</div>
          <div className={styles.statValue}>{account.openOpportunityCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Open opportunity value</div>
          <div className={styles.statValue}>{currencyFormatter.format(account.openOpportunityValue)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Owner</div>
          <div className={styles.statValue}>{account.owner}</div>
        </div>
      </section>

      <section className={styles.detailBlock}>
        <h2 className={styles.blockHeading}>Client types</h2>
        <div className={styles.chipRow}>
          {account.clientTypes.map((t) => (
            <span key={t} className={styles.chip}>
              {t === 'ThirdPartyAdministrator' ? 'Third-Party Administrator' : t}
            </span>
          ))}
        </div>
      </section>

      {account.latestSignal && (
        <section className={styles.detailBlock}>
          <h2 className={styles.blockHeading}>Latest signal</h2>
          <div className={styles.signalCard}>
            <div className={styles.signalHeadline}>{account.latestSignal.headline}</div>
            <div className={styles.signalMeta}>
              {account.latestSignal.source} · {account.latestSignal.date}
            </div>
          </div>
        </section>
      )}

      <section className={styles.detailBlock}>
        <h2 className={styles.blockHeading}>Location</h2>
        <p className={styles.locationText}>
          {account.city} ({account.lat.toFixed(4)}, {account.lon.toFixed(4)})
        </p>
      </section>
    </main>
  )
}
