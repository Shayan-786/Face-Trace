import { useSyncExternalStore } from 'react'
import { getUserSnapshot } from '../services/auth'
import { subscribeToStorage } from '../services/storage'

export function useCurrentUser() {
  const snapshot = useSyncExternalStore(subscribeToStorage, getUserSnapshot, () => 'null')
  return JSON.parse(snapshot)
}
