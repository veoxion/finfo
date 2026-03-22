/**
 * unit에 따라 y축 눈금과 툴팁 값을 적절히 포맷
 */

export function formatAxisValue(value: number, unit: string): string {
  const u = unit.toLowerCase()

  // FRED GDP 등 "Billions of Dollars" 단위 — 값 자체가 이미 십억 달러 단위
  if (u.startsWith('billions of')) {
    const actualValue = value * 1e9
    if (actualValue >= 1e12) return `$${(actualValue / 1e12).toFixed(1)}T`
    return `$${(actualValue / 1e9).toFixed(0)}B`
  }

  // GDP, 달러 계열 → T/B 축약
  if (u.includes('us$') || u.includes('usd') || u.includes('dollar')) {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (Math.abs(value) >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`
    if (Math.abs(value) >= 1e6)  return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toLocaleString()}`
  }

  // 퍼센트
  if (u === '%' || u.includes('percent') || u.includes('연%')) {
    return `${value.toFixed(2)}%`
  }

  // 천명 단위
  if (u.includes('천명')) {
    if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}천만`
    return `${value.toLocaleString()}천`
  }

  // 원화 (환율)
  if (u === 'krw' || u.includes('원')) {
    return `₩${value.toLocaleString()}`
  }

  // 지수 (Index)
  if (u.toLowerCase().includes('index') || u.includes('=100')) {
    return value.toFixed(1)
  }

  // 큰 숫자 자동 축약
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`
  if (Math.abs(value) >= 1e9)  return `${(value / 1e9).toFixed(1)}B`
  if (Math.abs(value) >= 1e6)  return `${(value / 1e6).toFixed(1)}M`
  if (Math.abs(value) >= 1e3)  return `${(value / 1e3).toFixed(1)}K`

  return value.toLocaleString()
}

export function formatTooltipValue(value: number, unit: string): string {
  const u = unit.toLowerCase()

  // FRED GDP 등 "Billions of Dollars" 단위
  if (u.startsWith('billions of')) {
    const actualValue = value * 1e9
    if (actualValue >= 1e12) return `$${(actualValue / 1e12).toFixed(2)}T`
    return `$${(actualValue / 1e9).toFixed(1)}B`
  }

  if (u.includes('us$') || u.includes('usd') || u.includes('dollar')) {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(3)}T`
    if (Math.abs(value) >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`
    return `$${value.toLocaleString()}`
  }

  if (u === '%' || u.includes('percent') || u.includes('연%')) {
    return `${value.toFixed(2)}%`
  }

  if (u.includes('천명')) {
    return `${value.toLocaleString()} 천명`
  }

  if (u === 'krw' || u.includes('원')) {
    return `₩${value.toLocaleString()}`
  }

  return `${value.toLocaleString()} ${unit}`
}
