# AGENTS.md

## Project

`valheim-recipes` — a multi-route Valheim recipe graph plus material/upgrade calculator.
Public fan project. Static dataset, no database, no authentication.

## Stack

- TanStack Start (React 19, Vite, file-based routes)
- Tailwind CSS v4
- `@xyflow/react` for the recipe graph
- Zustand for the biome gate and local admin overrides (persisted in `localStorage`)
- Zod for dataset validation, Vitest for unit tests
- i18next / react-i18next (Spanish and English, Spanish default)

## Commands

Run from the repo root. Use the pnpm installed by mise (`mise.toml`).
Do **not** use the Windows pnpm — it writes to a `D:\pnpm` store and breaks in WSL.

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm data:fetch` — refresh raw data from valheimcheats.com
- `pnpm data:build` — normalize, derive biome/category, validate

## Architecture

- `src/routes/` — `/`, `/item/$id`, `/calculator`, `/station/$id`, `/admin`
- `src/components/` — cards, graph, calculator, biome selector
- `src/lib/` — data access, biome, categories, calculator, search, i18n
- `src/stores/` — Zustand stores (biome gate, admin overrides)
- `src/data/` — generated JSON (do not edit by hand) plus `overrides.json` (hand-edited, versioned)
- `scripts/` — data fetcher and normalizer
- `data/raw/` — fetched source snapshots (committed for reproducibility)

## Data pipeline

1. `scripts/fetch-data.mjs` discovers and downloads valheimcheats' JS data chunks and the trader rows from the server-rendered page.
2. `scripts/build-data.mjs` joins recipes/items/food/building, resolves IDs, derives biome/category/station groups, applies overrides, validates with Zod, and writes `src/data/*.json`.
3. Never edit generated files. Add corrections to `src/data/overrides.json` or use `/admin`.

## Invariants

- Every ingredient resolves to an item id.
- `biome(item) = max(biome(base ingredients), biome(station), trader availability)`, override wins. Upgrade-only materials do not raise an item's biome.
- Spoiler gate hides items and names when `biomeRank > selectedRank`; applies to search, graph, calculator, and individual ingredients. Upgrade targets are capped at the highest level whose materials are visible.
- Cost at level L = base `amount` + `amountPerLevel` × (L − 1). The upgrade delta from C to T = `amountPerLevel` × (T − C); the base craft is counted only when starting from 0.
- Internal `Upgrader*` resources are not displayed as materials.
- Recipes with `enabled === false` are hidden by default.
- Recursion must guard against cycles.

## Sources / attribution

- Inspiration: https://github.com/olchyk98/astroneer-resources
- Dataset/scrapers: https://github.com/XanderG2/valheim-stats — its `crafting.json` is stale and incomplete; do not use it as the source
- Primary data: https://valheimcheats.com (unofficial fan reference)
- Verification: https://valheim.fandom.com/wiki/Valheim_Wiki
- Future game dump: https://github.com/Valheim-Modding/Jotunn
- Unusable: https://www.valheim.tools/crafting (403, Cloudflare)
- Valheim is a trademark of Coffee Stain Studios. This is an unofficial fan project. Icons and data belong to their respective owners.

## Conventions

- TypeScript strict. Avoid `any` unless unavoidable.
- UI copy lives in `src/lib/i18n.ts` (`en`/`es`, Spanish default). Dataset names and descriptions stay in their source language.
- Small focused commits.
- Never commit secrets.
- Update `docs/DATA_SOURCES.md` when a source shape changes.
