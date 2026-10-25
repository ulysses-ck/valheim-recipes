import { describe, expect, it } from 'vitest'
import type { Dataset, Recipe } from './types'
import {
  aggregateRaw,
  buildCostTree,
  computeTotal,
  requiredStationLevel,
  upgradeDelta,
} from './calculator'
import { createIndexes } from './dataset'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'Recipe_Iron',
    itemId: 'Iron',
    name: 'Iron',
    slug: 'iron',
    icon: '/icons/item/iron.webp',
    category: 'material',
    biome: 'swamp',
    stationId: 'forge',
    stationName: 'Forge',
    stationLevel: 1,
    amount: 1,
    upgradeOnly: false,
    canUpgrade: true,
    maxLevel: 4,
    ingredients: [{ itemId: 'Ore', name: 'Ore', amount: 2, amountPerLevel: 1 }],
    ...overrides,
  }
}

function makeDataset(recipes: Recipe[]): Dataset {
  return {
    recipes,
    items: recipes.map((recipe) => ({
      id: recipe.itemId,
      name: recipe.name,
      slug: recipe.slug,
      icon: recipe.icon,
      category: recipe.category,
      biome: recipe.biome,
      kind: 'craftable',
    })),
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
        recipes: recipes.length,
        items: recipes.length,
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

describe('computeTotal', () => {
  it('counts the base craft plus every upgrade delta', () => {
    const total = computeTotal(makeRecipe(), {
      current: 0,
      target: 4,
      quantity: 1,
    })

    expect(total.baseCrafts).toBe(1)
    expect(total.steps.map((step) => step.label)).toEqual([
      'Base craft',
      'Upgrade to 2',
      'Upgrade to 3',
      'Upgrade to 4',
    ])
    expect(total.immediate).toEqual([
      { itemId: 'Ore', name: 'Ore', amount: 5, amountPerLevel: 1 },
    ])
  })

  it('starts above level 1 with only the remaining upgrades', () => {
    const total = computeTotal(makeRecipe(), {
      current: 2,
      target: 4,
      quantity: 2,
    })

    expect(total.baseCrafts).toBe(0)
    expect(total.steps).toHaveLength(2)
    expect(total.immediate[0]?.amount).toBe(4)
  })

  it('clamps upgrade-only recipes to level 1 and skips the base', () => {
    const total = computeTotal(makeRecipe({ upgradeOnly: true }), {
      current: 0,
      target: 4,
      quantity: 1,
    })

    expect(total.current).toBe(1)
    expect(total.baseCrafts).toBe(0)
    expect(total.steps).toHaveLength(3)
    expect(total.immediate[0]?.amount).toBe(3)
  })

  it('never reports a current quality below the upgrade-only minimum', () => {
    const total = computeTotal(
      makeRecipe({ upgradeOnly: true, canUpgrade: false, maxLevel: 1 }),
      { current: 0, target: 4, quantity: 1 },
    )

    expect(total.current).toBe(1)
    expect(total.target).toBe(1)
    expect(total.steps).toHaveLength(0)
  })

  it('rounds base crafts up to full batches', () => {
    const total = computeTotal(
      makeRecipe({
        amount: 2,
        canUpgrade: false,
        maxLevel: 1,
        ingredients: [
          { itemId: 'Ore', name: 'Ore', amount: 3, amountPerLevel: 0 },
        ],
      }),
      { current: 0, target: 1, quantity: 3 },
    )

    expect(total.baseCrafts).toBe(2)
    expect(total.immediate[0]?.amount).toBe(6)
  })
})

describe('upgrade helpers', () => {
  it('raises the required station level with the target quality', () => {
    const recipe = makeRecipe({ stationLevel: 2 })
    expect(requiredStationLevel(recipe, 1)).toBe(2)
    expect(requiredStationLevel(recipe, 4)).toBe(4)
  })

  it('multiplies the per-level delta by levels and quantity', () => {
    expect(upgradeDelta(makeRecipe(), 2, 4, 2)).toEqual([
      { itemId: 'Ore', name: 'Ore', amount: 4, amountPerLevel: 1 },
    ])
  })
})

describe('buildCostTree', () => {
  it('batches intermediate crafts and rolls leaves into raw materials', () => {
    const arrow = makeRecipe({
      id: 'Recipe_Arrow',
      itemId: 'Arrow',
      name: 'Arrow',
      slug: 'arrow',
      category: 'weapon',
      biome: 'meadows',
      stationId: 'hand',
      stationName: 'Hand',
      amount: 20,
      canUpgrade: false,
      maxLevel: 1,
      ingredients: [
        { itemId: 'Wood', name: 'Wood', amount: 2, amountPerLevel: 0 },
        { itemId: 'Feather', name: 'Feather', amount: 1, amountPerLevel: 0 },
      ],
    })
    const indexes = createIndexes(makeDataset([arrow]))
    const tree = buildCostTree(
      [{ itemId: 'Arrow', name: 'Arrow', amount: 21, amountPerLevel: 0 }],
      indexes,
      { recursive: true },
    )

    expect(tree[0]?.crafts).toBe(2)
    expect(tree[0]?.children).toHaveLength(2)
    expect(aggregateRaw(tree)).toEqual([
      { itemId: 'Feather', name: 'Feather', amount: 2, amountPerLevel: 0 },
      { itemId: 'Wood', name: 'Wood', amount: 4, amountPerLevel: 0 },
    ])
  })

  it('does not recurse forever on a cycle', () => {
    const a = makeRecipe({
      id: 'Recipe_A',
      itemId: 'A',
      name: 'A',
      slug: 'a',
      ingredients: [{ itemId: 'B', name: 'B', amount: 1, amountPerLevel: 0 }],
      canUpgrade: false,
      maxLevel: 1,
    })
    const b = makeRecipe({
      id: 'Recipe_B',
      itemId: 'B',
      name: 'B',
      slug: 'b',
      ingredients: [{ itemId: 'A', name: 'A', amount: 1, amountPerLevel: 0 }],
      canUpgrade: false,
      maxLevel: 1,
    })
    const indexes = createIndexes(makeDataset([a, b]))
    const tree = buildCostTree(
      [{ itemId: 'A', name: 'A', amount: 1, amountPerLevel: 0 }],
      indexes,
      { recursive: true },
    )

    expect(tree[0]?.children?.[0]?.children?.[0]?.itemId).toBe('A')
    expect(tree[0]?.children?.[0]?.children?.[0]?.children).toBeUndefined()
  })
})
