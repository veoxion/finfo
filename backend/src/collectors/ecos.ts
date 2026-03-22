import { BaseCollector, CollectedData } from './base.js'

interface EcosItem {
  TIME: string
  DATA_VALUE: string
}

interface EcosResponse {
  StatisticSearch: {
    row: EcosItem[]
  }
}

const SERIES = [
  { code: 'ECOS_BASE_RATE', statCode: '722Y001', cycle: 'M', itemCode1: '0101000' }, // 한국은행 기준금리 (월)
  { code: 'ECOS_USD_KRW',   statCode: '731Y001', cycle: 'D', itemCode1: '0000001' }, // 원달러 환율 (일별→월평균 집계)
  { code: 'ECOS_CPI',       statCode: '901Y009', cycle: 'M', itemCode1: '0' },       // 소비자물가지수 (월)
]

export class EcosCollector extends BaseCollector {
  private readonly apiKey: string

  constructor() {
    super('ecos', 'https://ecos.bok.or.kr/api')
    const apiKey = process.env.ECOS_API_KEY
    if (!apiKey) throw new Error('ECOS_API_KEY is not set')
    this.apiKey = apiKey
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []

    for (const { code, statCode, cycle, itemCode1 } of SERIES) {
      const rows = await this.withRetry(() => this.fetchSeries(statCode, cycle, itemCode1))

      if (cycle === 'D') {
        // 일별 → 월평균 집계
        const monthly = new Map<string, number[]>()
        for (const row of rows) {
          const v = parseFloat(row.DATA_VALUE)
          if (isNaN(v)) continue
          const month = row.TIME.slice(0, 6) // YYYYMMDD → YYYYMM
          if (!monthly.has(month)) monthly.set(month, [])
          monthly.get(month)!.push(v)
        }
        for (const [month, values] of monthly) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length
          results.push({ indicatorCode: code, date: this.parseEcosDate(month), value: Math.round(avg * 100) / 100 })
        }
      } else {
        for (const row of rows) {
          const value = parseFloat(row.DATA_VALUE)
          if (!isNaN(value)) {
            results.push({ indicatorCode: code, date: this.parseEcosDate(row.TIME), value })
          }
        }
      }
      await this.sleep(200)
    }

    return results
  }

  private async fetchSeries(statCode: string, cycle: string, itemCode1: string): Promise<EcosItem[]> {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const endDate = cycle === 'D'
      ? `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
      : `${now.getFullYear()}${pad(now.getMonth() + 1)}`
    const lookbackYears = cycle === 'D' ? 5 : 10
    const startYear = now.getFullYear() - lookbackYears
    const startDate = cycle === 'D' ? `${startYear}0101` : `${startYear}01`

    const url = `/StatisticSearch/${this.apiKey}/json/kr/1/2000/${statCode}/${cycle}/${startDate}/${endDate}/${itemCode1}`
    const res = await this.http.get<EcosResponse>(url)
    return res.data.StatisticSearch?.row ?? []
  }

  private parseEcosDate(time: string): Date {
    // time 포맷: YYYYMM or YYYY
    if (time.length === 6) return new Date(`${time.slice(0, 4)}-${time.slice(4, 6)}-01`)
    return new Date(`${time}-01-01`)
  }
}
