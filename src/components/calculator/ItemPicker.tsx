import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogEntry } from '../../lib/dataset'
import { formatCategory } from '../../lib/format'
import { ItemIcon } from '../ui/ItemIcon'
import { BiomeBadge } from '../ui/Badge'

interface ItemPickerProps {
  entries: CatalogEntry[]
  onSelect: (itemId: string) => void
  placeholder?: string
  keepOpen?: boolean
}

export function ItemPicker({
  entries,
  onSelect,
  placeholder,
  keepOpen = false,
}: ItemPickerProps) {
  const { t } = useTranslation()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const matches = term
      ? entries.filter((entry) => entry.searchText.includes(term))
      : entries
    return matches.slice(0, 12)
  }, [entries, query])

  function choose(entry: CatalogEntry) {
    onSelect(entry.itemId)
    setQuery('')
    setActive(0)
    if (keepOpen) {
      setOpen(true)
      inputRef.current?.focus()
    } else {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t('catalog.searchItems')}
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        className="input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filtered[active] ? `${listId}-${active}` : undefined
        }
        autoComplete="off"
        placeholder={placeholder ?? t('catalog.searchItems')}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActive((value) =>
              Math.min(filtered.length - 1, Math.max(0, value + 1)),
            )
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((value) => Math.max(0, value - 1))
          } else if (event.key === 'Enter') {
            const entry = filtered.at(active)
            if (entry) {
              event.preventDefault()
              choose(entry)
            }
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
      />

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="card thin-scroll absolute z-50 mt-1 max-h-80 w-full overflow-y-auto p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-xs text-[var(--faint)]">
              {t('catalog.noMatches')}
            </li>
          ) : (
            filtered.map((entry, index) => (
              <li
                key={entry.itemId}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
              >
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left ${
                    index === active
                      ? 'bg-[var(--surface-3)]'
                      : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(entry)}
                  onMouseEnter={() => setActive(index)}
                >
                  <ItemIcon icon={entry.icon} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[var(--text)]">
                      {entry.name}
                    </span>
                    <span className="block truncate text-[0.62rem] text-[var(--faint)]">
                      {formatCategory(entry.category)}
                      {entry.stationName ? ` · ${entry.stationName}` : ''}
                    </span>
                  </span>
                  <BiomeBadge biome={entry.biome} />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
