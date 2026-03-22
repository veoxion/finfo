'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'finfo_favorites'

function loadFromStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    setFavorites(loadFromStorage())
  }, [])

  const toggle = useCallback((code: string) => {
    setFavorites((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (code: string) => favorites.includes(code),
    [favorites],
  )

  return { favorites, toggle, isFavorite }
}
