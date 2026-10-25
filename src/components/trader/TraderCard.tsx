import { Link } from '@tanstack/react-router'
import type { Indexes } from '../../lib/dataset'
import { itemIconFor } from '../../lib/dataset'
import { formatPrice, formatUnlock } from '../../lib/format'
import type { TraderListing } from '../../lib/types'
import { ItemIcon } from '../ui/ItemIcon'

export function TraderCard({
  trader,
  offers,
  indexes,
}: {
  trader: string
  offers: TraderListing[]
  indexes: Indexes
}) {
  if (offers.length === 0) return null

  const unlocks = [
    ...new Set(offers.map((offer) => formatUnlock(offer.unlock))),
  ]
    .filter(Boolean)
    .slice(0, 2)

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(217,164,65,0.4)] bg-[rgba(217,164,65,0.08)] font-display text-lg text-[var(--gold-soft)]"
          aria-hidden="true"
        >
          ᚲ
        </span>
        <div>
          <h3 className="font-display text-base">{trader}</h3>
          <p className="text-[0.68rem] text-[var(--faint)]">
            {offers.length} offer{offers.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {offers.slice(0, 4).map((offer) => {
          const content = (
            <>
              <ItemIcon
                icon={
                  offer.itemId ? itemIconFor(indexes, offer.itemId) : offer.icon
                }
                size="xs"
              />
              <span className="min-w-0 flex-1 truncate text-[0.72rem] text-[var(--text)]">
                {offer.itemName}
              </span>
              <span className="shrink-0 text-[0.68rem] text-[var(--gold-soft)]">
                {formatPrice(offer.price)}
              </span>
            </>
          )

          return (
            <li key={offer.id}>
              {offer.itemId ? (
                <Link
                  to="/item/$id"
                  params={{ id: offer.itemId }}
                  className="flex items-center gap-2 rounded px-1 py-1 hover:bg-[rgba(255,255,255,0.03)]"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-1 py-1">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {offers.length > 4 ? (
        <p className="mt-2 text-[0.68rem] text-[var(--faint)]">
          +{offers.length - 4} more
        </p>
      ) : null}

      {unlocks.length > 0 ? (
        <p className="mt-auto border-t border-[var(--border)] pt-2 text-[0.66rem] text-[var(--faint)]">
          Unlock: {unlocks.join(' · ')}
        </p>
      ) : null}
    </div>
  )
}
