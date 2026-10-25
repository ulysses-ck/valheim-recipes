import { Link } from '@tanstack/react-router'
import type { CatalogEntry, Indexes } from '../../lib/dataset'
import { itemIconFor } from '../../lib/dataset'
import { formatCategory } from '../../lib/format'
import { Badge, BiomeBadge } from '../ui/Badge'
import { ItemIcon } from '../ui/ItemIcon'

export function CatalogCard({
  entry,
  indexes,
}: {
  entry: CatalogEntry
  indexes: Indexes
}) {
  const preview = entry.ingredients.slice(0, 3)
  const extra = entry.ingredients.length - preview.length

  return (
    <Link
      to="/item/$id"
      params={{ id: entry.itemId }}
      className="card card-link flex h-full flex-col p-4"
    >
      <div className="flex items-start gap-3">
        <ItemIcon icon={entry.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base leading-snug text-[var(--text)]">
            {entry.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge>{formatCategory(entry.category)}</Badge>
            <BiomeBadge biome={entry.biome} />
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-9">
        {entry.recipe ? (
          <div className="flex flex-wrap items-center gap-2">
            {preview.map((ingredient) => (
              <span
                key={ingredient.itemId}
                className="flex items-center gap-1 text-[0.7rem] text-[var(--muted)]"
                title={ingredient.name}
              >
                <ItemIcon
                  icon={itemIconFor(indexes, ingredient.itemId)}
                  size="xs"
                />
                <span className="font-mono text-[var(--text)]">
                  {ingredient.amount}
                </span>
                <span className="max-w-24 truncate">{ingredient.name}</span>
              </span>
            ))}
            {extra > 0 ? (
              <span className="text-[0.68rem] text-[var(--faint)]">
                +{extra} more
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-[0.72rem] text-[var(--faint)]">
            {entry.usedIn > 0
              ? `Used in ${entry.usedIn} recipe${entry.usedIn === 1 ? '' : 's'}`
              : 'Raw material'}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2 text-[0.68rem] text-[var(--faint)]">
        <span className="truncate">
          {entry.stationName
            ? `Station: ${entry.stationName}`
            : entry.kind === 'food'
              ? 'Consumable'
              : 'Material'}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {entry.recipes.length > 1 ? (
            <span className="badge">{entry.recipes.length} recipes</span>
          ) : null}
          {entry.recipe?.upgradeOnly ? (
            <span className="badge">Upgrade only</span>
          ) : null}
          {entry.usedIn > 0 && entry.recipe ? (
            <span>Used in {entry.usedIn}</span>
          ) : null}
        </span>
      </div>
    </Link>
  )
}
