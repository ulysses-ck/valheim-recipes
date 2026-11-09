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
  setItemOverride: (id: string, patch: Record<string, unknown>) => void
  setRecipeOverride: (id: string, patch: Record<string, unknown>) => void
  setStationOverride: (id: string, patch: Record<string, unknown>) => void
  setTraderOverride: (id: string, patch: Record<string, unknown>) => void
  removeItemOverride: (id: string) => void
  removeRecipeOverride: (id: string) => void
  removeStationOverride: (id: string) => void
  removeTraderOverride: (id: string) => void
}

function removeKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj }
  delete next[key]
  return next
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      overrides: blankOverrides(),
      replace: (overrides) => set({ overrides }),
      reset: () => set({ overrides: blankOverrides() }),
      setItemOverride: (id, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            items: { ...state.overrides.items, [id]: patch },
          },
        })),
      setRecipeOverride: (id, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            recipes: { ...state.overrides.recipes, [id]: patch },
          },
        })),
      setStationOverride: (id, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            stations: { ...state.overrides.stations, [id]: patch },
          },
        })),
      setTraderOverride: (id, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            traders: { ...state.overrides.traders, [id]: patch },
          },
        })),
      removeItemOverride: (id) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            items: removeKey(state.overrides.items, id),
          },
        })),
      removeRecipeOverride: (id) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            recipes: removeKey(state.overrides.recipes, id),
          },
        })),
      removeStationOverride: (id) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            stations: removeKey(state.overrides.stations, id),
          },
        })),
      removeTraderOverride: (id) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            traders: removeKey(state.overrides.traders, id),
          },
        })),
    }),
    {
      name: 'valheim-recipes:overrides',
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ overrides: state.overrides }),
    },
  ),
)
