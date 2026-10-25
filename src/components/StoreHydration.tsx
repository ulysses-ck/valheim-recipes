import { useEffect } from 'react'
import { useAdminStore } from '../stores/admin'
import { useBiomeStore } from '../stores/biome'

export function StoreHydration() {
  useEffect(() => {
    void useBiomeStore.persist.rehydrate()
    void useAdminStore.persist.rehydrate()
  }, [])

  return null
}
