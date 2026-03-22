'use client'

import { useFavorites } from '@/hooks/useFavorites'
import { useIndicators } from '@/hooks/useIndicators'
import IndicatorCard from '@/components/dashboard/IndicatorCard'

export default function FavoritesPage() {
  const { favorites } = useFavorites()
  const { data: indicators, isLoading } = useIndicators()

  const favoriteIndicators = indicators?.filter((ind) =>
    favorites.includes(ind.code),
  ) ?? []

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-100">즐겨찾기</h1>

      {isLoading ? (
        <p className="text-slate-400">불러오는 중...</p>
      ) : favorites.length === 0 ? (
        <div className="rounded-xl bg-[#1e293b] border border-slate-700 p-10 text-center">
          <p className="text-slate-400">
            즐겨찾기한 지표가 없습니다. 지표 카드의 ★ 버튼을 눌러 추가하세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteIndicators.map((indicator) => (
            <IndicatorCard key={indicator.code} indicator={indicator} />
          ))}
        </div>
      )}
    </main>
  )
}
