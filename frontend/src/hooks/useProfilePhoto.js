import { useSyncExternalStore } from 'react'
import { getProfilePhoto } from '../services/auth'
import { subscribeToStorage } from '../services/storage'

export function useProfilePhoto(userId) {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getProfilePhoto(userId),
    () => null,
  )
}
