import { useMemo } from 'react'
import { IconLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import { getTemperatureRgba } from '@/lib/market-movement/temperature'
import type { BrazilAccount, MarkerShape } from '@/lib/market-movement/types'
import { layoutAccounts, type PositionedAccount } from './marker-layout'
import { MARKER_ICON_MAPPING, MARKER_ICON_URIS } from './marker-icons'

const SHAPES: MarkerShape[] = ['circle', 'triangle', 'hexagon']
const MIN_SIZE = 20
const MAX_SIZE = 34
const INNER_RATIO = 0.6

function sizeForImportance(value: number, maxValue: number): number {
  if (maxValue <= 0) return MIN_SIZE
  const t = Math.min(1, value / maxValue)
  return MIN_SIZE + t * (MAX_SIZE - MIN_SIZE)
}

export interface UseAccountMarkerLayerOptions {
  accounts: BrazilAccount[]
  zoom: number
  hoveredAccountId: string | null
  selectedAccountId: string | null
  onHover: (info: { account: BrazilAccount; x: number; y: number } | null) => void
  onClick: (info: { account: BrazilAccount; x: number; y: number } | null) => void
}

export function useAccountMarkerLayer({
  accounts,
  zoom,
  hoveredAccountId,
  selectedAccountId,
  onHover,
  onClick,
}: UseAccountMarkerLayerOptions) {
  return useMemo(() => {
    const positioned = layoutAccounts(accounts, zoom)
    const maxValue = accounts.reduce((max, a) => Math.max(max, a.openOpportunityValue), 0)

    const handlePick = (
      info: PickingInfo<PositionedAccount>,
      handler: (v: { account: BrazilAccount; x: number; y: number } | null) => void,
    ) => {
      if (info.object) {
        handler({ account: info.object.account, x: info.x, y: info.y })
      } else {
        handler(null)
      }
    }

    return SHAPES.flatMap((shape): [import('@deck.gl/layers').IconLayer, import('@deck.gl/layers').IconLayer] => {
      const shapeData = positioned.filter((p) => p.account.primaryShape === shape)
      const iconUrl = MARKER_ICON_URIS[shape]

      const outer = new IconLayer<PositionedAccount>({
        id: `mm-marker-outer-${shape}`,
        data: shapeData,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: () => ({ url: iconUrl, ...MARKER_ICON_MAPPING }),
        sizeUnits: 'pixels',
        getSize: (d) => {
          const base = sizeForImportance(d.account.openOpportunityValue, maxValue)
          const isActive = d.account.id === hoveredAccountId || d.account.id === selectedAccountId
          return isActive ? base * 1.15 : base
        },
        getColor: (d) => {
          if (d.account.status === 'Disabled') return [176, 184, 191, 210]
          return getTemperatureRgba(d.account.temperatureScore)
        },
        updateTriggers: {
          getSize: [hoveredAccountId, selectedAccountId],
          getColor: [accounts],
        },
        onHover: (info) => handlePick(info, onHover),
        onClick: (info) => handlePick(info, onClick),
      })

      const inner = new IconLayer<PositionedAccount>({
        id: `mm-marker-inner-${shape}`,
        data: shapeData,
        pickable: false,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: () => ({ url: iconUrl, ...MARKER_ICON_MAPPING }),
        sizeUnits: 'pixels',
        getSize: (d) => {
          const base = sizeForImportance(d.account.openOpportunityValue, maxValue) * INNER_RATIO
          const isActive = d.account.id === hoveredAccountId || d.account.id === selectedAccountId
          return isActive ? base * 1.15 : base
        },
        getColor: [255, 255, 255, 255],
        updateTriggers: {
          getSize: [hoveredAccountId, selectedAccountId],
        },
      })

      return [outer, inner]
    })
  }, [accounts, zoom, hoveredAccountId, selectedAccountId, onHover, onClick])
}
