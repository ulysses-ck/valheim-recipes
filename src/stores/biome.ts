import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BiomeId } from '../lib/types'

export type BiomeSelection = BiomeId | 'all'

interface BiomeState {
  selected: BiomeSelection
  setBiome: (selection: BiomeSelection) => void
}

export const useBiomeStore = create<BiomeState>()(
  persist(
    (set) => ({
      selected: 'meadows',
      setBiome: (selected) => set({ selected }),
    }),
    {
      name: 'valheim-recipes:biome',
      version: 1,
      skipHydration: true,
    },
  ),
)
