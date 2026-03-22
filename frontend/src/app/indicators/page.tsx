'use client'

import { useState, useMemo } from 'react'
import { useIndicators } from '@/hooks/useIndicators'
import IndicatorCard from '@/components/dashboard/IndicatorCard'
import SearchBar from '@/components/search/SearchBar'
import FilterBar from '@/components/search/FilterBar'

export default function IndicatorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  const { data: indicators, isLoading, isError } = useIndicators()

  const filtered = useMemo(() => {
    if (!indicators) return []

    return indicators.filter((indicator) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !query ||
        (indicator.nameKo ?? '').toLowerCase().includes(query) ||
        indicator.name.toLowerCase().includes(query)

      const matchesCategory = !selectedCategory || indicator.category === selectedCategory
      const matchesCountry = !selectedCountry || indicator.country === selectedCountry

      return matchesSearch && matchesCategory && matchesCountry
    })
  }, [indicators, searchQuery, selectedCategory, selectedCountry])

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">지표 탐색</h1>
        <p className="mt-1 text-sm text-slate-400">
          국내외 주요 경제 지표를 검색하고 탐색하세요.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-[#1e293b] border border-slate-700 p-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterBar
          selectedCategory={selectedCategory}
          selectedCountry={selectedCountry}
          onCategoryChange={setSelectedCategory}
          onCountryChange={setSelectedCountry}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400">지표를 불러오는 중...</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20">
          <p className="text-red-400">데이터를 불러오는 데 실패했습니다.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="mb-4 h-12 w-12 text-slate-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <p className="text-slate-400">검색 결과가 없습니다.</p>
          <p className="mt-1 text-sm text-slate-600">다른 검색어나 필터를 시도해 보세요.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <p className="mb-4 text-xs text-slate-500">총 {filtered.length}개 지표</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
