import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { CostNode } from '../../lib/calculator'
import type { Indexes } from '../../lib/dataset'
import { ingredientBiome, itemIconFor } from '../../lib/dataset'
import { useBiomeVisibility } from '../../lib/dataset-context'
import { ItemIcon } from '../ui/ItemIcon'

function CostTreeNode({
  node,
  indexes,
  depth,
}: {
  node: CostNode
  indexes: Indexes
  depth: number
}) {
  const [open, setOpen] = useState(depth < 1 && Boolean(node.children?.length))
  const { isVisible } = useBiomeVisibility()
  if (!isVisible(ingredientBiome(indexes, node.itemId))) return null
  const hasChildren = Boolean(node.children?.length)

  return (
    <li>
      <div className="flex items-center gap-2 py-1.5">
        <button
          type="button"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[0.65rem] ${
            hasChildren
              ? 'border-[var(--border-strong)] text-[var(--gold-soft)] hover:bg-[var(--surface-3)]'
              : 'border-transparent text-[var(--faint)]'
          }`}
          aria-label={hasChildren ? (open ? 'Collapse' : 'Expand') : undefined}
          aria-expanded={hasChildren ? open : undefined}
          disabled={!hasChildren}
          onClick={() => setOpen((value) => !value)}
        >
          {hasChildren ? (open ? '▾' : '▸') : '·'}
        </button>
        <ItemIcon icon={itemIconFor(indexes, node.itemId)} size="xs" />
        <Link
          to="/item/$id"
          params={{ id: node.itemId }}
          className="min-w-0 flex-1 truncate text-xs text-[var(--text)] hover:text-[var(--gold-soft)]"
        >
          {node.name}
        </Link>
        {node.crafts && node.recipe && node.recipe.amount > 1 ? (
          <span className="badge">{node.crafts}× batch</span>
        ) : null}
        {!hasChildren ? <span className="badge">raw</span> : null}
        <span className="shrink-0 font-mono text-xs text-[var(--gold-soft)]">
          {node.amount.toLocaleString('en')}
        </span>
      </div>
      {hasChildren && open ? (
        <ul className="ml-3 border-l border-[var(--border)] pl-3">
          {node.children?.map((child) => (
            <CostTreeNode
              key={`${node.itemId}-${child.itemId}`}
              node={child}
              indexes={indexes}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function CostTree({
  nodes,
  indexes,
}: {
  nodes: CostNode[]
  indexes: Indexes
}) {
  if (nodes.length === 0) {
    return <p className="text-xs text-[var(--faint)]">Nothing to expand.</p>
  }

  return (
    <ul>
      {nodes.map((node) => (
        <CostTreeNode
          key={node.itemId}
          node={node}
          indexes={indexes}
          depth={0}
        />
      ))}
    </ul>
  )
}
