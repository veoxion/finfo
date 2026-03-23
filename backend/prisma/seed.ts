import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const indicators = [
  // === World Bank GDP ===
  {
    code: 'WB_USA_GDP',
    name: 'GDP (current US$) - United States',
    nameKo: '미국 GDP',
    category: 'gdp' as const,
    unit: 'current US$',
    source: 'world_bank',
    country: 'USA',
    description: '미국의 국내총생산(GDP)으로, 한 해 동안 생산된 모든 재화와 서비스의 총합입니다. GDP가 성장하면 경제가 확장되고 있음을 나타냅니다.',
  },
  {
    code: 'WB_KOR_GDP',
    name: 'GDP (current US$) - Korea',
    nameKo: '한국 GDP',
    category: 'gdp' as const,
    unit: 'current US$',
    source: 'world_bank',
    country: 'KOR',
    description: '한국의 국내총생산(GDP)입니다. 수출 의존도가 높은 한국 경제의 특성상 글로벌 교역량과 밀접하게 연동됩니다.',
  },
  {
    code: 'WB_CHN_GDP',
    name: 'GDP (current US$) - China',
    nameKo: '중국 GDP',
    category: 'gdp' as const,
    unit: 'current US$',
    source: 'world_bank',
    country: 'CHN',
    description: '중국의 국내총생산(GDP)입니다. 세계 2위 경제 대국으로 글로벌 원자재 수요와 공급망에 큰 영향을 미칩니다.',
  },
  {
    code: 'WB_JPN_GDP',
    name: 'GDP (current US$) - Japan',
    nameKo: '일본 GDP',
    category: 'gdp' as const,
    unit: 'current US$',
    source: 'world_bank',
    country: 'JPN',
    description: '일본의 국내총생산(GDP)입니다. 엔화 환율과 수출 경쟁력이 GDP에 큰 영향을 미치는 수출 중심 경제입니다.',
  },
  {
    code: 'WB_DEU_GDP',
    name: 'GDP (current US$) - Germany',
    nameKo: '독일 GDP',
    category: 'gdp' as const,
    unit: 'current US$',
    source: 'world_bank',
    country: 'DEU',
    description: '독일의 국내총생산(GDP)입니다. 유럽 최대 경제국으로 제조업과 수출이 핵심이며 유로존 경기를 가늠하는 지표입니다.',
  },

  // === FRED - 미국 ===
  {
    code: 'FRED_FEDFUNDS',
    name: 'Federal Funds Effective Rate',
    nameKo: '미국 기준금리 (연방기금금리)',
    category: 'interest_rate' as const,
    unit: '%',
    source: 'fred',
    country: 'USA',
    description: '미국 연방준비제도(Fed)가 설정하는 기준금리입니다. 금리가 오르면 대출 비용이 증가하고 소비·투자가 위축되며 달러 강세 요인이 됩니다.',
  },
  {
    code: 'FRED_CPIAUCSL',
    name: 'Consumer Price Index for All Urban Consumers',
    nameKo: '미국 소비자물가지수 (CPI)',
    category: 'cpi' as const,
    unit: 'Index 1982-84=100',
    source: 'fred',
    country: 'USA',
    description: '미국 소비자물가지수(CPI)로 도시 소비자의 생활비 변동을 측정합니다. 높은 CPI는 인플레이션을 나타내며 연준의 금리 인상 압력으로 이어집니다.',
  },
  {
    code: 'FRED_GDP',
    name: 'Gross Domestic Product',
    nameKo: '미국 GDP (분기)',
    category: 'gdp' as const,
    unit: 'Billions of Dollars',
    source: 'fred',
    country: 'USA',
    description: '미국의 분기별 국내총생산(GDP)으로 경제 성장률을 분기 단위로 측정합니다. 2분기 연속 감소하면 경기침체(recession)로 정의됩니다.',
  },
  {
    code: 'FRED_UNRATE',
    name: 'Unemployment Rate',
    nameKo: '미국 실업률',
    category: 'employment' as const,
    unit: '%',
    source: 'fred',
    country: 'USA',
    description: '미국 실업률로 노동 가능 인구 중 일자리를 구하지 못한 비율입니다. 낮은 실업률은 노동시장 강세를 나타내며 임금 상승과 소비 증가로 이어집니다.',
  },
  {
    code: 'FRED_DGS10',
    name: '10-Year Treasury Constant Maturity Rate',
    nameKo: '미국 10년 국채금리',
    category: 'interest_rate' as const,
    unit: '%',
    source: 'fred',
    country: 'USA',
    description: '미국 10년 만기 국채 수익률입니다. 장기 금리의 기준으로 모기지 금리, 기업 대출 금리 등 각종 금융 상품 금리에 영향을 미칩니다.',
  },

  // === BLS - 미국 고용 ===
  {
    code: 'BLS_UNRATE',
    name: 'Unemployment Rate - United States (BLS)',
    nameKo: '미국 실업률 (BLS)',
    category: 'employment' as const,
    unit: '%',
    source: 'bls',
    country: 'USA',
    description: '미국 노동통계국(BLS)이 집계하는 실업률입니다. 매월 첫째 주 금요일 발표되며 연준의 통화정책 결정에 가장 중요한 지표 중 하나입니다.',
  },
  {
    code: 'BLS_NONFARM_PAYROLL',
    name: 'Total Nonfarm Payroll Employment',
    nameKo: '미국 비농업 고용자수',
    category: 'employment' as const,
    unit: '천명',
    source: 'bls',
    country: 'USA',
    description: '미국의 비농업 부문 신규 취업자 수(Non-Farm Payroll)입니다. 매달 발표되는 고용보고서의 핵심 지표로 경제 건강성을 나타냅니다.',
  },
  {
    code: 'BLS_AVG_HOURLY_EARNINGS',
    name: 'Average Hourly Earnings - Total Private',
    nameKo: '미국 평균 시간당 임금',
    category: 'other' as const,
    unit: 'USD',
    source: 'bls',
    country: 'USA',
    description: '미국 민간 부문 근로자의 평균 시간당 임금입니다. 임금 상승은 소비력 증가로 이어지지만 지나친 임금 인상은 인플레이션 압력이 됩니다.',
  },

  // === 통계청 KOSIS ===
  {
    code: 'KOSIS_UNEMPLOYMENT',
    name: 'Unemployment Rate - Korea',
    nameKo: '한국 실업률',
    category: 'employment' as const,
    unit: '%',
    source: 'kosis',
    country: 'KOR',
    description: '통계청이 집계하는 한국의 실업률입니다. 15세 이상 경제활동인구 중 일자리를 구하지 못한 비율로 매월 발표됩니다.',
  },
  {
    code: 'KOSIS_ECONOMICALLY_ACTIVE',
    name: 'Economically Active Population - Korea',
    nameKo: '한국 경제활동인구',
    category: 'employment' as const,
    unit: '천명',
    source: 'kosis',
    country: 'KOR',
    description: '한국의 경제활동인구로 취업자와 실업자를 합친 수치입니다. 경제활동 참가율과 함께 노동시장의 전반적인 활력을 보여줍니다.',
  },
  {
    code: 'KOSIS_CPI',
    name: 'Consumer Price Index - Korea (KOSIS)',
    nameKo: '한국 소비자물가지수 (통계청)',
    category: 'cpi' as const,
    unit: 'Index 2020=100',
    source: 'kosis',
    country: 'KOR',
    description: '통계청이 집계하는 한국 소비자물가지수입니다. 460개 품목의 가격 변동을 측정하며 2020년을 기준(=100)으로 합니다.',
  },

  // === BEA - 미국 경제 상세 ===
  {
    code: 'BEA_REAL_GDP_GROWTH',
    name: 'Real GDP Growth Rate',
    nameKo: '미국 실질 GDP 성장률',
    category: 'gdp' as const,
    unit: '%',
    source: 'bea',
    country: 'USA',
    description: '미국의 분기별 실질 GDP 성장률(전기 대비 연율)입니다. 인플레이션을 제거한 실제 경제 성장을 보여주며 NBER 경기침체 판단의 핵심 지표입니다.',
  },
  {
    code: 'BEA_PERSONAL_INCOME',
    name: 'Personal Income',
    nameKo: '미국 개인소득',
    category: 'other' as const,
    unit: 'Billions of Dollars',
    source: 'bea',
    country: 'USA',
    description: '미국 개인소득 총액으로 임금, 사업소득, 투자소득, 이전소득 등을 포함합니다. 소비 여력을 가늠하는 선행 지표입니다.',
  },
  {
    code: 'BEA_PCE',
    name: 'Personal Consumption Expenditures',
    nameKo: '미국 개인소비지출 (PCE)',
    category: 'other' as const,
    unit: 'Billions of Dollars',
    source: 'bea',
    country: 'USA',
    description: '미국 개인소비지출(PCE)로 미국 GDP의 약 70%를 차지합니다. 연준이 인플레이션 측정에 CPI보다 PCE 물가지수를 선호합니다.',
  },

  // === 한국은행 ECOS ===
  {
    code: 'ECOS_BASE_RATE',
    name: 'Bank of Korea Base Rate',
    nameKo: '한국 기준금리',
    category: 'interest_rate' as const,
    unit: '%',
    source: 'ecos',
    country: 'KOR',
    description: '한국은행이 설정하는 기준금리입니다. 대출·예금 금리의 기준이 되며 금리 인상 시 가계 대출 부담이 커지고 원화 강세 압력이 생깁니다.',
  },
  {
    code: 'ECOS_USD_KRW',
    name: 'USD/KRW Exchange Rate',
    nameKo: '원달러 환율',
    category: 'exchange_rate' as const,
    unit: 'KRW',
    source: 'ecos',
    country: 'KOR',
    description: '달러 대비 원화 환율(원/달러)입니다. 환율이 오르면(원화 약세) 수출 기업에 유리하지만 수입 물가가 올라 인플레이션 요인이 됩니다.',
  },
  {
    code: 'ECOS_CPI',
    name: 'Consumer Price Index - Korea',
    nameKo: '한국 소비자물가지수 (CPI)',
    category: 'cpi' as const,
    unit: 'Index 2020=100',
    source: 'ecos',
    country: 'KOR',
    description: '한국의 소비자물가지수로 한국은행이 집계합니다. 물가 상승률이 목표치(2%)를 지속적으로 상회하면 기준금리 인상의 근거가 됩니다.',
  },
]

async function main() {
  console.log('Seeding indicators...')

  for (const indicator of indicators) {
    await prisma.indicator.upsert({
      where: { code: indicator.code },
      create: indicator,
      update: {
        name: indicator.name,
        nameKo: indicator.nameKo,
        unit: indicator.unit,
        description: indicator.description,
      },
    })
    console.log(`  ✓ ${indicator.code}`)
  }

  console.log(`Done. ${indicators.length} indicators seeded.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
