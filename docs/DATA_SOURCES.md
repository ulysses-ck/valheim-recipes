# Data sources

## Primary: valheimcheats.com

`valheimcheats.com` is a client-rendered TanStack Start app. Most data is embedded in versioned JS chunks, and the trader table is server-rendered into the page.

### Discovering the chunks

1. Fetch any detail page, e.g. `https://valheimcheats.com/recipe/maceiron`.
2. Extract the main bundle path: `/assets/index-<hash>.js`.
3. Fetch it and find dynamic imports: `import("./<name>-<hash>.js")`.
4. Pick the data chunks by name. They parse a JSON string at module scope and export it as default:

```js
const e = JSON.parse('[...]');
export { e as default };
```

Hashes change on every deploy, so discover them at runtime instead of hardcoding.

### Chunks used

| Chunk | Approx. size | Entries | Shape |
|---|---|---|---|
| `recipe-*.js` | 182 KB | 479 | `id`, `item`, `amount`, `craftingStation`, `minStationLevel`, `enabled`, `noCraftOnlyUpgrade`, `resources[{item, amount, amountPerLevel}]`, `stationName` |
| `building-piece-*.js` | 148 KB | 497 | `id`, `name`, `nameToken`, `category`, `comfort`, `resources[{item, amount, amountPerLevel}]`, `health`, `isCraftingStation`, `icon` |
| `item-*.js` | 466 KB | 1597 | `slug`, `name`, `id`, `category[]`, `subcategory[]`, `game_description`, `description`, `has_image` |
| `food-*.js` | 53 KB | 119 | `id`, `name`, food stats (`health`, `stamina`, `eitr`, `duration`, `regen`, `isDrink`), `maxQuality`, `icon` |
| `item-images-*.js` | 18 KB | — | array of icon slugs |
| `building-piece-images-*.js` | 10 KB | — | array of icon slugs |

Notes:

- `amountPerLevel` is the upgrade increment. It is the field that `valheim-stats/crafting.json` loses.
- `resources` may include internal `Upgrader*` items (e.g. `Upgrader2Weapon`). These are station-upgrade tokens, not player materials; filter them from display and calculation.
- `enabled === false` recipes are not shown by default.
- `noCraftOnlyUpgrade` marks recipes that only exist as upgrades.
- `craftingStation` uses piece ids (`forge`, `blackforge`, `piece_cauldron`); `stationName` is the display name.
- Station upgrade extensions are building pieces whose id starts with the station id (`forge_ext1` … `forge_ext6`, `piece_workbench_ext1` …). Their `resources` are the station upgrade costs.
- There is **no biome field**. Biome must be derived from materials/station/trader availability, with manual overrides. A few item `description` strings mention a biome ("Swamp-era"), but it is not structured.

### Traders

The `/traders` page server-renders only the first 12 table rows, but the TanStack Start payload contains all **69** rows:

```js
{id:"BogWitch-0", group:"Bog Witch", cells:{
  trader:{links:[{name:"Bog Witch"}]},
  item:{links:[{name:"Candle Wick", href:"/item/candlewick", image:"/img/item/candlewick.webp", amount:50}]},
  cost:{text:"100 coins"},
  unlock:{text:"Available immediately"}
}}
```

Rows exist for `Haldor` (11), `Hildir` (38), and `Bog Witch` (20). The `unlock` text is a `global key` such as `Defeat The Elder`; map it to a biome/progression gate.

### Icons

Icons are served from:

- `https://valheimcheats.com/img/item/<slug>.webp`
- `https://valheimcheats.com/img/building-piece/<slug>.webp`

Download them at fetch time into `public/icons/`. Use a placeholder when a file is missing.

## Other sources

- [valheim-stats](https://github.com/XanderG2/valheim-stats) — useful as a reference for scraping, but `data/crafting.json` is incomplete and wrong for upgrades (e.g. Iron mace `Iron: 1` versus the real `20 (+10/lvl)`). Do not use it as the dataset.
- [Valheim Fandom](https://valheim.fandom.com/wiki/Valheim_Wiki) — optional verification source. Fetchable.
- [valheim.tools/crafting](https://www.valheim.tools/crafting) — returns **403** (Cloudflare). Not usable for automated fetching.
- [Jotunn](https://github.com/Valheim-Modding/Jotunn) — a modding library, not a dataset. Planned for a future in-game dump.

## Licensing

Unofficial fan project. Valheim is a trademark of Coffee Stain Studios. Game data, names, and icons belong to their respective owners and are used for identification and reference only.
