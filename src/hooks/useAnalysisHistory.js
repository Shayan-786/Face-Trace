import { useSyncExternalStore } from 'react'
import { getAnalysisSnapshot } from '../services/analysis'
import { subscribeToStorage } from '../services/storage'

export function useAnalysisHistory() {
  const snapshot = useSyncExternalStore(
    subscribeToStorage,
    getAnalysisSnapshot,
    () => '[]',
  )
  return JSON.parse(snapshot)
}
