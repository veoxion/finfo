'use client'

import { useQuery } from '@tanstack/react-query'
import { getIndicators, getIndicator, getCompareData } from '@/lib/api'

export function useIndicators(params?: { country?: string; category?: string }) {
  return useQuery({
    queryKey: ['indicators', params],
    queryFn: () => getIndicators(params),
    staleTime: 1000 * 60 * 10, // 10분
  })
}

export function useIndicator(code: string, params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['indicator', code, params],
    queryFn: () => getIndicator(code, params),
    enabled: !!code,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCompareData(code: string, countries: string[]) {
  return useQuery({
    queryKey: ['compare', code, countries],
    queryFn: () => getCompareData(code, countries),
    enabled: !!code && countries.length > 0,
    staleTime: 1000 * 60 * 10,
  })
}
