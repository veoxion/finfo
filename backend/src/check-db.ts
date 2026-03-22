import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.indicatorValue.count()
  console.log('총 IndicatorValue 건수:', count)

  const sample = await prisma.indicatorValue.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { indicator: { select: { code: true } } },
  })
  console.log('최근 저장된 값:', JSON.stringify(sample, null, 2))

  // 인디케이터별 카운트
  const byIndicator = await prisma.indicator.findMany({
    select: { code: true, _count: { select: { values: true } } },
  })
  console.log('\n인디케이터별 저장 건수:')
  byIndicator.forEach((i) => console.log(`  ${i.code}: ${i._count.values}건`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
