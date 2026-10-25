import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DataOverrides } from '../lib/types'

export function blankOverrides(): DataOverrides {
  return { recipes: {}, items: {}, stations: {}, traders: {} }
}

interface AdminState {
  overrides: DataOverrides
  replace: (overrides: DataOverrides) => void
  reset: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      overrides: blankOverrides(),
      replace: (overrides) => set({ overrides }),
      reset: () => set({ overrides: blankOverrides() }),
    }),
    {
      name: 'valheim-recipes:overrides',
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ overrides: state.overrides }),
    },
  ),
)
