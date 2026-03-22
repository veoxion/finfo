'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { IndicatorValue } from '@/lib/types'
import { formatAxisValue, formatTooltipValue } from '@/lib/formatters'

interface Props {
  data: IndicatorValue[]
  unit: string
  color?: string
}

export default function TimeSeriesChart({ data, unit, color = '#3b82f6' }: Props) {
  const chartData = data.map((v) => ({
    date: new Date(v.date).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' }),
    value: v.value,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatAxisValue(v, unit)}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(value: number) => [formatTooltipValue(value, unit), '값']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
