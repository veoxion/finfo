import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { WorldBankCollector, FredCollector, EcosCollector, BlsCollector, KosisCollector } from './collectors/index.js'
import type { CollectedData } from './collectors/base.js'

const prisma = new PrismaClient()

async function run(name: string, collect: () => Promise<CollectedData[]>) {
  console.log(`\n▶ ${name} 수집 시작...`)
  const t = Date.now()

  try {
    const data = await collect()

    const codeSet = [...new Set(data.map((d) => d.indicatorCode))]
    const indicators = await prisma.indicator.findMany({
      where: { code: { in: codeSet } },
      select: { id: true, code: true },
    })
    const codeToId = Object.fromEntries(indicators.map((i) => [i.code, i.id]))

    const valid = data.filter((d) => codeToId[d.indicatorCode])
    await Promise.all(
      valid.map((d) =>
        prisma.indicatorValue.upsert({
          where: { indicatorId_date: { indicatorId: codeToId[d.indicatorCode], date: d.date } },
          create: { indicatorId: codeToId[d.indicatorCode], date: d.date, value: d.value },
          update: { value: d.value },
        })
      )
    )

    await prisma.collectorLog.create({
      data: { source: name, status: 'success', recordsCount: valid.length },
    })

    console.log(`✅ ${name} 완료: ${valid.length}건 저장 (${Date.now() - t}ms)`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.collectorLog.create({
      data: { source: name, status: 'failure', message },
    })
    console.error(`❌ ${name} 실패:`, message)
  }
}

async function main() {
  console.log('=== finfo 데이터 수집 시작 ===')

  await run('world_bank', () => new WorldBankCollector().collect())
  await run('fred', () => new FredCollector().collect())
  await run('ecos', () => new EcosCollector().collect())
  await run('bls', () => new BlsCollector().collect())
  await run('kosis', () => new KosisCollector().collect())

  console.log('\n=== 수집 완료 ===')
  await prisma.$disconnect()
}

main().catch(console.error)
