export function slugify(value) {
  return String(value ?? '')
    .replace(/['’]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function prettifyId(value) {
  const text = String(value ?? '')
    .replace(/^piece_/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.replace(/\b\w/g, (letter) => letter.toUpperCase()) : ''
}

export function fallbackName(itemId) {
  return prettifyId(itemId) || String(itemId ?? '')
}
