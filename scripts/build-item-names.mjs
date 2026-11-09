import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const rawDir = path.join(root, 'data', 'raw')
const dataDir = path.join(root, 'src', 'data')
const localizationPath = path.join(rawDir, 'localization.json')
const outputPath = path.join(dataDir, 'item-names.es.json')

const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'))

if (!fs.existsSync(localizationPath)) {
  throw new Error(
    'Missing data/raw/localization.json. Run `node scripts/fetch-localization.mjs` first.',
  )
}

const localization = JSON.parse(fs.readFileSync(localizationPath, 'utf8'))
const foods = JSON.parse(
  fs.readFileSync(path.join(rawDir, 'food.json'), 'utf8'),
)
const items = readJson('items.json')
const stations = readJson('stations.json')

const foodTokenById = new Map(
  foods
    .filter((food) => food.nameToken)
    .map((food) => [food.id, food.nameToken]),
)

// Item ids whose localization token does not follow the usual naming pattern.
const MANUAL_TOKENS = {
  Acorn: 'item_oakseeds',
  ArmorBronzeChest: 'item_chest_bronze',
  ArmorLeatherLegs: 'item_legs_leather',
  ArmorRagsLegs: 'item_legs_rags',
  ArmorTrollLeatherLegs: 'item_legs_trollleather',
  ArmorWolfChest: 'item_chest_wolf',
  ArmorWolfLegs: 'item_legs_wolf',
  AxeBlackMetal: 'item_axe_blackmetal',
  BowDraugrFang: 'item_bow_draugrfang',
  FineWood: 'item_finewood',
  HelmetTrollLeather: 'item_helmet_trollleather',
  KnifeBlackMetal: 'item_knife_blackmetal',
  Raft: 'ship_raft',
  RoundLog: 'item_roundlog',
  Karve: 'ship_karve',
  VikingShip: 'ship_longship',
  Drakkar: 'ship_longship_ashlands',
}

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const snake = (id) =>
  String(id)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toLowerCase()

const usable = (value) =>
  typeof value === 'string' && value.trim() && value.trim() !== 'None'

const en = localization.en
const es = localization.es

const tokensByName = new Map()
const tokensBySquashedName = new Map()
for (const [token, value] of Object.entries(en)) {
  if (!usable(value)) continue
  const key = normalize(value)
  if (!key) continue
  const list = tokensByName.get(key) ?? []
  list.push(token)
  tokensByName.set(key, list)

  const squashed = key.replace(/\s+/g, '')
  const squashedList = tokensBySquashedName.get(squashed) ?? []
  squashedList.push(token)
  tokensBySquashedName.set(squashed, squashedList)
}

const priority = (token) => {
  if (token.startsWith('item_')) return 0
  if (token.startsWith('piece_')) return 1
  if (token.startsWith('ship_')) return 2
  return 3
}

function resolveToken(id, name, tokenHint) {
  const hints = [
    tokenHint,
    MANUAL_TOKENS[id],
    id.startsWith('item_') || id.startsWith('piece_') || id.startsWith('ship_')
      ? id
      : `item_${snake(id)}`,
    `item_${String(id).toLowerCase()}`,
    `piece_${snake(id)}`,
  ].filter(usable)

  for (const token of hints) {
    if (usable(es[token])) return token
  }

  const key = normalize(name)
  const candidates = [
    ...(tokensByName.get(key) ?? []),
    ...(tokensBySquashedName.get(key.replace(/\s+/g, '')) ?? []),
  ]
  if (!candidates.length) return null
  const sorted = [...new Set(candidates)].sort(
    (a, b) => priority(a) - priority(b) || a.length - b.length,
  )
  for (const token of sorted) {
    if (usable(es[token])) return token
  }
  return null
}

const names = {}
const missing = []

const MANUAL_NAMES = {
  ArmorStand_Male: 'Soporte de armadura (variante masculina)',
  bar_ancientmetal_stack: 'Montón de metal antiguo',
  Catapult_Ammo_BloodGold: 'Carga de oro sanguino',
  darkwood_beam_67: 'Viga de madera oscura 67°',
  Fish1: 'Pez 1',
  Fish2: 'Pez 2',
  Fish3: 'Pez 3',
  Fish4_cave: 'Pez de cueva',
  Fish5: 'Pez 5',
  Fish6: 'Pez 6',
  Fish7: 'Pez 7',
  Fish8: 'Pez 8',
  Fish9: 'Pez 9',
  Fish10: 'Pez 10',
  Fish11: 'Pez 11',
  Fish12: 'Pez 12',
  guard_stone_test: 'Piedra guardiana (prueba)',
  Larva: 'Larva',
  OLD_wood_roof: 'Tejado de paja antiguo 26°',
  OLD_wood_roof_icorner: 'Esquina interior de tejado de paja antiguo 26°',
  OLD_wood_roof_ocorner: 'Esquina exterior de tejado de paja antiguo 26°',
  OLD_wood_roof_top: 'Cumbrera de tejado de paja antiguo 26°',
  OLD_wood_wall_roof: 'Muro de tejado de madera antiguo 26°',
  piece_remove_feaster: 'Quitar',
  Pot_Shard_Red: 'Fragmento de olla roja',
  ship_construction: 'Construcción de barco',
  siege_wall_1x1: 'Muro de asedio 1x1',
  turf_roof: 'Tejado de césped',
  turf_roof_top: 'Cumbrera de césped',
  turf_roof_wall: 'Muro de tejado de césped',
}

function addEntry(id, name, tokenHint) {
  const manual = MANUAL_NAMES[id]
  if (manual) {
    names[id] = manual
    return
  }
  const token = resolveToken(id, name, tokenHint)
  if (!token) {
    missing.push({ id, name })
    return
  }
  names[id] = es[token]
}

for (const item of items) {
  addEntry(item.id, item.name, foodTokenById.get(item.id))
}

for (const station of stations) {
  addEntry(station.id, station.name, station.id)
  for (const extension of station.extensions ?? []) {
    addEntry(extension.id, extension.name, `piece_${extension.id}`)
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(names, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      translated: Object.keys(names).length,
      missing: missing.length,
      output: path.relative(root, outputPath),
      missingSample: missing.slice(0, 40),
    },
    null,
    2,
  ),
)
