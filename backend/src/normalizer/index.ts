export interface NormalizedValue {
  indicatorCode: string
  date: Date        // ISO 8601 Date
  value: number
}

/**
 * 날짜를 YYYY-MM-DD 기준 Date 객체로 정규화
 */
export function normalizeDate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getFullYear(), input.getMonth(), 1))
  }
  // YYYYMM 형식
  if (/^\d{6}$/.test(input)) {
    return new Date(`${input.slice(0, 4)}-${input.slice(4, 6)}-01`)
  }
  // YYYY 형식
  if (/^\d{4}$/.test(input)) {
    return new Date(`${input}-01-01`)
  }
  return new Date(input)
}

/**
 * 단위 변환: billion USD → USD (실제 값)
 */
export function normalizeBillionToRaw(value: number): number {
  return value * 1_000_000_000
}

/**
 * 퍼센트 값 정규화 (이미 소수점 형태이면 변환 불필요)
 */
export function normalizePercent(value: number, isDecimal = false): number {
  return isDecimal ? value * 100 : value
}
