export type Category =
  | 'gdp'
  | 'interest_rate'
  | 'cpi'
  | 'exchange_rate'
  | 'employment'
  | 'trade'
  | 'other'

export interface Indicator {
  id: string
  code: string
  name: string
  nameKo?: string
  category: Category
  unit: string
  source: string
  country: string
  description?: string
}

export interface IndicatorValue {
  id: string
  indicatorId: string
  date: string
  value: number
}

export interface IndicatorWithLatest extends Indicator {
  latestValue?: IndicatorValue
  prevValue?: IndicatorValue
}

export interface IndicatorWithData extends Indicator {
  values: IndicatorValue[]
}

export const CATEGORY_LABELS: Record<Category, string> = {
  gdp: 'GDP',
  interest_rate: '금리',
  cpi: '물가(CPI)',
  exchange_rate: '환율',
  employment: '고용',
  trade: '무역',
  other: '기타',
}

export const SOURCE_ATTRIBUTION: Record<string, string> = {
  world_bank: 'World Bank Open Data',
  fred: 'Federal Reserve Bank of St. Louis (FRED)',
  ecos: '한국은행 경제통계시스템 (ECOS)',
  kosis: '통계청 KOSIS',
  imf: 'International Monetary Fund',
  oecd: 'OECD',
}
