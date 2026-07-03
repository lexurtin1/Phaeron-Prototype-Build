import type { BrazilAccount } from '@/lib/market-movement/types'

export interface PositionedAccount {
  account: BrazilAccount
  lat: number
  lon: number
}

const FAN_START_ZOOM = 5
const FAN_END_ZOOM = 10
const BASE_OFFSET_PX = 26

function fanOutPixelOffset(zoom: number): number {
  if (zoom <= FAN_START_ZOOM) return BASE_OFFSET_PX
  if (zoom >= FAN_END_ZOOM) return 0
  const t = (zoom - FAN_START_ZOOM) / (FAN_END_ZOOM - FAN_START_ZOOM)
  return BASE_OFFSET_PX * (1 - t)
}

function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
}

function offsetLatLon(lat: number, lon: number, zoom: number, pixels: number, angleRad: number) {
  if (pixels === 0) return { lat, lon }
  const meters = pixels * metersPerPixel(lat, zoom)
  const dLat = (meters * Math.cos(angleRad)) / 111320
  const dLon = (meters * Math.sin(angleRad)) / (111320 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + dLat, lon: lon + dLon }
}

/** Groups accounts sharing (near-)identical coordinates and fans them out
 * radially, converging to true coordinates as zoom increases. */
export function layoutAccounts(accounts: BrazilAccount[], zoom: number): PositionedAccount[] {
  const groups = new Map<string, BrazilAccount[]>()
  for (const account of accounts) {
    const key = `${account.lat.toFixed(2)},${account.lon.toFixed(2)}`
    const group = groups.get(key)
    if (group) group.push(account)
    else groups.set(key, [account])
  }

  const offsetPx = fanOutPixelOffset(zoom)
  const positioned: PositionedAccount[] = []
  for (const group of groups.values()) {
    group.forEach((account, i) => {
      const angle = (2 * Math.PI * i) / group.length
      const { lat, lon } = offsetLatLon(account.lat, account.lon, zoom, group.length > 1 ? offsetPx : 0, angle)
      positioned.push({ account, lat, lon })
    })
  }
  return positioned
}
