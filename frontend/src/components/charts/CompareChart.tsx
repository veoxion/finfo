'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { IndicatorWithData } from '@/lib/types'
import { formatAxisValue, formatTooltipValue } from '@/lib/formatters'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

interface Props {
  indicators: IndicatorWithData[]
}

export default function CompareChart({ indicators }: Props) {
  // 날짜를 키로 병합
  const dateMap = new Map<string, Record<string, number>>()

  indicators.forEach((ind) => {
    ind.values.forEach((v) => {
      const dateKey = v.date.slice(0, 7) // YYYY-MM
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, {})
      dateMap.get(dateKey)![ind.country] = v.value
    })
  })

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatAxisValue(v, indicators[0]?.unit ?? '')}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(value: number) => [formatTooltipValue(value, indicators[0]?.unit ?? ''), '']}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
        {indicators.map((ind, i) => (
          <Line
            key={ind.country}
            type="monotone"
            dataKey={ind.country}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
