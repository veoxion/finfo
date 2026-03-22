'use client'

import { useState, useMemo } from 'react'

interface EconomicEvent {
  date: string
  title: string
  country: 'USA' | 'KOR' | 'GLOBAL'
  category: 'interest_rate' | 'employment' | 'cpi' | 'gdp' | 'trade'
  importance: 'high' | 'medium' | 'low'
  description: string
}

const ALL_EVENTS: EconomicEvent[] = [
  // 미국 FOMC 회의
  ...([
    '2025-03-19',
    '2025-05-07',
    '2025-06-18',
    '2025-07-30',
    '2025-09-17',
    '2025-10-29',
    '2025-12-10',
    '2026-01-28',
    '2026-03-18',
  ] as const).map((date) => ({
    date,
    title: '미국 FOMC 금리 결정',
    country: 'USA' as const,
    category: 'interest_rate' as const,
    importance: 'high' as const,
    description: '미 연준(Fed) 기준금리 결정 발표. 금융시장 전체에 가장 큰 영향을 미치는 이벤트',
  })),

  // 미국 CPI 발표
  ...([
    '2025-04-10',
    '2025-05-13',
    '2025-06-11',
    '2025-07-11',
    '2025-08-12',
    '2025-09-10',
    '2025-10-14',
    '2025-11-12',
    '2025-12-10',
    '2026-01-14',
    '2026-02-11',
    '2026-03-11',
  ] as const).map((date) => ({
    date,
    title: '미국 CPI 발표',
    country: 'USA' as const,
    category: 'cpi' as const,
    importance: 'high' as const,
    description: '미국 소비자물가지수 발표. 인플레이션 현황과 연준 정책 방향에 영향',
  })),

  // 미국 고용보고서
  ...([
    '2025-04-04',
    '2025-05-02',
    '2025-06-06',
    '2025-07-03',
    '2025-08-01',
    '2025-09-05',
    '2025-10-03',
    '2025-11-07',
    '2025-12-05',
    '2026-01-09',
    '2026-02-06',
    '2026-03-06',
  ] as const).map((date) => ({
    date,
    title: '미국 고용보고서 발표',
    country: 'USA' as const,
    category: 'employment' as const,
    importance: 'high' as const,
    description: '비농업 고용자수, 실업률 발표. 노동시장 건강성의 핵심 지표',
  })),

  // 미국 GDP 발표
  ...([
    { date: '2025-04-30', label: '1분기 예비' },
    { date: '2025-07-30', label: '2분기 예비' },
    { date: '2025-10-29', label: '3분기 예비' },
  ]).map(({ date }) => ({
    date,
    title: '미국 GDP 성장률 발표',
    country: 'USA' as const,
    category: 'gdp' as const,
    importance: 'medium' as const,
    description: '미국 분기 GDP 성장률 발표',
  })),

  // 한국은행 금통위
  ...([
    '2025-04-17',
    '2025-05-29',
    '2025-07-10',
    '2025-08-28',
    '2025-10-16',
    '2025-11-27',
    '2026-01-15',
    '2026-02-26',
  ] as const).map((date) => ({
    date,
    title: '한국은행 금통위 금리 결정',
    country: 'KOR' as const,
    category: 'interest_rate' as const,
    importance: 'high' as const,
    description: '한국은행 금융통화위원회의 기준금리 결정 발표',
  })),

  // 한국 CPI 발표
  ...([
    '2025-04-02',
    '2025-05-02',
    '2025-06-03',
    '2025-07-02',
    '2025-08-01',
    '2025-09-02',
    '2025-10-02',
    '2025-11-04',
    '2025-12-02',
    '2026-01-02',
    '2026-02-04',
    '2026-03-03',
  ] as const).map((date) => ({
    date,
    title: '한국 소비자물가지수(CPI) 발표',
    country: 'KOR' as const,
    category: 'cpi' as const,
    importance: 'medium' as const,
    description: '통계청 소비자물가지수 발표. 한국 인플레이션 현황 파악',
  })),
]

// Deduplicate events that share the same date and title (e.g. FOMC + GDP on 2025-07-30 and 2025-10-29)
const EVENTS: EconomicEvent[] = ALL_EVENTS.sort((a, b) => a.date.localeCompare(b.date))

const CATEGORY_LABELS: Record<EconomicEvent['category'], string> = {
  interest_rate: '금리',
  employment: '고용',
  cpi: '물가',
  gdp: 'GDP',
  trade: '무역',
}

const IMPORTANCE_LABELS: Record<EconomicEvent['importance'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAY_LABELS[d.getDay()]
  return `${month}월 ${day}일 ${dow}`
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${year}년 ${parseInt(month)}월`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTodayDisplay(): string {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}요일`
}

type CountryFilter = 'ALL' | 'USA' | 'KOR'
type ImportanceFilter = 'ALL' | 'high'
type CategoryFilter = 'ALL' | EconomicEvent['category']

export default function CalendarPage() {
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('ALL')
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')

  const today = todayStr()

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((e) => {
      if (countryFilter !== 'ALL' && e.country !== countryFilter) return false
      if (importanceFilter === 'high' && e.importance !== 'high') return false
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false
      return true
    })
  }, [countryFilter, importanceFilter, categoryFilter])

  const nextEvent = useMemo(() => {
    return EVENTS.find((e) => e.date >= today) ?? null
  }, [today])

  const groupedEvents = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {}
    for (const event of filteredEvents) {
      const key = getMonthKey(event.date)
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredEvents])

  const importanceBadgeClass = (importance: EconomicEvent['importance']) => {
    if (importance === 'high') return 'bg-red-500/20 text-red-400'
    if (importance === 'medium') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-slate-500/20 text-slate-400'
  }

  const countryBadgeClass = (country: EconomicEvent['country']) => {
    if (country === 'USA') return 'bg-blue-500/20 text-blue-400'
    if (country === 'KOR') return 'bg-green-500/20 text-green-400'
    return 'bg-purple-500/20 text-purple-400'
  }

  const filterBtnClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`

  const categories: { value: CategoryFilter; label: string }[] = [
    { value: 'ALL', label: '전체 카테고리' },
    { value: 'interest_rate', label: '금리' },
    { value: 'cpi', label: '물가' },
    { value: 'employment', label: '고용' },
    { value: 'gdp', label: 'GDP' },
    { value: 'trade', label: '무역' },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">경제 캘린더</h1>
        <p className="mt-1 text-sm text-slate-400">{formatTodayDisplay()} 기준</p>
      </div>

      {/* 다음 주요 이벤트 강조 박스 */}
      {nextEvent && (
        <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
            다음 주요 이벤트
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <span className="text-sm font-medium text-slate-300">
              {formatDateLabel(nextEvent.date)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${importanceBadgeClass(nextEvent.importance)}`}
            >
              {IMPORTANCE_LABELS[nextEvent.importance]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${countryBadgeClass(nextEvent.country)}`}
            >
              {nextEvent.country}
            </span>
          </div>
          <p className="mt-1 text-base font-bold text-slate-100">{nextEvent.title}</p>
          <p className="mt-0.5 text-sm text-slate-400">{nextEvent.description}</p>
        </div>
      )}

      {/* 필터 */}
      <div className="mb-6 space-y-3">
        {/* 국가 필터 */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'USA', 'KOR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={filterBtnClass(countryFilter === c)}
            >
              {c === 'ALL' ? '전체 국가' : c === 'USA' ? '미국' : '한국'}
            </button>
          ))}
          <span className="mx-1 text-slate-600">|</span>
          {(['ALL', 'high'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setImportanceFilter(i)}
              className={filterBtnClass(importanceFilter === i)}
            >
              {i === 'ALL' ? '전체 중요도' : '높음만'}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={filterBtnClass(categoryFilter === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 이벤트 목록 월별 그룹 */}
      {groupedEvents.length === 0 ? (
        <div className="rounded-xl bg-[#1e293b] border border-slate-700 p-10 text-center">
          <p className="text-slate-400">해당 조건의 이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map(([monthKey, events]) => (
            <section key={monthKey}>
              {/* 월 헤더 */}
              <h2 className="mb-3 text-lg font-semibold text-slate-200">
                {getMonthLabel(monthKey)}
              </h2>

              <div className="rounded-xl bg-[#1e293b] border border-slate-700 overflow-hidden">
                {events.map((event, idx) => {
                  const isPast = event.date < today
                  return (
                    <div
                      key={`${event.date}-${event.title}`}
                      className={`px-4 py-4 ${
                        idx !== events.length - 1 ? 'border-b border-slate-700/60' : ''
                      } ${isPast ? 'opacity-50' : ''}`}
                    >
                      {/* 모바일: 카드 형태 */}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                        {/* 날짜 */}
                        <div className="min-w-[7rem] text-sm font-medium text-slate-400 shrink-0">
                          {formatDateLabel(event.date)}
                        </div>

                        {/* 뱃지 + 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${importanceBadgeClass(event.importance)}`}
                            >
                              {IMPORTANCE_LABELS[event.importance]}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${countryBadgeClass(event.country)}`}
                            >
                              {event.country}
                            </span>
                            <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-xs text-slate-400">
                              {CATEGORY_LABELS[event.category]}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-100">{event.title}</p>
                          <p className="mt-0.5 text-sm text-slate-400">{event.description}</p>
                        </div>

                        {/* 상태 표시 */}
                        {!isPast && event.date === today && (
                          <span className="shrink-0 self-start rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                            오늘
                          </span>
                        )}
                        {!isPast && event.date !== today && (
                          <span className="shrink-0 self-start rounded-full bg-slate-600/30 px-2 py-0.5 text-xs text-slate-500">
                            예정
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
