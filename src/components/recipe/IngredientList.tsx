import { Link } from '@tanstack/react-router'
import type { Indexes } from '../../lib/dataset'
import { itemIconFor } from '../../lib/dataset'
import type { CostLine } from '../../lib/calculator'
import { ItemIcon } from '../ui/ItemIcon'

interface IngredientListProps {
  lines: CostLine[]
  indexes: Indexes
  showPerLevel?: boolean
  emptyText?: string
  compact?: boolean
}

export function IngredientList({
  lines,
  indexes,
  showPerLevel = false,
  emptyText = 'Nothing required.',
  compact = false,
}: IngredientListProps) {
  if (lines.length === 0) {
    return <p className="text-xs text-[var(--faint)]">{emptyText}</p>
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {lines.map((line) => (
        <li key={line.itemId} className="flex items-center gap-2.5 py-2">
          <ItemIcon
            icon={itemIconFor(indexes, line.itemId)}
            size={compact ? 'xs' : 'sm'}
          />
          <Link
            to="/item/$id"
            params={{ id: line.itemId }}
            className="min-w-0 flex-1 truncate text-sm text-[var(--text)] hover:text-[var(--gold-soft)]"
          >
            {line.name}
          </Link>
          <span className="shrink-0 font-mono text-sm text-[var(--gold-soft)]">
            {line.amount.toLocaleString('en')}
          </span>
          {showPerLevel && line.amountPerLevel > 0 ? (
            <span className="shrink-0 text-[0.65rem] text-[var(--faint)]">
              +{line.amountPerLevel}/lvl
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
