'use client'

import { useState, type ReactNode } from 'react'
import styles from './signal-feed-panel.module.css'

export interface FeedRowProps {
  selected: boolean
  dotColor: string
  pulsing?: boolean
  icon: string
  title: ReactNode
  timestampLabel: string
  bodyText: string
  badgeLabel: string
  badgeClassName?: string
  onClick: () => void
  expandableContent?: ReactNode
}

/** Shared row shape for both global alert events and Brazil signals — the
 * two feed scopes map their domain data into these normalized props. */
export function FeedRow({
  selected,
  dotColor,
  pulsing,
  icon,
  title,
  timestampLabel,
  bodyText,
  badgeLabel,
  badgeClassName,
  onClick,
  expandableContent,
}: FeedRowProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`${styles.row} ${selected ? styles.rowSelected : ''}`} onClick={onClick}>
      <span className={`${styles.rowDot} ${pulsing ? styles.rowDotHigh : ''}`} style={{ background: dotColor, color: dotColor }} />
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.flag}>{icon}</span>
          <span className={styles.rowTitle}>{title}</span>
          <span className={styles.ago}>{timestampLabel}</span>
        </div>
        <div className={styles.headline}>{bodyText}</div>
        <div className={styles.rowFoot}>
          <span className={`${styles.badge} ${badgeClassName ?? ''}`}>{badgeLabel}</span>
          {expandableContent && (
            <button
              type="button"
              className={`${styles.moreinfo} ${open ? styles.moreinfoOn : ''}`}
              onClick={(ev) => {
                ev.stopPropagation()
                setOpen((o) => !o)
              }}
            >
              Details <span className={styles.miChev}>▾</span>
            </button>
          )}
        </div>
        {expandableContent && (
          <div className={`${styles.expand} ${open ? styles.expandOpen : ''}`}>
            <div className={styles.expInner}>{expandableContent}</div>
          </div>
        )}
      </div>
    </div>
  )
}
