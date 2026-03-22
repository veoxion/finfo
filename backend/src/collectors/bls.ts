import { BaseCollector, CollectedData } from './base.js'

interface BlsDataPoint {
  year: string
  period: string
  periodName: string
  value: string
  footnotes: object[]
}

interface BlsSeries {
  seriesID: string
  data: BlsDataPoint[]
}

interface BlsResponse {
  status: string
  Results: {
    series: BlsSeries[]
  }
}

const SERIES = [
  { code: 'BLS_UNRATE',            seriesId: 'LNS14000000' }, // 미국 실업률
  { code: 'BLS_NONFARM_PAYROLL',   seriesId: 'CES0000000001' }, // 미국 비농업 고용자수
  { code: 'BLS_AVG_HOURLY_EARNINGS', seriesId: 'CES0500000003' }, // 미국 평균 시간당 임금
]

export class BlsCollector extends BaseCollector {
  private readonly apiKey: string

  constructor() {
    super('bls', 'https://api.bls.gov/publicAPI/v2')
    const apiKey = process.env.BLS_API_KEY
    if (!apiKey) throw new Error('BLS_API_KEY is not set')
    this.apiKey = apiKey
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []

    const currentYear = new Date().getFullYear()
    const startYear = String(currentYear - 10)
    const endYear = String(currentYear)

    const seriesIdToCode = Object.fromEntries(
      SERIES.map(({ code, seriesId }) => [seriesId, code])
    )

    const res = await this.withRetry(() =>
      this.http.post<BlsResponse>('/timeseries/data/', {
        seriesid: SERIES.map((s) => s.seriesId),
        startyear: startYear,
        endyear: endYear,
        registrationkey: this.apiKey,
      })
    )

    if (res.data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`[bls] API returned status: ${res.data.status}`)
    }

    for (const series of res.data.Results.series) {
      const code = seriesIdToCode[series.seriesID]
      if (!code) continue

      for (const point of series.data) {
        // M13 = 연간 평균 → 제외
        if (point.period === 'M13') continue

        // value가 "-" 이면 skip
        if (point.value === '-') continue

        const value = parseFloat(point.value)
        if (isNaN(value)) continue

        // period: M01~M12 → YYYY-MM-01
        const month = point.period.replace('M', '')
        const date = new Date(`${point.year}-${month}-01`)

        results.push({ indicatorCode: code, date, value })
      }
    }

    return results
  }
}
