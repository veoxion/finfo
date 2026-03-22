'use client'

import {
  ComposedChart,
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

interface Props {
  ind1: IndicatorWithData
  ind2: IndicatorWithData
}

interface MergedDataPoint {
  date: string
  value1: number | null
  value2: number | null
}

function toYearMonth(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function mergeData(ind1: IndicatorWithData, ind2: IndicatorWithData): MergedDataPoint[] {
  const map1 = new Map<string, number>()
  const map2 = new Map<string, number>()

  for (const v of ind1.values) {
    map1.set(toYearMonth(v.date), v.value)
  }
  for (const v of ind2.values) {
    map2.set(toYearMonth(v.date), v.value)
  }

  const allDates = Array.from(new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())])).sort()

  return allDates.map((date) => ({
    date,
    value1: map1.has(date) ? map1.get(date)! : null,
    value2: map2.has(date) ? map2.get(date)! : null,
  }))
}

const COLOR_1 = '#3b82f6'
const COLOR_2 = '#f59e0b'

export default function OverlayChart({ ind1, ind2 }: Props) {
  const chartData = mergeData(ind1, ind2)

  const label1 = ind1.nameKo ?? ind1.name
  const label2 = ind2.nameKo ?? ind2.name

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 70, left: 70, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={{ fill: COLOR_1, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatAxisValue(v, ind1.unit)}
          width={70}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: COLOR_2, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatAxisValue(v, ind2.unit)}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
          }}
          labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
          formatter={(value: unknown, name: string) => {
            if (value === null || value === undefined) return ['-', name]
            const num = Number(value)
            if (name === label1) return [formatTooltipValue(num, ind1.unit), name]
            if (name === label2) return [formatTooltipValue(num, ind2.unit), name]
            return [String(value), name]
          }}
        />
        <Legend
          wrapperStyle={{ color: '#94a3b8', fontSize: 13, paddingTop: 12 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="value1"
          name={label1}
          stroke={COLOR_1}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: COLOR_1 }}
          connectNulls={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="value2"
          name={label2}
          stroke={COLOR_2}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: COLOR_2 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
