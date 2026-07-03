'use client'

import { useCallback, useState } from 'react'
import type { MapMode } from '@/lib/market-movement/types'

export interface UseMapModeResult {
  mode: MapMode
  focusedAccountId: string | null
  goToBrazil: () => void
  goToGlobal: () => void
  focusAccount: (accountId: string) => void
}

/**
 * Plain useState, no context — kept liftable into global app state later
 * without a refactor.
 */
export function useMapMode(initial: MapMode = 'global'): UseMapModeResult {
  const [mode, setMode] = useState<MapMode>(initial)
  const [focusedAccountId, setFocusedAccountId] = useState<string | null>(null)

  const goToBrazil = useCallback(() => {
    setMode('brazil')
  }, [])

  const goToGlobal = useCallback(() => {
    setMode('global')
    setFocusedAccountId(null)
  }, [])

  const focusAccount = useCallback((accountId: string) => {
    setMode('brazil')
    setFocusedAccountId(accountId)
  }, [])

  return { mode, focusedAccountId, goToBrazil, goToGlobal, focusAccount }
}
