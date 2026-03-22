'use client'

const CATEGORIES = [
  { label: '전체', value: '' },
  { label: 'GDP', value: 'gdp' },
  { label: '금리', value: 'interest_rate' },
  { label: 'CPI', value: 'cpi' },
  { label: '환율', value: 'exchange_rate' },
  { label: '고용', value: 'employment' },
  { label: '무역', value: 'trade' },
]

const COUNTRIES = [
  { label: '전체', value: '' },
  { label: '한국', value: 'KOR' },
  { label: '미국', value: 'USA' },
  { label: '중국', value: 'CHN' },
  { label: '일본', value: 'JPN' },
  { label: '독일', value: 'DEU' },
]

interface Props {
  selectedCategory: string
  selectedCountry: string
  onCategoryChange: (value: string) => void
  onCountryChange: (value: string) => void
}

export default function FilterBar({
  selectedCategory,
  selectedCountry,
  onCategoryChange,
  onCountryChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-12 shrink-0">카테고리</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === cat.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1e293b] text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-12 shrink-0">국가</span>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((country) => (
            <button
              key={country.value}
              onClick={() => onCountryChange(country.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCountry === country.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1e293b] text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {country.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
