import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { entriesInBiome } from '../lib/dataset'
import { useDataset, useBiomeVisibility } from '../lib/dataset-context'
import { createCatalogSearch, searchCatalog } from '../lib/search'
import {
  formatBiome,
  formatCategory,
  formatNumber,
  formatSubcategory,
  pluralize,
} from '../lib/format'
import type { CategoryId, TraderListing } from '../lib/types'
import { CategoryTabs } from '../components/catalog/CategoryTabs'
import { CatalogCard } from '../components/catalog/CatalogCard'
import { StationCard } from '../components/station/StationCard'
import { TraderCard } from '../components/trader/TraderCard'
import { Badge } from '../components/ui/Badge'

export const Route = createFileRoute('/')({ component: Home })

const PAGE_SIZE = 60

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  )
}

function Home() {
  const { t } = useTranslation()
  const { dataset, indexes } = useDataset()
  const { selection, setBiome, isVisible, biomes } = useBiomeVisibility()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [subcategory, setSubcategory] = useState<string | 'all'>('all')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const visible = useMemo(
    () => entriesInBiome(indexes.catalogEntries, selection),
    [indexes, selection],
  )
  const search = useMemo(() => createCatalogSearch(visible), [visible])
  const searched = useMemo(
    () => (query.trim() ? searchCatalog(search, query) : visible),
    [query, search, visible],
  )
  const filtered = useMemo(
    () =>
      searched.filter(
        (entry) =>
          (category === 'all' || entry.category === category) &&
          (subcategory === 'all' || entry.subcategory === subcategory),
      ),
    [category, searched, subcategory],
  )

  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [query, category, subcategory, selection])

  const visibleStations = useMemo(
    () =>
      [...dataset.stations]
        .filter((station) => isVisible(station.biome))
        .sort((a, b) => {
          const rankA = indexes.biomeRank.get(a.biome) ?? 0
          const rankB = indexes.biomeRank.get(b.biome) ?? 0
          if (rankA !== rankB) return rankA - rankB
          return a.name.localeCompare(b.name)
        }),
    [dataset.stations, indexes.biomeRank, isVisible],
  )

  const traderGroups = useMemo(() => {
    const groups = new Map<string, TraderListing[]>()
    for (const offer of dataset.traders) {
      if (!isVisible(offer.biome)) continue
      if (offer.itemId) {
        const itemBiome = indexes.itemsById.get(offer.itemId)?.biome
        if (itemBiome && !isVisible(itemBiome)) continue
      }
      const offers = groups.get(offer.trader) ?? []
      offers.push(offer)
      groups.set(offer.trader, offers)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [dataset.traders, indexes.itemsById, isVisible])

  const selectionLabel =
    selection === 'all' ? t('home.allBiomes') : formatBiome(selection)
  const shown = filtered.slice(0, limit)
  const remaining = filtered.length - shown.length

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_280px_at_20%_0%,rgba(143,191,98,0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--gold)] uppercase">
            {t('home.eyebrow')}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] text-balance md:text-6xl">
            {t('home.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {t('home.description')}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <Link to="/calculator" className="btn btn-primary">
              {t('home.openCalculator')}
            </Link>
            <a href="#catalog" className="btn">
              {t('home.browseRecipes')}
            </a>
            <span className="pb-1 text-xs text-[var(--faint)]">
              {t('home.showing', { biome: selectionLabel })}
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t('home.stats.visibleEntries')}
              value={visible.length}
            />
            <Stat
              label={t('home.stats.stations')}
              value={visibleStations.length}
            />
            <Stat
              label={t('home.stats.traderOffers')}
              value={traderGroups.reduce(
                (sum, [, offers]) => sum + offers.length,
                0,
              )}
            />
            <Stat label={t('home.stats.biomes')} value={biomes.length} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--faint)] uppercase">
              {t('home.progress')}
            </span>
            {[...biomes]
              .sort((a, b) => a.rank - b.rank)
              .map((biome) => (
                <button
                  key={biome.id}
                  type="button"
                  className="chip"
                  aria-pressed={selection === biome.id}
                  onClick={() => setBiome(biome.id)}
                >
                  {formatBiome(biome.id)}
                </button>
              ))}
            <button
              type="button"
              className="chip"
              aria-pressed={selection === 'all'}
              title={t('home.allBiomesHint')}
              onClick={() => setBiome('all')}
            >
              {t('biome.all')}
            </button>
          </div>

          {selection === 'all' ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--danger)]">
              <Badge className="badge-danger">{t('home.spoilersOn')}</Badge>
              {t('home.spoilersBody')}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-[var(--text)]"
                onClick={() => setBiome('meadows')}
              >
                {t('home.returnMeadows')}
              </button>
            </p>
          ) : (
            <p className="mt-3 text-xs text-[var(--faint)]">
              {t('home.onlyBiome', { biome: formatBiome(selection) })}
            </p>
          )}
        </div>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">
              {t('home.catalogTitle')}
            </h2>
            <p className="mt-1 text-xs text-[var(--faint)]">
              {t('home.catalogDescription', { count: visible.length })}
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--faint)]">
              <SearchIcon />
            </span>
            <label htmlFor="catalog-search" className="sr-only">
              {t('home.searchLabel')}
            </label>
            <input
              id="catalog-search"
              className="input pr-20 pl-9"
              type="search"
              placeholder={t('home.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-[0.68rem] text-[var(--faint)] hover:text-[var(--text)]"
                onClick={() => setQuery('')}
              >
                {t('common.clear')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <CategoryTabs
            entries={visible}
            category={category}
            subcategory={subcategory}
            onCategory={setCategory}
            onSubcategory={setSubcategory}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--faint)]">
          <span>
            {query.trim()
              ? t('home.resultsFor', {
                  count: filtered.length,
                  query: query.trim(),
                })
              : pluralize(filtered.length, 'result')}
          </span>
          {category !== 'all' ? (
            <span className="badge">
              {formatCategory(category)}
              {subcategory !== 'all'
                ? ` · ${formatSubcategory(subcategory)}`
                : ''}
            </span>
          ) : null}
        </div>

        {shown.length > 0 ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((entry) => (
                <CatalogCard
                  key={entry.itemId}
                  entry={entry}
                  indexes={indexes}
                />
              ))}
            </div>
            {remaining > 0 ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setLimit((value) => value + PAGE_SIZE)}
                >
                  {t('home.showMore', {
                    count: Math.min(PAGE_SIZE, remaining),
                  })}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="card mt-6 p-8 text-center">
            <p className="font-display text-lg">{t('home.emptyTitle')}</p>
            <p className="mt-1 text-xs text-[var(--faint)]">
              {query.trim() ? t('home.emptySearch') : t('home.emptyGate')}
            </p>
            <button
              type="button"
              className="btn mt-4"
              onClick={() => {
                setQuery('')
                setCategory('all')
                setSubcategory('all')
              }}
            >
              {t('home.clearFilters')}
            </button>
          </div>
        )}
      </section>

      <section
        id="stations"
        className="mx-auto max-w-7xl scroll-mt-24 border-t border-[var(--border)] px-4 py-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">
              {t('home.stationsTitle')}
            </h2>
            <p className="mt-1 text-xs text-[var(--faint)]">
              {t('home.stationsDescription')}
            </p>
          </div>
          <span className="badge">
            {t('home.stationsVisible', { count: visibleStations.length })}
          </span>
        </div>

        {visibleStations.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                indexes={indexes}
                recipeCount={
                  indexes.recipesByStationId
                    .get(station.id)
                    ?.filter((recipe) => isVisible(recipe.biome)).length ?? 0
                }
                extensionCount={
                  station.extensions.filter((extension) =>
                    isVisible(extension.biome),
                  ).length
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-xs text-[var(--faint)]">
            {t('home.noStations')}
          </p>
        )}
      </section>

      <section
        id="traders"
        className="mx-auto max-w-7xl border-t border-[var(--border)] px-4 py-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">
              {t('home.tradersTitle')}
            </h2>
            <p className="mt-1 text-xs text-[var(--faint)]">
              {t('home.tradersDescription')}
            </p>
          </div>
          <span className="badge">
            {t('home.traderOffers', {
              count: traderGroups.reduce(
                (sum, [, offers]) => sum + offers.length,
                0,
              ),
            })}
          </span>
        </div>

        {traderGroups.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {traderGroups.map(([trader, offers]) => (
              <TraderCard
                key={trader}
                trader={trader}
                offers={offers}
                indexes={indexes}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-xs text-[var(--faint)]">
            {t('home.noTraders')}
          </p>
        )}
      </section>

      <section className="mx-auto max-w-7xl border-t border-[var(--border)] px-4 py-10">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard
            title={t('home.info.biomeGate.title')}
            body={t('home.info.biomeGate.body')}
          />
          <InfoCard
            title={t('home.info.upgradeMath.title')}
            body={t('home.info.upgradeMath.body')}
          />
          <InfoCard
            title={t('home.info.rawMaterials.title')}
            body={t('home.info.rawMaterials.body')}
          />
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <p className="font-display text-2xl text-[var(--gold-soft)]">
        {formatNumber(value)}
      </p>
      <p className="text-[0.68rem] tracking-wide text-[var(--faint)] uppercase">
        {label}
      </p>
    </div>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-4">
      <h3 className="font-display text-base">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{body}</p>
    </div>
  )
}
