import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'
import {
  formatBiome,
  formatCategory,
  formatSubcategory,
  formatUnlock,
  pluralize,
} from './format'

afterEach(async () => {
  await i18n.changeLanguage('es')
})

describe('i18n formatting', () => {
  it('translates biomes, categories, and subcategories', async () => {
    await i18n.changeLanguage('es')
    expect(formatBiome('blackforest')).toBe('Bosque Negro')
    expect(formatCategory('food')).toBe('Comida y bebidas')
    expect(formatSubcategory('melee')).toBe('Cuerpo a cuerpo')

    await i18n.changeLanguage('en')
    expect(formatBiome('blackforest')).toBe('Black Forest')
    expect(formatCategory('food')).toBe('Food & drinks')
    expect(formatSubcategory('melee')).toBe('Melee')
  })

  it('pluralizes through i18n resources', async () => {
    await i18n.changeLanguage('es')
    expect(pluralize(1, 'recipe')).toBe('1 receta')
    expect(pluralize(3, 'recipe')).toBe('3 recetas')

    await i18n.changeLanguage('en')
    expect(pluralize(1, 'recipe')).toBe('1 recipe')
    expect(pluralize(3, 'recipe')).toBe('3 recipes')
  })

  it('translates trader unlock conditions', async () => {
    await i18n.changeLanguage('es')
    expect(formatUnlock('Available immediately')).toBe('Disponible de inmediato')
    expect(formatUnlock('Defeat The Elder')).toBe('Derrota a The Elder')
    expect(formatUnlock('Hildir2')).toBe('Misión de Hildir II')
  })
})
