# valheim-recipes

A recipe graph and material calculator for **Valheim**.

Search any item, expand its ingredients as a graph, and calculate the raw materials needed to craft it or upgrade it — while hiding everything from biomes you have not reached yet.

## Features

- **Recipe graph** — click an ingredient to expand its own recipe.
- **Categories** — food/drinks, armor, weapons and tools (melee, ranged, magic, grapple, harpoon), construction.
- **Spoiler-safe biome gate** — pick the biome you are in; later-biome items and names disappear from the catalog, search, graph, and calculator.
- **Material calculator** — base crafting cost and upgrade delta (current level → target level), with a per-level breakdown.
- **Recursive materials** — resolve to raw materials, with a toggle to show intermediates.
- **Stations** — station badge on every card; click it to see the station card and its upgrade extensions with their build costs.
- **Traders** — Haldor, Hildir, and the Bog Witch inventories gated by progression.
- **Local corrections** — `/admin` applies versioned overrides in the browser; download the JSON to commit it. No database or auth.

## Stack

TanStack Start + React 19 + Vite + Tailwind CSS v4, `@xyflow/react` for the graph, Zustand, Zod, Vitest, i18next.

## Development

```bash
pnpm install
pnpm dev
```

Use the pnpm provided by mise (`mise.toml`). Do not use the Windows pnpm from WSL.

Data commands:

```bash
pnpm data:fetch   # refresh raw snapshots from valheimcheats.com
pnpm data:build   # normalize, derive, validate
pnpm test         # calculator, gate, and data-shape tests
pnpm typecheck
pnpm lint
pnpm build
```

## Data

The dataset is fetched from [valheimcheats.com](https://valheimcheats.com), an unofficial fan reference. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for the exact chunks, shapes, and caveats.

The project is inspired by [astroneer-resources](https://github.com/olchyk98/astroneer-resources). Earlier work on Valheim material lists lives in [valheim-stats](https://github.com/XanderG2/valheim-stats); its `crafting.json` is stale and incomplete, so it is not used as the primary source. A future version may dump recipes directly from the game with [Jotunn](https://github.com/Valheim-Modding/Jotunn).

## Deployment

Vercel. The scaffold ships with `vercel.json`.

## License / attribution

Unofficial fan project. Valheim is a trademark of Coffee Stain Studios. Game data, names, and icons belong to their respective owners and are used for identification and reference only.
