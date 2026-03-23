'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBriefing } from '@/lib/api'
import { useState } from 'react'

function BriefingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="h-4 w-full rounded bg-slate-700" />
      <div className="h-4 w-5/6 rounded bg-slate-700" />
      <div className="h-4 w-full rounded bg-slate-700" />
      <div className="h-4 w-2/3 rounded bg-slate-700" />
    </div>
  )
}

export default function BriefingPage() {
  const queryClient = useQueryClient()
  const [refreshNotice, setRefreshNotice] = useState(false)

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['briefing'],
    queryFn: getBriefing,
    staleTime: 1000 * 60 * 60 * 6, // 6시간
    gcTime: 1000 * 60 * 60 * 6, // 6시간 동안 캐시 유지 (기본 5분이면 페이지 이탈 후 캐시 소멸)
    refetchOnWindowFocus: false,
  })

  const handleRefresh = async () => {
    const previousData = queryClient.getQueryData(['briefing'])
    await queryClient.invalidateQueries({ queryKey: ['briefing'] })
    // 캐시가 아직 유효하면 같은 데이터가 반환될 수 있음을 안내
    const newData = queryClient.getQueryData(['briefing'])
    if (previousData && newData && JSON.stringify(previousData) === JSON.stringify(newData)) {
      setRefreshNotice(true)
      setTimeout(() => setRefreshNotice(false), 5000)
    }
  }

  const formatGeneratedAt = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI 경제 브리핑</h1>
          <p className="mt-1 text-sm text-slate-400">
            최신 경제 지표를 기반으로 Groq AI가 생성한 한국어 경제 브리핑입니다.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="ml-4 flex-shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFetching ? '갱신 중...' : '갱신 요청'}
        </button>
      </div>

      {refreshNotice && (
        <div className="mb-4 rounded-lg border border-amber-700 bg-amber-900/30 px-4 py-3 text-sm text-amber-300">
          서버 캐시가 아직 유효합니다 (6시간 단위 갱신). 이전과 동일한 브리핑이 표시될 수 있습니다.
        </div>
      )}

      {/* 브리핑 카드 */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        {isLoading ? (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">AI가 경제 지표를 분석하고 있습니다...</p>
            <BriefingSkeleton />
          </div>
        ) : isError ? (
          <p className="text-red-400">브리핑을 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : data ? (
          <>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{data.text}</p>
            <p className="mt-6 text-xs text-slate-500">
              생성 시각: {formatGeneratedAt(data.generatedAt)}
            </p>
          </>
        ) : null}
      </div>

      {/* 분석에 사용된 지표 */}
      {data && data.indicators.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-200">분석에 사용된 지표</h2>
          <ul className="divide-y divide-slate-700">
            {data.indicators.map((ind) => (
              <li key={ind.code} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-300">{ind.nameKo}</span>
                {ind.latestValue ? (
                  <span className="text-sm font-medium text-slate-100">
                    {ind.latestValue.value.toLocaleString()}{' '}
                    <span className="text-xs text-slate-500">
                      ({new Date(ind.latestValue.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                      })})
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">데이터 없음</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
