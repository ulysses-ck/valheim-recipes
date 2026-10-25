import { describe, expect, it } from 'vitest'

const load = (specifier: string) =>
  import(/* @vite-ignore */ new URL(specifier, import.meta.url).href)

const { classifyItem, classifyKind } = await load(
  '../../scripts/lib/categories.mjs',
)

describe('classifyItem', () => {
  it('classifies an iron mace as a melee weapon', () => {
    expect(
      classifyItem({
        id: 'MaceIron',
        name: 'Iron mace',
        category: ['Equipment'],
        subcategory: ['Weapon'],
      }),
    ).toEqual({ category: 'weapon', subcategory: 'melee' })
  })

  it('gives food precedence over equipment heuristics', () => {
    expect(
      classifyItem(
        {
          id: 'CarrotSoup',
          name: 'Carrot soup',
          category: ['Item drop'],
          subcategory: ['Food'],
        },
        { isFood: true },
      ),
    ).toEqual({ category: 'food', subcategory: 'food' })
  })

  it('classifies shields as armor', () => {
    expect(
      classifyItem({
        id: 'ShieldWood',
        name: 'Wood shield',
        category: ['Equipment'],
        subcategory: ['Weapon'],
      }),
    ).toEqual({ category: 'armor', subcategory: 'shield' })
  })

  it('keeps pickaxes as tools despite the axe token', () => {
    expect(
      classifyItem({
        id: 'PickaxeIron',
        name: 'Iron pickaxe',
        category: ['Equipment'],
        subcategory: ['Tool'],
      }),
    ).toEqual({ category: 'tool', subcategory: 'tool' })
  })

  it('classifies harpoons and fishing rods in their weapon subcategories', () => {
    expect(
      classifyItem({
        id: 'SpearChitin',
        name: 'Abyssal harpoon',
        category: ['Equipment'],
        subcategory: ['Tool'],
      }),
    ).toEqual({ category: 'weapon', subcategory: 'harpoon' })
    expect(
      classifyItem({
        id: 'FishingRod',
        name: 'Fishing rod',
        category: ['Equipment'],
        subcategory: ['Tool'],
      }),
    ).toEqual({ category: 'weapon', subcategory: 'grapple' })
  })

  it('classifies building pieces from their building category', () => {
    expect(
      classifyItem(
        { id: 'forge', name: 'Forge' },
        { buildingCategory: 'Crafting' },
      ),
    ).toEqual({ category: 'construction', subcategory: 'Crafting' })
  })
})

describe('classifyKind', () => {
  it('marks crafting stations as stations', () => {
    expect(classifyKind({ isStation: true, isBuilding: true })).toBe('station')
  })

  it('distinguishes craftable outputs from ingredient-only materials', () => {
    expect(classifyKind({ hasRecipe: true, isIngredient: true })).toBe(
      'craftable',
    )
    expect(classifyKind({ isIngredient: true })).toBe('material')
    expect(classifyKind({})).toBe('other')
  })
})
