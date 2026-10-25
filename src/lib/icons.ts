const ASSET_HOST = 'https://valheimcheats.com'

export function resolveIcon(icon: string | null | undefined): string | null {
  if (!icon) return null
  if (/^https?:\/\//i.test(icon)) return icon
  if (icon.startsWith('/icons/item/')) {
    return `${ASSET_HOST}/img/item/${icon.slice('/icons/item/'.length)}`
  }
  if (icon.startsWith('/icons/building-piece/')) {
    return `${ASSET_HOST}/img/building-piece/${icon.slice(
      '/icons/building-piece/'.length,
    )}`
  }
  if (icon.startsWith('/img/')) return `${ASSET_HOST}${icon}`
  if (icon.startsWith('/')) return icon
  return `${ASSET_HOST}/img/item/${icon}`
}

export function buildingIcon(id: string): string {
  return `/icons/building-piece/${id.toLowerCase()}.webp`
}
