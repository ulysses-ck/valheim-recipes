/* eslint-disable */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { BiomeId, CategoryId, DataOverrides } from '../lib/types'
import { BIOME_IDS, CATEGORY_IDS } from '../lib/types'
import { validateOverrides } from '../lib/schema'
import { useAdminStore } from '../stores/admin'
import { useDataset } from '../lib/dataset-context'
import { Badge } from '../components/ui/Badge'

export const Route = createFileRoute('/admin')({ component: AdminPage })

function formatOverrides(overrides: DataOverrides): string {
  return JSON.stringify(overrides, null, 2)
}

function countPatches(overrides: DataOverrides): number {
  return (
    Object.keys(overrides.recipes).length +
    Object.keys(overrides.items).length +
    Object.keys(overrides.stations).length +
    Object.keys(overrides.traders).length
  )
}

function AdminPage() {
  const overrides = useAdminStore((state) => state.overrides)
  const replace = useAdminStore((state) => state.replace)
  const reset = useAdminStore((state) => state.reset)
  const setItemOverride = useAdminStore((state) => state.setItemOverride)
  const setRecipeOverride = useAdminStore((state) => state.setRecipeOverride)
  const setStationOverride = useAdminStore((state) => state.setStationOverride)
  const setTraderOverride = useAdminStore((state) => state.setTraderOverride)
  const removeItemOverride = useAdminStore((state) => state.removeItemOverride)
  const removeRecipeOverride = useAdminStore(
    (state) => state.removeRecipeOverride,
  )
  const removeStationOverride = useAdminStore(
    (state) => state.removeStationOverride,
  )
  const removeTraderOverride = useAdminStore(
    (state) => state.removeTraderOverride,
  )

  const { indexes } = useDataset()

  const [text, setText] = useState(() => formatOverrides(overrides))
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form')
  const [selectedType, setSelectedType] = useState<
    'item' | 'recipe' | 'station' | 'trader'
  >('item')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    setText(formatOverrides(overrides))
  }, [overrides])

  const dirty = text !== formatOverrides(overrides)
  const patches = countPatches(overrides)

  const sections = useMemo(
    () =>
      (
        [
          ['recipes', overrides.recipes],
          ['items', overrides.items],
          ['stations', overrides.stations],
          ['traders', overrides.traders],
        ] as const
      ).map(([name, value]) => ({
        name,
        ids: Object.keys(value).sort(),
      })),
    [overrides],
  )

  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (selectedType === 'item') {
      const list = indexes.catalogEntries
        .filter(
          (e) =>
            !q ||
            e.name.toLowerCase().includes(q) ||
            e.itemId.toLowerCase().includes(q),
        )
        .slice(0, 30)
      return list.map((e) => ({
        id: e.itemId,
        label: e.name,
        sublabel: e.itemId,
      }))
    }
    if (selectedType === 'recipe') {
      const list = indexes.dataset.recipes
        .filter(
          (r) =>
            !q ||
            r.name.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.itemId.toLowerCase().includes(q),
        )
        .slice(0, 30)
      return list.map((r) => ({
        id: r.id,
        label: r.name,
        sublabel: `${r.id} → ${r.itemId}`,
      }))
    }
    if (selectedType === 'station') {
      const list = indexes.dataset.stations
        .filter(
          (s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q),
        )
        .slice(0, 30)
      return list.map((s) => ({ id: s.id, label: s.name, sublabel: s.id }))
    }
    const list = indexes.dataset.traders
      .filter(
        (t) =>
          !q ||
          t.itemName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.trader.toLowerCase().includes(q),
      )
      .slice(0, 30)
    return list.map((t) => ({
      id: t.id,
      label: t.itemName || t.trader,
      sublabel: `${t.trader} · ${t.id}`,
    }))
  }, [indexes, selectedType, search])

  const currentItem =
    selectedType === 'item' && selectedId
      ? indexes.itemsById.get(selectedId)
      : undefined
  const currentRecipe =
    selectedType === 'recipe' && selectedId
      ? indexes.recipesById.get(selectedId)
      : undefined
  const currentStation =
    selectedType === 'station' && selectedId
      ? indexes.stationsById.get(selectedId)
      : undefined
  const currentTrader =
    selectedType === 'trader' && selectedId
      ? indexes.dataset.traders.find((t) => t.id === selectedId)
      : undefined

  const currentItemOverride =
    selectedType === 'item' && selectedId
      ? overrides.items[selectedId]
      : undefined
  const currentRecipeOverride =
    selectedType === 'recipe' && selectedId
      ? overrides.recipes[selectedId]
      : undefined
  const currentStationOverride =
    selectedType === 'station' && selectedId
      ? overrides.stations[selectedId]
      : undefined
  const currentTraderOverride =
    selectedType === 'trader' && selectedId
      ? overrides.traders[selectedId]
      : undefined

  function apply() {
    setError(null)
    setStatus(null)
    try {
      const parsed: unknown = JSON.parse(text)
      const validated = validateOverrides(parsed)
      replace(validated)
      setStatus(
        `Applied ${countPatches(validated)} patch${
          countPatches(validated) === 1 ? '' : 'es'
        } to this browser. The catalog updated immediately.`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not parse or validate the overrides.',
      )
    }
  }

  function download() {
    const blob = new Blob([formatOverrides(overrides)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'overrides.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus(
      'Downloaded overrides.json. Replace src/data/overrides.json to commit it.',
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatOverrides(overrides))
      setStatus('Copied the current overrides JSON.')
    } catch {
      setError('Clipboard access was refused by the browser.')
    }
  }

  async function importFile(file: File) {
    setError(null)
    setStatus(null)
    try {
      const value = await file.text()
      JSON.parse(value)
      setText(value)
      setStatus('Loaded from file. Review and apply when ready.')
    } catch {
      setError('That file is not valid JSON.')
    }
  }

  function clearAll() {
    if (!window.confirm('Remove every local override in this browser?')) return
    reset()
    setError(null)
    setStatus('All local overrides cleared.')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase">
            Local admin
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Override the derived dataset.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Edit items directly or tweak the JSON. Patches are stored in this
            browser's localStorage and merged at runtime. To publish, download
            overrides.json and replace{' '}
            <code className="rounded bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-[0.72rem]">
              src/data/overrides.json
            </code>{' '}
            then rebuild.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="btn">
            View catalog
          </Link>
          <Badge
            className={patches > 0 ? 'badge-gold' : undefined}
            title="Patches in this browser"
          >
            {patches} patch{patches === 1 ? '' : 'es'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={`btn ${editorMode === 'form' ? 'btn-primary' : ''}`}
          onClick={() => setEditorMode('form')}
        >
          Form editor
        </button>
        <button
          type="button"
          className={`btn ${editorMode === 'json' ? 'btn-primary' : ''}`}
          onClick={() => setEditorMode('json')}
        >
          JSON editor
        </button>
      </div>

      {editorMode === 'form' ? (
        <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="card p-4 h-fit">
            <div className="flex gap-1 flex-wrap">
              {(['item', 'recipe', 'station', 'trader'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${selectedType === t ? 'chip-active' : ''}`}
                  onClick={() => {
                    setSelectedType(t)
                    setSelectedId('')
                    setSearch('')
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              className="input mt-3 w-full"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-3 max-h-[60vh] overflow-auto space-y-1">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`w-full text-left rounded px-2 py-1.5 text-xs ${selectedId === r.id ? 'bg-[var(--surface-3)]' : 'hover:bg-[rgba(255,255,255,0.03)]'}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="truncate font-semibold">{r.label}</div>
                  <div className="truncate text-[var(--faint)]">
                    {r.sublabel}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="card p-4">
            {!selectedId ? (
              <p className="text-sm text-[var(--faint)]">
                Select an item, recipe, station, or trader to edit its fields.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg">
                      {selectedType === 'item' && currentItem?.name}
                      {selectedType === 'recipe' && currentRecipe?.name}
                      {selectedType === 'station' && currentStation?.name}
                      {selectedType === 'trader' &&
                        (currentTrader?.itemName || currentTrader?.trader)}
                    </h2>
                    <p className="text-xs text-[var(--faint)] font-mono">
                      {selectedId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (selectedType === 'item')
                        removeItemOverride(selectedId)
                      if (selectedType === 'recipe')
                        removeRecipeOverride(selectedId)
                      if (selectedType === 'station')
                        removeStationOverride(selectedId)
                      if (selectedType === 'trader')
                        removeTraderOverride(selectedId)
                    }}
                  >
                    Clear override
                  </button>
                </div>

                {selectedType === 'item' && currentItem && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldInput
                      label="name"
                      value={
                        (currentItemOverride && currentItemOverride.name !== undefined ? (currentItemOverride.name as string) : currentItem.name)
                      }
                      onChange={(v) =>
                        setItemOverride(selectedId, {
                          ...(currentItemOverride || {}),
                          name: v,
                        })
                      }
                    />
                    <FieldSelect
                      label="biome"
                      value={
                        (currentItemOverride && currentItemOverride.biome !== undefined ? (currentItemOverride.biome as BiomeId) : currentItem.biome)
                      }
                      options={[...BIOME_IDS]}
                      onChange={(v) =>
                        setItemOverride(selectedId, {
                          ...(currentItemOverride || {}),
                          biome: v,
                        })
                      }
                    />
                    <FieldSelect
                      label="category"
                      value={
                        (currentItemOverride && currentItemOverride.category !== undefined ? (currentItemOverride.category as CategoryId) : currentItem.category)
                      }
                      options={[...CATEGORY_IDS]}
                      onChange={(v) =>
                        setItemOverride(selectedId, {
                          ...(currentItemOverride || {}),
                          category: v,
                        })
                      }
                    />
                    <FieldInput
                      label="icon"
                      value={
                        (currentItemOverride && currentItemOverride.icon !== undefined ? (currentItemOverride.icon as string) : currentItem.icon)
                      }
                      onChange={(v) =>
                        setItemOverride(selectedId, {
                          ...(currentItemOverride || {}),
                          icon: v,
                        })
                      }
                    />
                    <FieldInput
                      label="description"
                      value={
                        (currentItemOverride && currentItemOverride.description !== undefined ? (currentItemOverride.description as string) : (currentItem.description !== undefined ? currentItem.description : ''))
                      }
                      onChange={(v) =>
                        setItemOverride(selectedId, {
                          ...(currentItemOverride || {}),
                          description: v || undefined,
                        })
                      }
                      className="sm:col-span-2"
                    />
                  </div>
                )}

                {selectedType === 'recipe' && currentRecipe && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldInput
                      label="name"
                      value={
                        (currentRecipeOverride && currentRecipeOverride.name !== undefined ? (currentRecipeOverride.name as string) : currentRecipe.name)
                      }
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          name: v,
                        })
                      }
                    />
                    <FieldSelect
                      label="biome"
                      value={
                        (currentRecipeOverride && currentRecipeOverride.biome !== undefined ? (currentRecipeOverride.biome as BiomeId) : currentRecipe.biome)
                      }
                      options={[...BIOME_IDS]}
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          biome: v,
                        })
                      }
                    />
                    <FieldSelect
                      label="category"
                      value={
                        (currentRecipeOverride && currentRecipeOverride.category !== undefined ? (currentRecipeOverride.category as CategoryId) : currentRecipe.category)
                      }
                      options={[...CATEGORY_IDS]}
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          category: v,
                        })
                      }
                    />
                    <FieldInput
                      label="stationName"
                      value={
                        (currentRecipeOverride && currentRecipeOverride.stationName !== undefined ? (currentRecipeOverride.stationName as string) : currentRecipe.stationName)
                      }
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          stationName: v,
                        })
                      }
                    />
                    <FieldInput
                      label="stationLevel"
                      type="number"
                      value={String(
                        (currentRecipeOverride?.stationLevel as number) ??
                          currentRecipe.stationLevel,
                      )}
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          stationLevel: Number(v),
                        })
                      }
                    />
                    <FieldInput
                      label="amount"
                      type="number"
                      value={String(
                        (currentRecipeOverride?.amount as number) ??
                          currentRecipe.amount,
                      )}
                      onChange={(v) =>
                        setRecipeOverride(selectedId, {
                          ...(currentRecipeOverride || {}),
                          amount: Number(v),
                        })
                      }
                    />
                  </div>
                )}

                {selectedType === 'station' && currentStation && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldInput
                      label="name"
                      value={
                        (currentStationOverride && currentStationOverride.name !== undefined ? (currentStationOverride.name as string) : currentStation.name)
                      }
                      onChange={(v) =>
                        setStationOverride(selectedId, {
                          ...(currentStationOverride || {}),
                          name: v,
                        })
                      }
                    />
                    <FieldSelect
                      label="biome"
                      value={
                        (currentStationOverride && currentStationOverride.biome !== undefined ? (currentStationOverride.biome as BiomeId) : currentStation.biome)
                      }
                      options={[...BIOME_IDS]}
                      onChange={(v) =>
                        setStationOverride(selectedId, {
                          ...(currentStationOverride || {}),
                          biome: v,
                        })
                      }
                    />
                    <FieldInput
                      label="icon"
                      value={
                        (currentStationOverride && currentStationOverride.icon !== undefined ? (currentStationOverride.icon as string) : currentStation.icon)
                      }
                      onChange={(v) =>
                        setStationOverride(selectedId, {
                          ...(currentStationOverride || {}),
                          icon: v,
                        })
                      }
                      className="sm:col-span-2"
                    />
                  </div>
                )}

                {selectedType === 'trader' && currentTrader && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldInput
                      label="itemName"
                      value={
                        (currentTraderOverride && currentTraderOverride.itemName !== undefined ? (currentTraderOverride.itemName as string) : currentTrader.itemName)
                      }
                      onChange={(v) =>
                        setTraderOverride(selectedId, {
                          ...(currentTraderOverride || {}),
                          itemName: v,
                        })
                      }
                    />
                    <FieldInput
                      label="price"
                      value={
                        (currentTraderOverride && currentTraderOverride.price !== undefined ? (currentTraderOverride.price as string) : currentTrader.price)
                      }
                      onChange={(v) =>
                        setTraderOverride(selectedId, {
                          ...(currentTraderOverride || {}),
                          price: v,
                        })
                      }
                    />
                    <FieldInput
                      label="unlock"
                      value={
                        (currentTraderOverride && currentTraderOverride.unlock !== undefined ? (currentTraderOverride.unlock as string) : currentTrader.unlock)
                      }
                      onChange={(v) =>
                        setTraderOverride(selectedId, {
                          ...(currentTraderOverride || {}),
                          unlock: v,
                        })
                      }
                      className="sm:col-span-2"
                    />
                    <FieldInput
                      label="amount"
                      type="number"
                      value={String(
                        (currentTraderOverride?.amount as number) ??
                          currentTrader.amount,
                      )}
                      onChange={(v) =>
                        setTraderOverride(selectedId, {
                          ...(currentTraderOverride || {}),
                          amount: Number(v),
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg">overrides.json</h2>
                <p className="text-xs text-[var(--faint)]">
                  Patch objects are merged shallowly by row id. Arrays replace
                  the original array.
                </p>
              </div>
              <Badge className={dirty ? 'badge-gold' : undefined}>
                {dirty ? 'Unapplied changes' : 'In sync'}
              </Badge>
            </div>

            <label htmlFor="overrides-editor" className="sr-only">
              Overrides JSON
            </label>
            <textarea
              id="overrides-editor"
              className="input mt-3 min-h-[420px] w-full resize-y font-mono text-[0.72rem] leading-relaxed"
              spellCheck={false}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
                setStatus(null)
              }}
            />

            {error ? (
              <pre className="mt-3 max-h-40 overflow-auto rounded border border-[rgba(224,122,106,0.35)] bg-[rgba(224,122,106,0.08)] p-3 text-[0.68rem] whitespace-pre-wrap text-[var(--danger)]">
                {error}
              </pre>
            ) : null}
            {status ? (
              <p className="mt-3 rounded border border-[rgba(143,191,98,0.3)] bg-[rgba(143,191,98,0.08)] px-3 py-2 text-xs text-[var(--moss-soft)]">
                {status}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={apply}>
                Apply to this browser
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setText(formatOverrides(overrides))
                  setError(null)
                  setStatus('Editor reset to the applied overrides.')
                }}
              >
                Revert editor
              </button>
              <button type="button" className="btn" onClick={download}>
                Download JSON
              </button>
              <button type="button" className="btn" onClick={() => void copy()}>
                Copy JSON
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => fileRef.current?.click()}
              >
                Import file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void importFile(file)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={clearAll}
              >
                Clear local overrides
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="card p-4">
              <h2 className="font-display text-lg">Active patches</h2>
              {patches === 0 ? (
                <p className="mt-2 text-xs text-[var(--faint)]">
                  No local overrides.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {sections.map((section) => (
                    <div key={section.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          {section.name}
                        </span>
                        <Badge>{section.ids.length}</Badge>
                      </div>
                      {section.ids.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                          {section.ids.map((id) => (
                            <li
                              key={id}
                              className="truncate font-mono text-[0.65rem] text-[var(--faint)]"
                            >
                              {id}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      <span className="text-[var(--faint)]">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-[var(--faint)]">{label}</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}
