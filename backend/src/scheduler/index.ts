import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { WorldBankCollector, FredCollector, EcosCollector, BlsCollector, KosisCollector } from '../collectors/index.js'
import type { CollectedData } from '../collectors/base.js'

const prisma = new PrismaClient()

async function runCollector(
  name: string,
  collect: () => Promise<CollectedData[]>
) {
  console.log(`[Scheduler] Starting ${name} collection...`)
  const startedAt = Date.now()
  let recordsCount = 0

  try {
    const data = await collect()
    recordsCount = data.length

    // code → id 조회 (캐시)
    const codeSet = [...new Set(data.map((d) => d.indicatorCode))]
    const indicators = await prisma.indicator.findMany({
      where: { code: { in: codeSet } },
      select: { id: true, code: true },
    })
    const codeToId = Object.fromEntries(indicators.map((i) => [i.code, i.id]))

    // upsert (알 수 없는 code는 건너뜀)
    await Promise.all(
      data
        .filter((d) => codeToId[d.indicatorCode])
        .map((d) =>
          prisma.indicatorValue.upsert({
            where: { indicatorId_date: { indicatorId: codeToId[d.indicatorCode], date: d.date } },
            create: { indicatorId: codeToId[d.indicatorCode], date: d.date, value: d.value },
            update: { value: d.value },
          })
        )
    )

    await prisma.collectorLog.create({
      data: { source: name, status: 'success', recordsCount },
    })

    console.log(`[Scheduler] ${name} done: ${recordsCount} records in ${Date.now() - startedAt}ms`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.collectorLog.create({
      data: { source: name, status: 'failure', message },
    })
    console.error(`[Scheduler] ${name} failed:`, message)
  }
}

const COLLECTORS: Record<string, () => Promise<CollectedData[]>> = {
  WorldBank: () => new WorldBankCollector().collect(),
  FRED: () => new FredCollector().collect(),
  ECOS: () => new EcosCollector().collect(),
  BLS: () => new BlsCollector().collect(),
  KOSIS: () => new KosisCollector().collect(),
}

export async function collectSource(source: string): Promise<{ ok: boolean; message: string }> {
  const fn = COLLECTORS[source]
  if (!fn) return { ok: false, message: `Unknown source: ${source}` }
  await runCollector(source, fn)
  return { ok: true, message: `${source} 수집 완료` }
}

export async function collectAll(): Promise<void> {
  for (const [name, fn] of Object.entries(COLLECTORS)) {
    await runCollector(name, fn)
  }
}

export function startScheduler() {
  // World Bank: 매일 02:00
  cron.schedule('0 2 * * *', () => {
    const collector = new WorldBankCollector()
    runCollector('world_bank', () => collector.collect())
  })

  // FRED: 매일 03:00
  cron.schedule('0 3 * * *', () => {
    const collector = new FredCollector()
    runCollector('fred', () => collector.collect())
  })

  // ECOS: 매일 04:00
  cron.schedule('0 4 * * *', () => {
    const collector = new EcosCollector()
    runCollector('ecos', () => collector.collect())
  })

  // BLS: 매일 05:30
  cron.schedule('30 5 * * *', () => {
    const collector = new BlsCollector()
    runCollector('bls', () => collector.collect())
  })

  // KOSIS: 매일 05:00
  cron.schedule('0 5 * * *', () => {
    const collector = new KosisCollector()
    runCollector('kosis', () => collector.collect())
  })

  console.log('[Scheduler] All jobs registered')
}
