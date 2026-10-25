import { describe, expect, it } from 'vitest'

const load = (specifier: string) =>
  import(/* @vite-ignore */ new URL(specifier, import.meta.url).href)

const { biomeFromTraderUnlock, biomeOfMaterial, maxBiome } = await load(
  '../../scripts/lib/biomes.mjs',
)

describe('maxBiome', () => {
  it('returns the highest ranked biome', () => {
    expect(maxBiome(['meadows', 'swamp'])).toBe('swamp')
    expect(maxBiome(['blackforest', 'plains', 'mistlands'])).toBe('mistlands')
  })

  it('falls back to meadows when nothing is known', () => {
    expect(maxBiome([])).toBe('meadows')
    expect(maxBiome([null, undefined])).toBe('meadows')
  })

  it('derives a recipe biome from its ingredients', () => {
    const maceIngredientBiomes = ['Iron', 'RoundLog', 'LeatherScraps'].map(
      biomeOfMaterial,
    )
    expect(maxBiome(maceIngredientBiomes)).toBe('swamp')
  })
})

describe('material biome map', () => {
  it('covers representative materials', () => {
    expect(biomeOfMaterial('Wood')).toBe('meadows')
    expect(biomeOfMaterial('Iron')).toBe('swamp')
    expect(biomeOfMaterial('BlackMetal')).toBe('plains')
    expect(biomeOfMaterial('Eitr')).toBe('mistlands')
    expect(biomeOfMaterial('Flametal')).toBe('ashlands')
    expect(biomeOfMaterial('NotARealMaterial')).toBeNull()
  })
})

describe('biomeFromTraderUnlock', () => {
  it('maps defeat keys to biomes', () => {
    expect(
      biomeFromTraderUnlock('Defeat Moder', '/global-key/defeated-dragon'),
    ).toEqual({
      biome: 'mountain',
      key: 'defeated-dragon',
      known: true,
    })
  })

  it('treats immediately available stock as meadows', () => {
    expect(biomeFromTraderUnlock('Available immediately', '')).toEqual({
      biome: 'meadows',
      key: null,
      known: true,
    })
  })

  it('defaults unknown unlocks to meadows without claiming they are known', () => {
    expect(biomeFromTraderUnlock('Hildir1', '')).toEqual({
      biome: 'meadows',
      key: null,
      known: false,
    })
  })
})
