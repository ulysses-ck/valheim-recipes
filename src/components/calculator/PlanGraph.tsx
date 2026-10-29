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
import type { NodeProps } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import '@xyflow/react/dist/style.css'
import type { Indexes } from '../../lib/dataset'
import type { PlanTotal } from '../../lib/calculator'
import type { PlanGraphNode } from '../../lib/plan-graph'
import { buildPlanGraph } from '../../lib/plan-graph'
import { formatBiome } from '../../lib/format'
import { ItemIcon } from '../ui/ItemIcon'

function PlanNode({ data }: NodeProps<PlanGraphNode>) {
  const { t } = useTranslation()
  const isEntry = data.kind === 'entry'

  return (
    <div
      className={`w-[230px] rounded-lg border px-2.5 py-2 ${
        isEntry
          ? 'border-[rgba(217,164,65,0.55)] bg-[var(--surface-2)]'
          : data.expanded
            ? 'border-[rgba(217,164,65,0.55)] bg-[var(--surface-2)]'
            : 'border-[var(--border-strong)] bg-[var(--surface)]'
      }`}
    >
      {!isEntry ? (
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: 6, height: 6, background: '#d9a441' }}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <ItemIcon icon={data.icon} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text)]">
            {data.label}
          </p>
          {isEntry ? (
            <p className="text-[0.6rem] text-[var(--faint)]">
              ×{data.quantity} ·{' '}
              {t('calculator.panel.level', { level: data.target })}
            </p>
          ) : (
            <p className="text-[0.6rem] text-[var(--faint)]">
              ×{data.amount}
              {data.crafts && data.crafts > 1
                ? ` · ${t('calculator.panel.baseCrafts', {
                    count: data.crafts,
                  })}`
                : ''}
            </p>
          )}
        </div>
        {isEntry ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border-strong)] text-[0.7rem] text-[var(--faint)] hover:border-[var(--gold)] hover:text-[var(--gold-soft)]"
            aria-label={t('calculator.plan.remove')}
            onClick={(event) => {
              event.stopPropagation()
              data.onRemove?.(data.itemId)
            }}
          >
            ×
          </button>
        ) : data.expandable ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border-strong)] text-[0.7rem] text-[var(--gold-soft)]">
            {data.expanded ? '−' : '+'}
          </span>
        ) : null}
      </div>

      <p className="mt-1 truncate text-[0.6rem] text-[var(--faint)]">
        {isEntry
          ? data.stationName
          : `${formatBiome(data.biome)}${data.isRaw ? ` · ${t('recipe.raw')}` : ''}`}
      </p>

      {!isEntry && data.expandable ? (
        <Handle
          type="source"
          position={Position.Right}
          style={{ width: 6, height: 6, background: '#8fbf62' }}
        />
      ) : null}
      {isEntry ? (
        <Handle
          type="source"
          position={Position.Right}
          style={{ width: 6, height: 6, background: '#8fbf62' }}
        />
      ) : null}
    </div>
  )
}

const nodeTypes = { planNode: PlanNode }

export function PlanGraph({
  plan,
  indexes,
  onRemove,
}: {
  plan: PlanTotal
  indexes: Indexes
  onRemove: (itemId: string) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const derived = useMemo(() => {
    const graph = buildPlanGraph(plan, indexes, expanded)
    return {
      nodes: graph.nodes.map((node) =>
        node.data.kind === 'entry'
          ? { ...node, data: { ...node.data, onRemove } }
          : node,
      ),
      edges: graph.edges,
    }
  }, [expanded, indexes, onRemove, plan])
  const [nodes, setNodes, onNodesChange] = useNodesState<PlanGraphNode>(
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
      <div className="flex h-[620px] items-center justify-center rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.18)] text-xs text-[var(--faint)]">
        {t('recipe.graphLoading')}
      </div>
    )
  }

  if (derived.nodes.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.18)] text-xs text-[var(--faint)]">
        {t('calculator.plan.emptyTitle')}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2 text-[0.68rem] text-[var(--faint)]">
        <span>{t('calculator.plan.graphHint')}</span>
        <span>{t('recipe.nodeCount', { count: nodes.length })}</span>
      </div>
      <div style={{ height: 620 }}>
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
          minZoom={0.15}
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
