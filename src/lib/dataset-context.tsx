import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  applyOverrides,
  baseDataset,
  createIndexes,
  isBiomeVisible,
} from './dataset'
import type { Indexes } from './dataset'
import type { BiomeId, Dataset } from './types'
import { useAdminStore } from '../stores/admin'
import { useBiomeStore } from '../stores/biome'

interface DatasetContextValue {
  dataset: Dataset
  indexes: Indexes
}

const DatasetContext = createContext<DatasetContextValue | null>(null)

export function DatasetProvider({ children }: { children: ReactNode }) {
  const overrides = useAdminStore((state) => state.overrides)
  const value = useMemo(() => {
    const dataset = applyOverrides(baseDataset, overrides)
    return { dataset, indexes: createIndexes(dataset) }
  }, [overrides])

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  )
}

export function useDataset(): DatasetContextValue {
  const value = useContext(DatasetContext)
  if (!value) {
    throw new Error('useDataset must be used inside DatasetProvider')
  }
  return value
}

export function useBiomeVisibility() {
  const selection = useBiomeStore((state) => state.selected)
  const setBiome = useBiomeStore((state) => state.setBiome)
  const { dataset, indexes } = useDataset()

  return useMemo(() => {
    const rank =
      selection === 'all'
        ? Number.POSITIVE_INFINITY
        : (indexes.biomeRank.get(selection) ?? 0)
    const isVisible = (biome: BiomeId) =>
      selection === 'all' || isBiomeVisible(biome, selection, indexes.biomeRank)

    return {
      selection,
      setBiome,
      rank,
      isVisible,
      biomes: dataset.biomes,
    }
  }, [selection, setBiome, dataset.biomes, indexes.biomeRank])
}
