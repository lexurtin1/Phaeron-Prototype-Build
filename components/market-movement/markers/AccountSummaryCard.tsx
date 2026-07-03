'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { getTemperatureLabel } from '@/lib/market-movement/temperature'
import type { AccountStatus, BrazilAccount, MarkerShape } from '@/lib/market-movement/types'
import styles from './marker-overlays.module.css'

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

export interface AccountSummaryCardProps {
  account: BrazilAccount
  x: number
  y: number
  onDismiss: () => void
}

export function AccountSummaryCard({ account, x, y, onDismiss }: AccountSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    function handlePointerDown(e: PointerEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onDismiss])

  return (
    <div ref={cardRef} className={styles.card} style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardName}>{account.name}</div>
          <div className={styles.cardTypes}>{account.clientTypes.map((t) => (t === 'ThirdPartyAdministrator' ? 'TA' : t)).join(' · ')}</div>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status_${account.status}`]}`}>{STATUS_LABEL[account.status]}</span>
      </div>

      <div className={styles.cardRow}>
        <span className={styles.cardLabel}>Primary role</span>
        <span>{SHAPE_LABEL[account.primaryShape]}</span>
      </div>
      <div className={styles.cardRow}>
        <span className={styles.cardLabel}>Temperature</span>
        <span>{getTemperatureLabel(account.temperatureScore)}</span>
      </div>
      <div className={styles.cardRow}>
        <span className={styles.cardLabel}>Open opportunities</span>
        <span>
          {account.openOpportunityCount} · {currencyFormatter.format(account.openOpportunityValue)}
        </span>
      </div>
      {account.latestSignal && (
        <div className={styles.cardSignal}>
          <div className={styles.cardSignalLabel}>Latest signal</div>
          <div className={styles.cardSignalHeadline}>{account.latestSignal.headline}</div>
        </div>
      )}

      <Link href={`/market-movement/brazil/${account.id}`} className={styles.cardCta}>
        View full account
      </Link>
    </div>
  )
}
