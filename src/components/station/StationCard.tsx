import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Indexes } from '../../lib/dataset'
import { itemIconFor } from '../../lib/dataset'
import { pluralize } from '../../lib/format'
import type { Station } from '../../lib/types'
import { BiomeBadge } from '../ui/Badge'
import { ItemIcon } from '../ui/ItemIcon'

export function StationCard({
  station,
  recipeCount,
  extensionCount,
  indexes,
}: {
  station: Station
  recipeCount: number
  extensionCount: number
  indexes: Indexes
}) {
  const { t } = useTranslation()
  const preview = station.buildCost.slice(0, 3)
  const extra = station.buildCost.length - preview.length

  return (
    <Link
      to="/station/$id"
      params={{ id: station.id }}
      className="card card-link flex h-full flex-col p-4"
    >
      <div className="flex items-start gap-3">
        <ItemIcon icon={station.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base">{station.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <BiomeBadge biome={station.biome} />
            {extensionCount > 0 ? (
              <span className="badge">
                {pluralize(extensionCount, 'extension')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-8">
        {station.buildCost.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {preview.map((ingredient) => (
              <span
                key={ingredient.itemId}
                className="flex items-center gap-1 text-[0.7rem] text-[var(--muted)]"
              >
                <ItemIcon
                  icon={itemIconFor(indexes, ingredient.itemId)}
                  size="xs"
                />
                <span className="font-mono">{ingredient.amount}</span>
                <span className="max-w-20 truncate">{ingredient.name}</span>
              </span>
            ))}
            {extra > 0 ? (
              <span className="text-[0.68rem] text-[var(--faint)]">
                {t('catalogCard.more', { count: extra })}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-[0.72rem] text-[var(--faint)]">
            {t('catalogCard.noStationRequired')}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2 text-[0.68rem] text-[var(--faint)]">
        <span>{pluralize(recipeCount, 'recipe')}</span>
        <span>{t('catalogCard.viewStation')}</span>
      </div>
    </Link>
  )
}
