import i18n from './i18n'
import type { BiomeId, CategoryId } from './types'

export const BIOME_BADGE: Record<BiomeId, string> = {
  meadows: 'border-emerald-700/50 bg-emerald-900/25 text-emerald-200',
  blackforest: 'border-teal-700/50 bg-teal-900/25 text-teal-200',
  swamp: 'border-lime-800/50 bg-lime-950/30 text-lime-200',
  mountain: 'border-sky-700/50 bg-sky-900/25 text-sky-200',
  plains: 'border-amber-600/50 bg-amber-900/20 text-amber-200',
  mistlands: 'border-violet-700/50 bg-violet-900/25 text-violet-200',
  ashlands: 'border-rose-800/50 bg-rose-950/30 text-rose-200',
  deepnorth: 'border-cyan-600/50 bg-cyan-900/20 text-cyan-100',
}

export const CATEGORY_ORDER: CategoryId[] = [
  'weapon',
  'armor',
  'food',
  'tool',
  'construction',
  'material',
  'other',
]

export const SUBCATEGORY_ORDER: Partial<Record<CategoryId, string[]>> = {
  weapon: ['melee', 'ranged', 'magic', 'bomb', 'harpoon', 'grapple'],
  armor: ['armor', 'shield', 'trinket'],
  food: ['food', 'drink'],
  tool: ['tool', 'utility'],
  other: ['bait', 'fireworks'],
}

const COUNT_KEYS: Record<string, string> = {
  recipe: 'recipe',
  item: 'item',
  station: 'station',
  extension: 'extension',
  result: 'result',
  'visible entry': 'visibleEntry',
  'visible recipe': 'visibleRecipe',
  material: 'material',
  offer: 'offer',
  node: 'node',
  patch: 'patch',
  craft: 'craft',
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatCategory(category: CategoryId): string {
  return i18n.t(`categories.${category}`, { defaultValue: category })
}

export function formatSubcategory(
  subcategory: string | null | undefined,
): string {
  if (!subcategory) return ''
  const key = subcategory.toLowerCase()
  return i18n.t(`subcategories.${key}`, {
    defaultValue: titleCase(subcategory),
  })
}

export function formatBiome(biome: BiomeId): string {
  return i18n.t(`biomes.${biome}`, { defaultValue: biome })
}

export function formatUnlock(unlock: string | null | undefined): string {
  const value = unlock?.trim()
  if (!value) return i18n.t('unlock.unknown')

  const hildir = /^Hildir(\d)$/i.exec(value)
  if (hildir) {
    const numeral = ['', 'I', 'II', 'III', 'IV'][Number(hildir[1])] ?? '?'
    return i18n.t('unlock.hildir', { numeral })
  }

  if (value.toLowerCase() === 'available immediately') {
    return i18n.t('unlock.available')
  }

  const defeat = /^Defeat (.+)$/i.exec(value)
  if (defeat) return i18n.t('unlock.defeat', { target: defeat[1] })

  return value
}

export function formatPrice(price: string | null | undefined): string {
  return price?.trim() || '—'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language).format(
    value,
  )
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  const key = COUNT_KEYS[singular]
  if (key) return i18n.t(`counts.${key}`, { count })
  return `${count} ${count === 1 ? singular : plural}`
}

export function titleCaseLabel(value: string): string {
  return titleCase(value)
}
