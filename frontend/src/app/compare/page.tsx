'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useIndicators, useIndicator } from '@/hooks/useIndicators'
import OverlayChart from '@/components/charts/OverlayChart'

const DEFAULT_CODE_1 = 'FRED_FEDFUNDS'
const DEFAULT_CODE_2 = 'FRED_CPIAUCSL'

export default function ComparePage() {
  const { data: indicators, isLoading: listLoading } = useIndicators()

  const [code1, setCode1] = useState(DEFAULT_CODE_1)
  const [code2, setCode2] = useState(DEFAULT_CODE_2)

  const resolvedCode1 =
    code1 || (indicators && indicators[0] ? indicators[0].code : '')
  const resolvedCode2 =
    code2 || (indicators && indicators[1] ? indicators[1].code : '')

  const { data: ind1, isLoading: loading1 } = useIndicator(resolvedCode1)
  const { data: ind2, isLoading: loading2 } = useIndicator(resolvedCode2)

  const isLoading = loading1 || loading2

  const selectStyle =
    'bg-[#1e293b] border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">지표 비교</h1>
        <p className="mt-1 text-sm text-slate-400">
          두 지표를 선택하면 하나의 차트에서 시계열을 비교할 수 있습니다.
        </p>
      </div>

      {/* 지표 선택 드롭다운 */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-[#1e293b] border border-slate-700 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-slate-400">지표 1 (파란색)</label>
          <select
            className={selectStyle}
            value={code1}
            onChange={(e) => setCode1(e.target.value)}
            disabled={listLoading}
          >
            {listLoading && <option value="">불러오는 중...</option>}
            {indicators?.map((ind) => (
              <option key={ind.code} value={ind.code}>
                {ind.nameKo ?? ind.name} ({ind.country})
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:flex items-center justify-center px-2 text-slate-500 text-lg font-bold">
          vs
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-slate-400">지표 2 (주황색)</label>
          <select
            className={selectStyle}
            value={code2}
            onChange={(e) => setCode2(e.target.value)}
            disabled={listLoading}
          >
            {listLoading && <option value="">불러오는 중...</option>}
            {indicators?.map((ind) => (
              <option key={ind.code} value={ind.code}>
                {ind.nameKo ?? ind.name} ({ind.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 선택된 지표 뱃지 */}
      {(ind1 || ind2) && !isLoading && (
        <div className="mb-4 flex flex-wrap gap-2">
          {ind1 && (
            <Link
              href={`/indicators/${ind1.code}`}
              className="flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/20 transition"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              {ind1.nameKo ?? ind1.name}
              <span className="ml-1 text-blue-500/60">&rarr;</span>
            </Link>
          )}
          {ind2 && (
            <Link
              href={`/indicators/${ind2.code}`}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 hover:bg-amber-500/20 transition"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              {ind2.nameKo ?? ind2.name}
              <span className="ml-1 text-amber-500/60">&rarr;</span>
            </Link>
          )}
        </div>
      )}

      {/* 차트 영역 */}
      <div className="rounded-xl bg-[#1e293b] border border-slate-700 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-700" />
            <div className="h-96 animate-pulse rounded-lg bg-slate-700/50" />
          </div>
        ) : ind1 && ind2 ? (
          <>
            <h2 className="mb-4 text-sm font-semibold text-slate-300">오버레이 차트</h2>
            {ind1.values.length === 0 && ind2.values.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-500">데이터가 없습니다.</p>
            ) : (
              <OverlayChart ind1={ind1} ind2={ind2} />
            )}
          </>
        ) : (
          <p className="py-20 text-center text-sm text-slate-500">
            두 지표를 선택하면 차트가 표시됩니다.
          </p>
        )}
      </div>

      {/* 지표 상세 카드 링크 */}
      {!isLoading && ind1 && ind2 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { ind: ind1, color: 'blue' as const },
            { ind: ind2, color: 'amber' as const },
          ].map(({ ind, color }) => {
            const borderClass =
              color === 'blue' ? 'border-blue-500/30' : 'border-amber-500/30'
            const textClass = color === 'blue' ? 'text-blue-400' : 'text-amber-400'
            const dotClass = color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'

            return (
              <Link
                key={ind.code}
                href={`/indicators/${ind.code}`}
                className={`flex items-start gap-3 rounded-xl border ${borderClass} bg-[#1e293b] p-4 hover:bg-[#273549] transition`}
              >
                <span className={`mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotClass}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${textClass}`}>
                    {ind.nameKo ?? ind.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {ind.country} · {ind.unit} · {ind.source.toUpperCase()}
                  </p>
                  {ind.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{ind.description}</p>
                  )}
                  <p className={`mt-2 text-xs ${textClass} opacity-70`}>상세 페이지 보기 &rarr;</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
