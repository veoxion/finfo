'use client'

import { useIndicators } from '@/hooks/useIndicators'
import IndicatorCard from './IndicatorCard'

interface Props {
  country?: string
  category?: string
  title: string
}

export default function DashboardGrid({ country, category, title }: Props) {
  const { data, isLoading, error } = useIndicators({ country, category })

  if (isLoading) {
    return (
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-300">{title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[#1e293b]" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !data?.length) return null

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-slate-300">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </section>
  )
}
