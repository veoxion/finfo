import { BaseCollector, CollectedData } from './base.js'

interface FredObservation {
  date: string
  value: string
}

interface FredResponse {
  observations: FredObservation[]
}

const SERIES = [
  { code: 'FRED_FEDFUNDS', seriesId: 'FEDFUNDS' },   // 미국 기준금리
  { code: 'FRED_CPIAUCSL', seriesId: 'CPIAUCSL' },   // 미국 CPI
  { code: 'FRED_GDP',      seriesId: 'GDP' },          // 미국 GDP (분기)
  { code: 'FRED_UNRATE',   seriesId: 'UNRATE' },      // 미국 실업률
  { code: 'FRED_DGS10',    seriesId: 'DGS10' },       // 미국 10년 국채금리
]

export class FredCollector extends BaseCollector {
  private readonly apiKey: string

  constructor() {
    super('fred', 'https://api.stlouisfed.org/fred')
    const apiKey = process.env.FRED_API_KEY
    if (!apiKey) throw new Error('FRED_API_KEY is not set')
    this.apiKey = apiKey
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []

    for (const { code, seriesId } of SERIES) {
      const observations = await this.withRetry(() => this.fetchSeries(seriesId))
      for (const obs of observations) {
        const value = parseFloat(obs.value)
        if (!isNaN(value)) {
          results.push({ indicatorCode: code, date: new Date(obs.date), value })
        }
      }
      await this.sleep(100)
    }

    return results
  }

  private async fetchSeries(seriesId: string): Promise<FredObservation[]> {
    const res = await this.http.get<FredResponse>('/series/observations', {
      params: {
        series_id: seriesId,
        api_key: this.apiKey,
        file_type: 'json',
        observation_start: '2000-01-01',
        sort_order: 'desc',
        limit: 60,
      },
    })
    return res.data.observations
  }
}
