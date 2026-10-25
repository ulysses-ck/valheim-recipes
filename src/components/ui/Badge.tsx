import type { ReactNode } from 'react'
import { BIOME_BADGE, formatBiome } from '../../lib/format'
import type { BiomeId } from '../../lib/types'

interface BadgeProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Badge({ children, className = '', title }: BadgeProps) {
  return (
    <span className={`badge ${className}`} title={title}>
      {children}
    </span>
  )
}

export function BiomeBadge({
  biome,
  className = '',
}: {
  biome: BiomeId
  className?: string
}) {
  return (
    <span className={`badge ${BIOME_BADGE[biome]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatBiome(biome)}
    </span>
  )
}
