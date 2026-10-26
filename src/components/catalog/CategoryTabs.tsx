import { useTranslation } from 'react-i18next'
import type { CatalogEntry } from '../../lib/dataset'
import {
  CATEGORY_ORDER,
  SUBCATEGORY_ORDER,
  formatCategory,
  formatSubcategory,
} from '../../lib/format'
import type { CategoryId } from '../../lib/types'

interface CategoryTabsProps {
  entries: CatalogEntry[]
  category: CategoryId | 'all'
  subcategory: string | 'all'
  onCategory: (category: CategoryId | 'all') => void
  onSubcategory: (subcategory: string | 'all') => void
}

export function CategoryTabs({
  entries,
  category,
  subcategory,
  onCategory,
  onSubcategory,
}: CategoryTabsProps) {
  const { t } = useTranslation()

  const categoryCounts = new Map<CategoryId, number>()
  for (const entry of entries) {
    categoryCounts.set(
      entry.category,
      (categoryCounts.get(entry.category) ?? 0) + 1,
    )
  }

  const selectedEntries =
    category === 'all'
      ? entries
      : entries.filter((entry) => entry.category === category)

  const subcategoryCounts = new Map<string, number>()
  for (const entry of selectedEntries) {
    if (!entry.subcategory) continue
    subcategoryCounts.set(
      entry.subcategory,
      (subcategoryCounts.get(entry.subcategory) ?? 0) + 1,
    )
  }

  const order = category === 'all' ? undefined : SUBCATEGORY_ORDER[category]
  const subcategories = [...subcategoryCounts.keys()].sort((a, b) => {
    const orderA = order?.indexOf(a) ?? -1
    const orderB = order?.indexOf(b) ?? -1
    if (orderA !== -1 || orderB !== -1) {
      if (orderA === -1) return 1
      if (orderB === -1) return -1
      return orderA - orderB
    }
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-3">
      <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          className="chip"
          aria-pressed={category === 'all'}
          onClick={() => {
            onCategory('all')
            onSubcategory('all')
          }}
        >
          {t('common.all')}
          <span className="chip-count">{entries.length}</span>
        </button>
        {CATEGORY_ORDER.map((id) => {
          const count = categoryCounts.get(id) ?? 0
          if (count === 0) return null
          return (
            <button
              key={id}
              type="button"
              className="chip"
              aria-pressed={category === id}
              onClick={() => {
                onCategory(id)
                onSubcategory('all')
              }}
            >
              {formatCategory(id)}
              <span className="chip-count">{count}</span>
            </button>
          )
        })}
      </div>

      {category !== 'all' && subcategories.length > 1 ? (
        <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            className="chip"
            aria-pressed={subcategory === 'all'}
            onClick={() => onSubcategory('all')}
          >
            {t('catalog.allTypes')}
          </button>
          {subcategories.map((id) => (
            <button
              key={id}
              type="button"
              className="chip"
              aria-pressed={subcategory === id}
              onClick={() => onSubcategory(id)}
            >
              {formatSubcategory(id)}
              <span className="chip-count">
                {subcategoryCounts.get(id) ?? 0}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
