import { getTemperatureLabel } from '@/lib/market-movement/temperature'
import type { BrazilAccount, MarkerShape } from '@/lib/market-movement/types'
import styles from './marker-overlays.module.css'

const SHAPE_LABEL: Record<MarkerShape, string> = {
  hexagon: 'Fund Manager',
  triangle: 'Third-Party Administrator',
  circle: 'Distributor',
}

export interface MarkerTooltipProps {
  account: BrazilAccount
  x: number
  y: number
}

export function MarkerTooltip({ account, x, y }: MarkerTooltipProps) {
  return (
    <div className={styles.tooltip} style={{ left: x, top: y }}>
      <div className={styles.tooltipName}>{account.name}</div>
      <div className={styles.tooltipMeta}>{SHAPE_LABEL[account.primaryShape]}</div>
      <div className={styles.tooltipTemp}>{getTemperatureLabel(account.temperatureScore)}</div>
    </div>
  )
}
