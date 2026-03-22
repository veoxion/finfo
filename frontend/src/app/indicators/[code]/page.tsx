'use client'

import { useState } from 'react'
import { useIndicator, useCompareData } from '@/hooks/useIndicators'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart'
import CompareChart from '@/components/charts/CompareChart'
import { SOURCE_ATTRIBUTION, CATEGORY_LABELS } from '@/lib/types'
import DownloadButton from '@/components/download/DownloadButton'

const PERIOD_OPTIONS = [
  { label: '1년', years: 1 },
  { label: '5년', years: 5 },
  { label: '10년', years: 10 },
  { label: '전체', years: 0 },
]

const COMPARE_COUNTRIES = ['USA', 'KOR', 'CHN', 'JPN', 'DEU']

export default function IndicatorDetailPage({ params }: { params: { code: string } }) {
  const { code } = params
  const [periodYears, setPeriodYears] = useState(5)

  const startDate = periodYears > 0
    ? new Date(Date.now() - periodYears * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : undefined

  const { data: indicator, isLoading } = useIndicator(code, { startDate })
  const { data: compareData } = useCompareData(code, COMPARE_COUNTRIES)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[#1e293b]" />
        <div className="h-72 animate-pulse rounded-xl bg-[#1e293b]" />
      </div>
    )
  }

  if (!indicator) {
    return <p className="text-slate-400">지표를 찾을 수 없습니다.</p>
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
          {CATEGORY_LABELS[indicator.category]}
        </span>
        <span className="text-xs text-slate-500">{indicator.country}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">
          {indicator.nameKo ?? indicator.name}
        </h1>
        <DownloadButton code={code} name={indicator.nameKo ?? indicator.name} />
      </div>
      {indicator.description && (
        <p className="mt-2 text-sm text-slate-400">{indicator.description}</p>
      )}

      {/* 기간 선택 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map(({ label, years }) => (
          <button
            key={label}
            onClick={() => setPeriodYears(years)}
            className={`rounded px-3 py-1 text-sm transition ${
              periodYears === years
                ? 'bg-blue-500 text-white'
                : 'bg-[#1e293b] text-slate-400 hover:bg-[#273549]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 시계열 차트 */}
      <div className="mt-4 rounded-xl bg-[#1e293b] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-300">시계열</h2>
        {indicator.values.length > 0 ? (
          <div className="h-[250px] sm:h-[300px]">
            <TimeSeriesChart data={indicator.values} unit={indicator.unit} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">데이터가 없습니다.</p>
        )}
      </div>

      {/* 국가 비교 차트 */}
      {compareData && compareData.length > 1 && (
        <div className="mt-6 rounded-xl bg-[#1e293b] p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">국가간 비교</h2>
          <div className="h-[250px] sm:h-[300px]">
            <CompareChart indicators={compareData} />
          </div>
        </div>
      )}

      {/* 데이터 테이블 */}
      <div className="mt-6 rounded-xl bg-[#1e293b] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-300">데이터 테이블</h2>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4">날짜</th>
                <th className="pb-2 pr-4">값 ({indicator.unit})</th>
              </tr>
            </thead>
            <tbody>
              {[...indicator.values].reverse().map((v) => (
                <tr key={v.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 pr-4 text-slate-400">
                    {new Date(v.date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-2 pr-4 text-white font-medium">
                    {v.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 출처 */}
      <p className="mt-4 text-xs text-slate-600">
        출처: {SOURCE_ATTRIBUTION[indicator.source] ?? indicator.source}
      </p>
    </div>
  )
}
