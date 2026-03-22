'use client'

import Link from 'next/link'
import type { IndicatorWithLatest } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import { formatTooltipValue } from '@/lib/formatters'
import FavoriteButton from '@/components/dashboard/FavoriteButton'

interface Props {
  indicator: IndicatorWithLatest
}

export default function IndicatorCard({ indicator }: Props) {
  const latest = indicator.latestValue
  const prev = indicator.prevValue

  let changeDisplay: { symbol: string; text: string; color: string } | null = null
  if (latest && prev) {
    const diff = latest.value - prev.value
    if (diff !== 0) {
      const isPercentUnit = indicator.unit.includes('%')
      const symbol = diff > 0 ? '▲' : '▼'
      const color = diff > 0 ? 'text-red-400' : 'text-blue-400'
      let text: string
      if (isPercentUnit) {
        text = `${Math.abs(diff).toFixed(2)}%p`
      } else {
        const changeRate = (diff / Math.abs(prev.value)) * 100
        text = `${Math.abs(changeRate).toFixed(2)}%`
      }
      changeDisplay = { symbol, text, color }
    }
  }

  return (
    <Link href={`/indicators/${indicator.code}`}>
      <div className="rounded-xl bg-[#1e293b] p-4 sm:p-5 transition hover:bg-[#273549] cursor-pointer border border-slate-700 hover:border-blue-500/50">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {CATEGORY_LABELS[indicator.category]} · {indicator.country}
            </span>
            <h3 className="mt-1 text-sm font-semibold text-slate-200">
              {indicator.nameKo ?? indicator.name}
            </h3>
          </div>
          <FavoriteButton code={indicator.code} size="sm" />
        </div>

        {latest ? (
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">
              {formatTooltipValue(latest.value, indicator.unit)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-slate-500">
                {new Date(latest.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} 기준
              </p>
              {changeDisplay && (
                <span className={`text-xs font-medium ${changeDisplay.color}`}>
                  {changeDisplay.symbol} {changeDisplay.text}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">데이터 없음</p>
        )}
      </div>
    </Link>
  )
}
