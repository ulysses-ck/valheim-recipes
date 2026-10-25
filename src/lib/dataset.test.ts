import { describe, expect, it } from 'vitest'
import type { DataOverrides, Dataset, Recipe } from './types'
import {
  applyOverrides,
  createIndexes,
  isBiomeVisible,
  visibleEntries,
} from './dataset'

const recipe: Recipe = {
  id: 'Recipe_Iron',
  itemId: 'Iron',
  name: 'Iron',
  slug: 'iron',
  icon: '/icons/item/iron.webp',
  category: 'material',
  biome: 'swamp',
  stationId: 'forge',
  stationName: 'Forge',
  stationLevel: 2,
  amount: 1,
  upgradeOnly: false,
  canUpgrade: true,
  maxLevel: 4,
  ingredients: [{ itemId: 'Ore', name: 'Ore', amount: 2, amountPerLevel: 1 }],
}

function base(): Dataset {
  return {
    recipes: [recipe],
    items: [
      {
        id: 'Iron',
        name: 'Iron',
        slug: 'iron',
        icon: recipe.icon,
        category: 'material',
        biome: 'swamp',
        kind: 'craftable',
      },
      {
        id: 'Ore',
        name: 'Ore',
        slug: 'ore',
        icon: '/icons/item/ore.webp',
        category: 'material',
        biome: 'swamp',
        kind: 'material',
      },
    ],
    stations: [],
    traders: [],
    biomes: [
      { id: 'meadows', name: 'Meadows', rank: 0 },
      { id: 'blackforest', name: 'Black Forest', rank: 1 },
      { id: 'swamp', name: 'Swamp', rank: 2 },
    ],
    meta: {
      generatedAt: '2026-01-01T00:00:00.000Z',
      counts: {
        recipes: 1,
        items: 2,
        stations: 0,
        traders: 0,
        biomes: 3,
      },
      unmappedIngredients: [],
      unmatchedExtensions: [],
      unknownBiome: [],
    },
  }
}

describe('biome gate', () => {
  it('hides entries above the selected rank and shows lower ones', () => {
    const indexes = createIndexes(base())
    expect(isBiomeVisible('swamp', 'meadows', indexes.biomeRank)).toBe(false)
    expect(isBiomeVisible('meadows', 'swamp', indexes.biomeRank)).toBe(true)
    expect(isBiomeVisible('swamp', 'swamp', indexes.biomeRank)).toBe(true)
    expect(isBiomeVisible('swamp', 'all', indexes.biomeRank)).toBe(true)
  })

  it('filters the catalog through visibleEntries', () => {
    const indexes = createIndexes(base())
    expect(
      visibleEntries(indexes.catalogEntries, 'meadows', indexes.biomeRank),
    ).toHaveLength(0)
    expect(
      visibleEntries(indexes.catalogEntries, 'swamp', indexes.biomeRank),
    ).toHaveLength(2)
  })
})

describe('applyOverrides', () => {
  it('patches by id without mutating the base dataset', () => {
    const baseDataset = base()
    const overrides: DataOverrides = {
      recipes: { Recipe_Iron: { name: 'Patched iron' } },
      items: {},
      stations: {},
      traders: {},
    }

    const patched = applyOverrides(baseDataset, overrides)

    expect(patched.recipes[0]?.name).toBe('Patched iron')
    expect(patched.recipes[0]?.biome).toBe('swamp')
    expect(baseDataset.recipes[0]?.name).toBe('Iron')
  })
})
