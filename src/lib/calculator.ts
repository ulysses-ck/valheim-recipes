import type { Indexes } from './dataset'
import type { Ingredient, Recipe } from './types'

export interface CostLine {
  itemId: string
  name: string
  amount: number
  amountPerLevel: number
}

export interface CostStep {
  key: string
  label: string
  level?: number
  stationLevel?: number
  lines: CostLine[]
}

export interface TotalCost {
  current: number
  target: number
  quantity: number
  baseCrafts: number
  steps: CostStep[]
  immediate: CostLine[]
}

export interface CostNode {
  itemId: string
  name: string
  amount: number
  isRaw: boolean
  crafts?: number
  recipe?: Recipe
  children?: CostNode[]
}

export interface CostOptions {
  current: number
  target: number
  quantity: number
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function maxLevelFor(recipe: Recipe): number {
  return Math.max(1, recipe.maxLevel || (recipe.canUpgrade ? 4 : 1))
}

export function requiredStationLevel(recipe: Recipe, level: number): number {
  return Math.max(recipe.stationLevel || 1, level)
}

export function ingredientCostAtLevel(
  ingredient: Ingredient,
  level: number,
  quantity = 1,
): number {
  const perItem =
    ingredient.amount + ingredient.amountPerLevel * Math.max(0, level - 1)
  return perItem * quantity
}

export function costAtLevel(
  recipe: Recipe,
  level: number,
  quantity = 1,
): CostLine[] {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    amount: ingredientCostAtLevel(ingredient, level, quantity),
  }))
}

export function upgradeDelta(
  recipe: Recipe,
  from: number,
  to: number,
  quantity = 1,
): CostLine[] {
  const steps = Math.max(0, to - from)
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    amount: ingredient.amountPerLevel * steps * quantity,
  }))
}

export function aggregate(lines: CostLine[]): CostLine[] {
  const totals = new Map<string, CostLine>()
  for (const line of lines) {
    const existing = totals.get(line.itemId)
    if (existing) {
      existing.amount += line.amount
    } else {
      totals.set(line.itemId, { ...line })
    }
  }
  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function computeTotal(recipe: Recipe, options: CostOptions): TotalCost {
  const maximum = maxLevelFor(recipe)
  const minimumCurrent = recipe.upgradeOnly ? 1 : 0
  const maxCurrent = Math.max(minimumCurrent, maximum - 1)
  const current = clamp(options.current, minimumCurrent, maxCurrent)
  const target = clamp(options.target, Math.max(1, current), maximum)
  const quantity = clamp(options.quantity, 1, 999)

  const baseCrafts =
    current === 0 && !recipe.upgradeOnly
      ? Math.ceil(quantity / Math.max(1, recipe.amount))
      : 0

  const steps: CostStep[] = []

  if (baseCrafts > 0) {
    steps.push({
      key: 'base',
      label: 'Base craft',
      stationLevel: requiredStationLevel(recipe, 1),
      lines: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        amount: ingredient.amount * baseCrafts,
      })),
    })
  }

  for (let level = Math.max(2, current + 1); level <= target; level += 1) {
    steps.push({
      key: `level-${level}`,
      label: `Upgrade to ${level}`,
      level,
      stationLevel: requiredStationLevel(recipe, level),
      lines: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        amount: ingredient.amountPerLevel * quantity,
      })),
    })
  }

  return {
    current,
    target,
    quantity,
    baseCrafts,
    steps,
    immediate: aggregate(steps.flatMap((step) => step.lines)),
  }
}

interface TreeOptions {
  recursive: boolean
  maxDepth?: number
}

export function buildCostTree(
  lines: CostLine[],
  indexes: Indexes,
  options: TreeOptions,
): CostNode[] {
  const maxDepth = options.maxDepth ?? 8

  function walk(
    currentLines: CostLine[],
    depth: number,
    visited: Set<string>,
  ): CostNode[] {
    return currentLines.map((line) => {
      const recipe = indexes.primaryRecipeByItemId.get(line.itemId)
      const expandable =
        options.recursive &&
        Boolean(recipe) &&
        !recipe?.upgradeOnly &&
        !visited.has(line.itemId) &&
        depth < maxDepth

      if (!recipe || !expandable) {
        return {
          itemId: line.itemId,
          name: line.name,
          amount: line.amount,
          isRaw: true,
          ...(recipe ? { recipe } : {}),
        }
      }

      const crafts = Math.ceil(
        Math.max(1, line.amount) / Math.max(1, recipe.amount),
      )
      const nextVisited = new Set(visited)
      nextVisited.add(line.itemId)
      const children = walk(
        recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: ingredient.amount * crafts,
        })),
        depth + 1,
        nextVisited,
      )

      return {
        itemId: line.itemId,
        name: line.name,
        amount: line.amount,
        isRaw: children.length === 0,
        crafts,
        recipe,
        children,
      }
    })
  }

  return walk(lines, 0, new Set())
}

export function aggregateRaw(nodes: CostNode[]): CostLine[] {
  const totals = new Map<string, CostLine>()

  function walk(node: CostNode) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) walk(child)
      return
    }
    const existing = totals.get(node.itemId)
    if (existing) {
      existing.amount += node.amount
    } else {
      totals.set(node.itemId, {
        itemId: node.itemId,
        name: node.name,
        amount: node.amount,
        amountPerLevel: 0,
      })
    }
  }

  for (const node of nodes) walk(node)
  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export interface PlanEntry {
  itemId: string
  current: number
  target: number
  quantity: number
}

export interface PlanEntryTotal {
  entry: PlanEntry
  recipe: Recipe
  total: TotalCost
  maximum: number
}

export interface PlanStation {
  stationId: string
  stationName: string
  level: number
}

export interface PlanTotal {
  entries: PlanEntryTotal[]
  immediate: CostLine[]
  tree: CostNode[]
  raw: CostLine[]
  stations: PlanStation[]
  quantity: number
}

export interface PlanOptions {
  recursive: boolean
  maxLevel?: (recipe: Recipe) => number
}

export function computePlan(
  entries: PlanEntry[],
  indexes: Indexes,
  options: PlanOptions,
): PlanTotal {
  const maxLevel = options.maxLevel ?? maxLevelFor
  const rows: PlanEntryTotal[] = []

  for (const entry of entries) {
    const recipe = indexes.primaryRecipeByItemId.get(entry.itemId)
    if (!recipe) continue

    const maximum = Math.max(
      1,
      Math.min(maxLevelFor(recipe), maxLevel(recipe)),
    )
    const minimum = recipe.upgradeOnly ? 1 : 0
    const current = clamp(
      entry.current,
      minimum,
      Math.max(minimum, maximum - 1),
    )
    const target = clamp(entry.target, Math.max(1, current), maximum)
    const quantity = clamp(entry.quantity, 1, 999)

    rows.push({
      entry: { ...entry, current, target, quantity },
      recipe,
      total: computeTotal(recipe, { current, target, quantity }),
      maximum,
    })
  }

  const immediate = aggregate(rows.flatMap((row) => row.total.immediate))
  const tree = buildCostTree(immediate, indexes, {
    recursive: options.recursive,
  })
  const raw = aggregateRaw(tree)

  const stations = new Map<string, PlanStation>()
  for (const row of rows) {
    const level = requiredStationLevel(row.recipe, row.total.target)
    const existing = stations.get(row.recipe.stationId)
    if (!existing || level > existing.level) {
      stations.set(row.recipe.stationId, {
        stationId: row.recipe.stationId,
        stationName: row.recipe.stationName,
        level,
      })
    }
  }

  return {
    entries: rows,
    immediate,
    tree,
    raw,
    stations: [...stations.values()].sort((a, b) =>
      a.stationName.localeCompare(b.stationName),
    ),
    quantity: rows.reduce((sum, row) => sum + row.entry.quantity, 0),
  }
}
