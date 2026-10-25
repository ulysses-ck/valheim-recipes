import fs from 'node:fs'

const url = 'https://valheimcheats.com/traders'

function findMatchingBrace(text, start) {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function assignedObject(obj, key) {
  const match = new RegExp(`${key}:\\$R\\[\\d+\\]=`).exec(obj)
  if (!match) return ''
  const start = obj.indexOf('{', match.index)
  if (start === -1) return ''
  const end = findMatchingBrace(obj, start)
  return end === -1 ? '' : obj.slice(start, end + 1)
}

const text = (block) => block.match(/text:"([^"]+)"/)?.[1] ?? ''
const firstName = (block) => block.match(/name:"([^"]+)"/)

const html = await (await fetch(url)).text()
const marker = /\{id:"([^"]+)",group:"([^"]+)",cells:/g
const rows = []
let match
while ((match = marker.exec(html))) {
  const start = match.index
  const end = findMatchingBrace(html, start)
  if (end === -1) continue
  const obj = html.slice(start, end + 1)
  const traderBlock = assignedObject(obj, 'trader')
  const itemBlock = assignedObject(obj, 'item')
  const costBlock = assignedObject(obj, 'cost')
  const unlockBlock = assignedObject(obj, 'unlock')

  const itemLink = itemBlock.match(/name:"([^"]+)",href:"([^"]+)"/)
  const unlockLink = unlockBlock.match(/name:"([^"]+)",href:"([^"]+)"/)

  rows.push({
    id: match[1],
    trader: firstName(traderBlock)?.[1] ?? match[2],
    itemName: itemLink?.[1] ?? '',
    itemHref: itemLink?.[2] ?? '',
    itemImage: itemBlock.match(/image:"([^"]+)"/)?.[1] ?? '',
    amount: Number(itemBlock.match(/amount:(\d+)/)?.[1] ?? 1),
    price: text(costBlock),
    unlock: text(unlockBlock) || firstName(unlockBlock)?.[1] || '',
    unlockHref: unlockLink?.[2] ?? '',
  })
}

fs.mkdirSync('data/raw', { recursive: true })
fs.writeFileSync('data/raw/traders.json', JSON.stringify(rows, null, 2))
const byTrader = rows.reduce((acc, row) => {
  acc[row.trader] = (acc[row.trader] ?? 0) + 1
  return acc
}, {})
console.log({ rows: rows.length, byTrader })
