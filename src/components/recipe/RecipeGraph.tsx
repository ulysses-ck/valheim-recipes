import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { BiomeId } from '../../lib/types'
import type { Indexes } from '../../lib/dataset'
import { ingredientBiome } from '../../lib/dataset'
import { useBiomeVisibility } from '../../lib/dataset-context'
import { formatBiome } from '../../lib/format'
import { ItemIcon } from '../ui/ItemIcon'

export interface ItemNodeData extends Record<string, unknown> {
  itemId: string
  label: string
  icon: string
  biome: BiomeId
  expandable: boolean
  expanded: boolean
}

type ItemFlowNode = Node<ItemNodeData, 'item'>

function ItemNode({ data }: NodeProps<ItemFlowNode>) {
  return (
    <div
      className={`w-[210px] rounded-lg border px-2.5 py-2 ${
        data.expanded
          ? 'border-[rgba(217,164,65,0.55)] bg-[var(--surface-2)]'
          : 'border-[var(--border-strong)] bg-[var(--surface)]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 6, height: 6, background: '#d9a441' }}
      />
      <div className="flex items-center gap-2">
        <ItemIcon icon={data.icon} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text)]">
            {data.label}
          </p>
          <p className="text-[0.6rem] text-[var(--faint)]">
            {formatBiome(data.biome)}
          </p>
        </div>
        {data.expandable ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border-strong)] text-[0.7rem] text-[var(--gold-soft)]">
            {data.expanded ? '−' : '+'}
          </span>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 6, height: 6, background: '#8fbf62' }}
      />
    </div>
  )
}

const nodeTypes = { item: ItemNode }

function buildGraph(
  rootId: string,
  expanded: Set<string>,
  indexes: Indexes,
  isVisible: (biome: BiomeId) => boolean,
): { nodes: ItemFlowNode[]; edges: Edge[] } {
  const levels = new Map<number, string[]>()
  const seen = new Set<string>([rootId])
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }]
  const edges: Edge[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const entry = indexes.entriesById.get(current.id)
    if (!entry) continue

    const level = levels.get(current.depth) ?? []
    if (!level.includes(current.id)) level.push(current.id)
    levels.set(current.depth, level)

    if (!expanded.has(current.id)) continue
    const recipe = entry.recipe
    if (!recipe) continue

    for (const ingredient of recipe.ingredients) {
      if (!isVisible(ingredientBiome(indexes, ingredient.itemId))) continue
      edges.push({
        id: `${current.id}->${ingredient.itemId}`,
        source: current.id,
        target: ingredient.itemId,
        label: `×${ingredient.amount}`,
        type: 'smoothstep',
        style: { stroke: '#3d5243', strokeWidth: 1.4 },
        labelStyle: { fill: '#a7b0a1', fontSize: 10 },
        labelBgStyle: { fill: '#111814', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
      })

      if (!seen.has(ingredient.itemId)) {
        seen.add(ingredient.itemId)
        queue.push({
          id: ingredient.itemId,
          depth: current.depth + 1,
        })
      }
    }
  }

  const nodes: ItemFlowNode[] = []
  for (const [depth, ids] of levels) {
    ids.forEach((id, index) => {
      const entry = indexes.entriesById.get(id)
      if (!entry) return
      nodes.push({
        id,
        type: 'item',
        position: {
          x: depth * 270,
          y: (index - (ids.length - 1) / 2) * 100,
        },
        data: {
          itemId: id,
          label: entry.name,
          icon: entry.icon,
          biome: entry.biome,
          expandable: Boolean(
            entry.recipe && entry.recipe.ingredients.length > 0,
          ),
          expanded: expanded.has(id),
        },
      })
    })
  }

  return { nodes, edges }
}

export function RecipeGraph({
  rootId,
  indexes,
}: {
  rootId: string
  indexes: Indexes
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([rootId]))
  const { isVisible } = useBiomeVisibility()
  const derived = useMemo(
    () => buildGraph(rootId, expanded, indexes, isVisible),
    [expanded, indexes, isVisible, rootId],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemFlowNode>(
    derived.nodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(derived.edges)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setNodes(derived.nodes)
    setEdges(derived.edges)
  }, [derived, setEdges, setNodes])

  if (!mounted) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.18)] text-xs text-[var(--faint)]">
        Loading graph…
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2 text-[0.68rem] text-[var(--faint)]">
        <span>Click a node with + to expand its recipe.</span>
        <span>{nodes.length} nodes</span>
      </div>
      <div style={{ height: 520 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            if (!node.data.expandable) return
            setExpanded((current) => {
              const next = new Set(current)
              if (next.has(node.id)) next.delete(node.id)
              else next.add(node.id)
              return next
            })
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={1.4}
          proOptions={{ hideAttribution: false }}
        >
          <Background color="#2a3a2f" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
}
