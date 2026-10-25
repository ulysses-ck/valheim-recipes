import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { DataOverrides } from '../lib/types'
import { validateOverrides } from '../lib/schema'
import { useAdminStore } from '../stores/admin'
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

  const [text, setText] = useState(() => formatOverrides(overrides))
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase">
            Local admin
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Override the derived dataset.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Patches are stored in this browser's localStorage and merged over
            the generated JSON at runtime. Nothing is uploaded. To publish a
            correction, download the file and replace{' '}
            <code className="rounded bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-[0.72rem]">
              src/data/overrides.json
            </code>
            , then rerun the build.
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg">overrides.json</h2>
              <p className="text-xs text-[var(--faint)]">
                Patch objects are merged shallowly by row id. Arrays replace the
                original array.
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
            className="input mt-3 min-h-[360px] w-full resize-y font-mono text-[0.72rem] leading-relaxed"
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
            <button type="button" className="btn btn-danger" onClick={clearAll}>
              Clear local overrides
            </button>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="font-display text-lg">Active patches</h2>
            {patches === 0 ? (
              <p className="mt-2 text-xs text-[var(--faint)]">
                No local overrides. The generated data is used as-is.
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

          <section className="card p-4">
            <h2 className="font-display text-lg">Patchable fields</h2>
            <dl className="mt-2 space-y-2 text-[0.68rem] text-[var(--faint)]">
              <Field
                name="recipes"
                fields="name, biome, category, subcategory, stationId, stationName, stationLevel, amount, upgradeOnly, canUpgrade, maxLevel, ingredients"
              />
              <Field
                name="items"
                fields="name, biome, category, subcategory, kind, description, icon"
              />
              <Field
                name="stations"
                fields="name, biome, icon, buildCost, extensions"
              />
              <Field
                name="traders"
                fields="itemName, biome, price, unlock, amount"
              />
            </dl>
            <p className="mt-3 text-[0.66rem] leading-relaxed text-[var(--faint)]">
              Validation runs against the Zod schema before anything is applied.
              Invalid JSON or an unknown biome is rejected.
            </p>
          </section>

          <section className="card p-4">
            <h2 className="font-display text-lg">Example</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgba(0,0,0,0.22)] p-2 text-[0.62rem] leading-relaxed text-[var(--muted)]">
              {`{
  "recipes": {
    "recipe_id": { "biome": "plains" }
  },
  "items": {
    "item_id": { "name": "Corrected name" }
  }
}`}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Field({ name, fields }: { name: string; fields: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.68rem] text-[var(--muted)]">{name}</dt>
      <dd className="mt-0.5 leading-relaxed">{fields}</dd>
    </div>
  )
}
