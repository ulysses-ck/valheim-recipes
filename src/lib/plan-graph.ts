import type { Edge, Node } from '@xyflow/react'
import type { BiomeId } from './types'
import type { CostNode, PlanTotal } from './calculator'
import type { Indexes } from './dataset'
import { itemIconFor } from './dataset'

export interface PlanGraphNodeData extends Record<string, unknown> {
  kind: 'entry' | 'item'
  itemId: string
  label: string
  icon: string
  biome: BiomeId
  quantity?: number
  current?: number
  target?: number
  stationName?: string
  amount?: number
  crafts?: number
  isRaw?: boolean
  expandable: boolean
  expanded: boolean
  onRemove?: (itemId: string) => void
}

export type PlanGraphNode = Node<PlanGraphNodeData, 'planNode'>

export interface PlanGraph {
  nodes: PlanGraphNode[]
  edges: Edge[]
}

function edge(
  source: string,
  target: string,
  amount: number,
  id = `${source}->${target}`,
): Edge {
  return {
    id,
    source,
    target,
    label: `×${amount}`,
    type: 'smoothstep',
    style: { stroke: '#3d5243', strokeWidth: 1.4 },
    labelStyle: { fill: '#a7b0a1', fontSize: 10 },
    labelBgStyle: { fill: '#111814', fillOpacity: 0.9 },
    labelBgPadding: [4, 2],
  }
}

export function buildPlanGraph(
  plan: PlanTotal,
  indexes: Indexes,
  expanded: Set<string>,
): PlanGraph {
  const nodes: PlanGraphNode[] = []
  const edges: Edge[] = []
  const nodeById = new Map<string, PlanGraphNode>()
  const depths = new Map<string, number>()
  const topByItemId = new Map<string, string>()

  function addNode(
    id: string,
    depth: number,
    data: PlanGraphNodeData,
  ): PlanGraphNode {
    const node: PlanGraphNode = {
      id,
      type: 'planNode',
      position: { x: depth * 280, y: 0 },
      data,
    }
    nodes.push(node)
    nodeById.set(id, node)
    depths.set(id, depth)
    return node
  }

  for (const row of plan.entries) {
    const catalog = indexes.entriesById.get(row.entry.itemId)
    addNode(`entry:${row.entry.itemId}`, 0, {
      kind: 'entry',
      itemId: row.entry.itemId,
      label: row.recipe.name,
      icon: itemIconFor(indexes, row.entry.itemId),
      biome: catalog?.biome ?? row.recipe.biome,
      quantity: row.entry.quantity,
      current: row.total.current,
      target: row.total.target,
      stationName: row.recipe.stationName,
      expandable: false,
      expanded: false,
    })
  }

  function addTree(
    tree: CostNode[],
    depth: number,
    pathPrefix: string,
    parentId?: string,
  ) {
    tree.forEach((node, index) => {
      const path = pathPrefix ? `${pathPrefix}.${index}` : String(index)
      const id = `item:${path}`
      const catalog = indexes.entriesById.get(node.itemId)
      const expandable = Boolean(node.children && node.children.length > 0)
      const isExpanded = expanded.has(id)

      addNode(id, depth, {
        kind: 'item',
        itemId: node.itemId,
        label: node.name,
        icon: itemIconFor(indexes, node.itemId),
        biome: catalog?.biome ?? node.recipe?.biome ?? 'meadows',
        amount: node.amount,
        crafts: node.crafts,
        isRaw: node.isRaw,
        expandable,
        expanded: isExpanded,
      })

      if (parentId) edges.push(edge(parentId, id, node.amount))
      if (depth === 1) topByItemId.set(node.itemId, id)
      if (isExpanded && node.children) {
        addTree(node.children, depth + 1, path, id)
      }
    })
  }

  addTree(plan.tree, 1, '')

  for (const row of plan.entries) {
    const entryId = `entry:${row.entry.itemId}`
    for (const line of row.total.immediate) {
      if (line.amount <= 0) continue
      const target = topByItemId.get(line.itemId)
      if (!target) continue
      edges.push(edge(entryId, target, line.amount))
    }
  }

  const levels = new Map<number, string[]>()
  for (const node of nodes) {
    const depth = depths.get(node.id) ?? 0
    const level = levels.get(depth) ?? []
    level.push(node.id)
    levels.set(depth, level)
  }

  for (const [depth, ids] of levels) {
    ids.forEach((id, index) => {
      const node = nodeById.get(id)
      if (!node) return
      node.position = {
        x: depth * 280,
        y: (index - (ids.length - 1) / 2) * 100,
      }
    })
  }

  return { nodes, edges }
}
