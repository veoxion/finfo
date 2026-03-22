import { BaseCollector, CollectedData } from './base.js'

interface KosisItem {
  TBL_ID: string
  ITM_ID: string
  ITM_NM: string
  PRD_DE: string
  DT: string
  C1?: string
  PRD_SE: string
}

interface KosisErrorResponse {
  err: string
  errMsg: string
}

type KosisResponse = KosisItem[] | KosisErrorResponse

const SERIES = [
  {
    code: 'KOSIS_UNEMPLOYMENT',
    orgId: '101',
    tblId: 'DT_1DA7002S',
    itmId: 'T80',  // 실업률
    objL1: '00',   // 15세 이상 전체 (합계)
    prdSe: 'M',
  },
  {
    code: 'KOSIS_ECONOMICALLY_ACTIVE',
    orgId: '101',
    tblId: 'DT_1DA7002S',
    itmId: 'T20',  // 경제활동인구
    objL1: '00',   // 15세 이상 전체 (합계)
    prdSe: 'M',
  },
  {
    code: 'KOSIS_CPI',
    orgId: '101',
    tblId: 'DT_1J22003',
    itmId: 'T',    // 소비자물가지수(총지수)
    objL1: 'T10',  // 전국
    prdSe: 'M',
  },
]

export class KosisCollector extends BaseCollector {
  private readonly apiKey: string

  constructor() {
    super('kosis', 'https://kosis.kr/openapi/Param')
    const apiKey = process.env.KOSIS_API_KEY
    if (!apiKey) throw new Error('KOSIS_API_KEY is not set')
    this.apiKey = apiKey
  }

  protected async fetchData(): Promise<CollectedData[]> {
    const results: CollectedData[] = []

    for (const series of SERIES) {
      const rows = await this.withRetry(() => this.fetchSeries(series))

      for (const row of rows) {
        const value = parseFloat(row.DT)
        if (isNaN(value) || row.DT === '-' || row.DT.trim() === '') continue
        results.push({
          indicatorCode: series.code,
          date: this.parsePrdDe(row.PRD_DE, row.PRD_SE),
          value,
        })
      }

      await this.sleep(300)
    }

    return results
  }

  private async fetchSeries(series: (typeof SERIES)[number]): Promise<KosisItem[]> {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const endPrdDe = `${now.getFullYear()}${pad(now.getMonth() + 1)}`
    const startYear = now.getFullYear() - 10
    const startPrdDe = `${startYear}01`

    const params = new URLSearchParams({
      method: 'getList',
      apiKey: this.apiKey,
      itmId: `${series.itmId}+`,
      objL1: series.objL1,
      objL2: '',
      format: 'json',
      jsonVD: 'Y',
      prdSe: series.prdSe,
      startPrdDe,
      endPrdDe,
      orgId: series.orgId,
      tblId: series.tblId,
    })

    const res = await this.http.get<KosisResponse>(`/statisticsParameterData.do?${params}`)
    const data = res.data

    if (!Array.isArray(data)) {
      const err = data as KosisErrorResponse
      throw new Error(`KOSIS API error for ${series.code}: [${err.err}] ${err.errMsg}`)
    }

    return data
  }

  private parsePrdDe(prdDe: string, prdSe: string): Date {
    // prdDe 포맷: YYYYMM (월별) 또는 YYYY (연별)
    if (prdSe === 'M' && prdDe.length === 6) {
      return new Date(`${prdDe.slice(0, 4)}-${prdDe.slice(4, 6)}-01`)
    }
    return new Date(`${prdDe.slice(0, 4)}-01-01`)
  }
}
