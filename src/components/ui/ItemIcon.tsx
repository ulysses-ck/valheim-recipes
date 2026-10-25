import { useState } from 'react'
import { resolveIcon } from '../../lib/icons'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASS: Record<IconSize, string> = {
  xs: 'h-6 w-6 text-[0.65rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

interface ItemIconProps {
  icon: string | null | undefined
  size?: IconSize
  className?: string
}

export function ItemIcon({ icon, size = 'md', className = '' }: ItemIconProps) {
  const [failed, setFailed] = useState(false)
  const src = resolveIcon(icon)

  return (
    <span
      className={`icon-frame ${SIZE_CLASS[size]} ${className}`}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="icon-fallback">ᛟ</span>
      )}
    </span>
  )
}
