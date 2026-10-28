import { describe, expect, it } from 'vitest'
import type { DataOverrides, Dataset, Recipe } from './types'
import {
  applyOverrides,
  baseDataset as generatedDataset,
  createIndexes,
  entriesInBiome,
  isBiomeVisible,
  maxVisibleLevel,
  visibleEntries,
  visibleIngredients,
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
      {
        id: 'Wood',
        name: 'Wood',
        slug: 'wood',
        icon: '/icons/item/wood.webp',
        category: 'material',
        biome: 'meadows',
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
    ).toHaveLength(1)
    expect(
      visibleEntries(indexes.catalogEntries, 'swamp', indexes.biomeRank),
    ).toHaveLength(3)
  })

  it('keeps only the selected biome in entriesInBiome', () => {
    const indexes = createIndexes(base())
    expect(entriesInBiome(indexes.catalogEntries, 'meadows')).toHaveLength(1)
    expect(entriesInBiome(indexes.catalogEntries, 'swamp')).toHaveLength(2)
    expect(entriesInBiome(indexes.catalogEntries, 'all')).toHaveLength(3)
  })
})

describe('generated dataset gate', () => {
  it('keeps Meadows base crafts visible despite later upgrade materials', () => {
    const indexes = createIndexes(generatedDataset)
    for (const id of [
      'Club',
      'ArmorLeatherChest',
      'ArmorLeatherLegs',
      'HelmetLeather',
    ]) {
      expect(indexes.entriesById.get(id)?.biome).toBe('meadows')
    }
  })

  it('attaches weapon, armor, and food stats', () => {
    const indexes = createIndexes(generatedDataset)
    expect(indexes.itemsById.get('SwordBronze')?.stats?.damage?.slash).toBe(35)
    expect(indexes.itemsById.get('ArmorBronzeChest')?.stats?.armor).toBe(8)
    expect(indexes.itemsById.get('CookedMeat')?.stats?.health).toBe(30)
    expect(indexes.itemsById.get('CookedMeat')?.stats?.foodStamina).toBe(10)
  })

  it('includes fermented meads as consumables with wiki stats', () => {
    const indexes = createIndexes(generatedDataset)
    const mead = indexes.entriesById.get('MeadHealthMinor')
    expect(mead?.kind).toBe('food')
    expect(mead?.category).toBe('food')
    expect(mead?.subcategory).toBe('drink')
    expect(mead?.biome).toBe('blackforest')
    expect(mead?.recipe).toBeUndefined()
    expect(mead?.item?.stats?.regen).toBe(50)
    expect(mead?.item?.stats?.duration).toBe(10)
    expect(indexes.entriesById.get('BarleyWine')?.biome).toBe('plains')
  })

  it('caps upgrade levels and hides locked upgrade materials', () => {
    const indexes = createIndexes(generatedDataset)
    const clubRecipe = indexes.entriesById.get('Club')?.recipe
    expect(clubRecipe).toBeDefined()
    if (!clubRecipe) return

    expect(
      visibleIngredients(clubRecipe.ingredients, indexes, 'meadows').map(
        (ingredient) => ingredient.itemId,
      ),
    ).toEqual(['Wood'])
    expect(maxVisibleLevel(clubRecipe, indexes, 'meadows')).toBe(1)
    expect(maxVisibleLevel(clubRecipe, indexes, 'blackforest')).toBe(4)
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
