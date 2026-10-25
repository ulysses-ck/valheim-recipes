import Fuse from 'fuse.js'
import type { CatalogEntry } from './dataset'

export function createCatalogSearch(
  entries: CatalogEntry[],
): Fuse<CatalogEntry> {
  return new Fuse(entries, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'searchText', weight: 0.3 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

export function searchCatalog(
  search: Fuse<CatalogEntry>,
  query: string,
): CatalogEntry[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  return search.search(trimmed, { limit: 60 }).map((result) => result.item)
}
