import { BaseCollector, CollectedData } from './base.js'

interface BeaDataItem {
  TimePeriod: string
  DataValue: string
  LineNumber: string
  LineDescription: string
}

interface BeaResponse {
  BEAAPI: {
    Results: {
      Data: BeaDataItem[]
      Error?: { APIErrorDescription: string }
    }
  }
}

// NIPA Table T10101: GDP 실질 성장률 (LineNumber 1 = GDP)
// NIPA Table T20100: 개인소득 (LineNumber 1 = Personal Income)
// NIPA Table T20600: 개인소비지출 (LineNumber 1 = PCE)
const TABLES = [
  { code: 'BEA_REAL_GDP_GROWTH', tableName: 'T10101', lineNumber: '1', frequency: 'Q' },
  { code: 'BEA_PERSONAL_INCOME', tableName: 'T20100', lineNumber: '1', frequency: 'Q' },
  { code: 'BEA_PCE', tableName: 'T20600', lineNumber: '1', frequency: 'Q' },
]

export class BeaCollector extends BaseCollector {
  private readonly apiKey: string

  constructor() {
    super('bea', 'https://apps.bea.gov/api/data')
    const apiKey = process.env.BEA_API_KEY
    if (!apiKey) throw new Error('BEA_API_KEY is not set')
    this.apiKey = apiKey
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i).join(',')

    for (const { code, tableName, lineNumber, frequency } of TABLES) {
      const data = await this.withRetry(() => this.fetchTable(tableName, frequency, years))

      for (const item of data) {
        if (item.LineNumber !== lineNumber) continue
        const value = parseFloat(item.DataValue.replace(/,/g, ''))
        if (isNaN(value)) continue

        const date = this.parseTimePeriod(item.TimePeriod, frequency)
        if (!date) continue

        results.push({ indicatorCode: code, date, value })
      }

      await this.sleep(200) // BEA 일일 1,000회 제한 대비
    }

    return results
  }

  private async fetchTable(tableName: string, frequency: string, years: string): Promise<BeaDataItem[]> {
    const res = await this.http.get<BeaResponse>('', {
      params: {
        UserID: this.apiKey,
        method: 'GetData',
        DataSetName: 'NIPA',
        TableName: tableName,
        Frequency: frequency,
        Year: years,
        ResultFormat: 'JSON',
      },
    })

    const apiResult = res.data.BEAAPI.Results
    if (apiResult.Error) {
      throw new Error(`[bea] API error: ${apiResult.Error.APIErrorDescription}`)
    }

    return apiResult.Data ?? []
  }

  private parseTimePeriod(period: string, frequency: string): Date | null {
    if (frequency === 'Q') {
      // "2024Q1" → 2024-01-01, "2024Q2" → 2024-04-01, etc.
      const match = period.match(/^(\d{4})Q(\d)$/)
      if (!match) return null
      const year = parseInt(match[1])
      const quarter = parseInt(match[2])
      const month = (quarter - 1) * 3 + 1
      return new Date(`${year}-${String(month).padStart(2, '0')}-01`)
    }
    if (frequency === 'M') {
      // "2024M01" → 2024-01-01
      const match = period.match(/^(\d{4})M(\d{2})$/)
      if (!match) return null
      return new Date(`${match[1]}-${match[2]}-01`)
    }
    return null
  }
}
