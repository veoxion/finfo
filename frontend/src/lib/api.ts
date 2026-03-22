import axios from 'axios'
import type { IndicatorWithLatest, IndicatorWithData } from './types'
import { getToken } from './auth'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('finfo_token')
      localStorage.removeItem('finfo_email')
      document.cookie = 'finfo_token=; Max-Age=0; path=/'
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export async function getIndicators(params?: {
  country?: string
  category?: string
  source?: string
}): Promise<IndicatorWithLatest[]> {
  const res = await api.get<IndicatorWithLatest[]>('/indicators', { params })
  return res.data
}

export async function getIndicator(
  code: string,
  params?: { startDate?: string; endDate?: string }
): Promise<IndicatorWithData> {
  const res = await api.get<IndicatorWithData>(`/indicators/${code}`, { params })
  return res.data
}

export async function getCompareData(
  code: string,
  countries: string[]
): Promise<IndicatorWithData[]> {
  const res = await api.get<IndicatorWithData[]>(`/indicators/${code}/compare`, {
    params: { countries: countries.join(',') },
  })
  return res.data
}

export interface BriefingResult {
  text: string
  generatedAt: string
  indicators: Array<{
    code: string
    nameKo: string
    latestValue: { date: string; value: number } | null
  }>
}

export async function getBriefing(): Promise<BriefingResult> {
  const res = await api.get<BriefingResult>('/briefing')
  return res.data
}
