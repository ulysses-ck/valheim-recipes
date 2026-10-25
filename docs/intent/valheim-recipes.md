# Intent — valheim-recipes

Confirmed 2026-10-25.

## Outcome
A multi-route Valheim recipe graph plus material calculator.

- Browse by category: food/drinks, armor, weapons and tools (melee, ranged, magic, grapple, harpoon), construction.
- The crafting station is a badge on the card, not a filter. Building pieces carry the Hammer badge.
- Clicking an ingredient expands its recipe as a graph.
- Calculator: item + quantity → base crafting cost and upgrade delta (current level → target level, increments only, per-level breakdown). Recursive materials down to raw, with a toggle for intermediates.
- Anti-spoiler: a global biome selector hides everything from later biomes, names included. It applies to the catalog, search, graph, and calculator. Trader items (Haldor, Hildir, Bog Witch) are gated too.
- Clicking a station opens its card and links its upgrade extensions, where the player can see the ingredients needed to upgrade that station.

## User
The owner edits data locally; the community consumes the public site.

## Why
Replace back-and-forth wiki lookups with one tool. The Astroneer recipe-book format proved the idea.

## Success
- With the selector on Black Forest, nothing from Swamp onward appears.
- Calculating an Iron mace to level 4 (delta) shows the raw iron total and the per-level breakdown.
- The local admin panel corrects data and exports `overrides.json`.

## Constraint
- TanStack Start + React Flow.
- Static dataset scraped from valheimcheats.com; no game dependency.
- Biome derived from materials/station/traders plus manual overrides.
- No database or auth.
- Icons from the source; placeholder when missing.
- i18n scaffolded in English; Spanish later.
- Deploy on Vercel; public repo `valheim-recipes`.

## Out of scope (later phases)
- Combat/armor stats (later phase).
- Public editing.
- Dumping the game data (phase 2).
- Station upgrade costs as a calculator (shown only through the station card).
