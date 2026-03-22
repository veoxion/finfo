'use client'

import { useFavorites } from '@/hooks/useFavorites'

interface Props {
  code: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ code, size = 'md' }: Props) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(code)

  const sizeClass = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <button
      type="button"
      aria-label={active ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        toggle(code)
      }}
      className={`${sizeClass} transition-colors duration-200 ${
        active ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {active ? '★' : '☆'}
    </button>
  )
}
