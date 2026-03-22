import { BaseCollector, CollectedData } from './base.js'

interface WorldBankEntry {
  date: string
  value: number | null
}

interface WorldBankResponse {
  page: number
  pages: number
  per_page: number
  total: number
  data: WorldBankEntry[]
}

const INDICATORS = [
  { code: 'WB_USA_GDP', country: 'US', wbIndicator: 'NY.GDP.MKTP.CD' },
  { code: 'WB_KOR_GDP', country: 'KR', wbIndicator: 'NY.GDP.MKTP.CD' },
  { code: 'WB_CHN_GDP', country: 'CN', wbIndicator: 'NY.GDP.MKTP.CD' },
  { code: 'WB_JPN_GDP', country: 'JP', wbIndicator: 'NY.GDP.MKTP.CD' },
  { code: 'WB_DEU_GDP', country: 'DE', wbIndicator: 'NY.GDP.MKTP.CD' },
]

export class WorldBankCollector extends BaseCollector {
  constructor() {
    super('world_bank', 'https://api.worldbank.org/v2')
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []

    for (const { code, country, wbIndicator } of INDICATORS) {
      const data = await this.withRetry(() => this.fetchIndicator(country, wbIndicator))
      for (const entry of data) {
        if (entry.value !== null) {
          results.push({
            indicatorCode: code,
            date: new Date(`${entry.date}-01-01`),
            value: entry.value,
          })
        }
      }
      await this.sleep(200) // rate limiting
    }

    return results
  }

  private async fetchIndicator(country: string, indicator: string): Promise<WorldBankEntry[]> {
    const allData: WorldBankEntry[] = []
    let page = 1

    while (true) {
      const res = await this.http.get<[unknown, WorldBankEntry[]]>(
        `/country/${country}/indicator/${indicator}`,
        { params: { format: 'json', per_page: 50, page, mrv: 20 } }
      )

      const [meta, data] = res.data as [WorldBankResponse, WorldBankEntry[]]
      if (!data || data.length === 0) break

      allData.push(...data)
      if (page >= meta.pages) break
      page++
    }

    return allData
  }
}
