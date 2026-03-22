import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const CACHE_TTL = 3600 // 1시간

const listQuerySchema = z.object({
  country: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
})

const detailQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  country: z.string().optional(),
})

const indicatorsRoute: FastifyPluginAsync = async (fastify) => {
  // GET /api/indicators
  fastify.get('/api/indicators', async (request, reply) => {
    const query = listQuerySchema.parse(request.query)
    const cacheKey = `indicators:list:${JSON.stringify(query)}`

    const cached = await fastify.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const where: Record<string, string> = {}
    if (query.country) where.country = query.country
    if (query.category) where.category = query.category
    if (query.source) where.source = query.source

    const indicators = await fastify.prisma.indicator.findMany({
      where,
      include: {
        values: { orderBy: { date: 'desc' }, take: 2 },
      },
    })

    const result = indicators.map((ind) => ({
      ...ind,
      latestValue: ind.values[0] ?? null,
      prevValue: ind.values[1] ?? null,
      values: undefined,
    }))

    await fastify.redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result))
    return result
  })

  // GET /api/indicators/:code
  fastify.get<{ Params: { code: string } }>('/api/indicators/:code', async (request, reply) => {
    const { code } = request.params
    const query = detailQuerySchema.parse(request.query)
    const cacheKey = `indicators:detail:${code}:${JSON.stringify(query)}`

    const cached = await fastify.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const indicator = await fastify.prisma.indicator.findUnique({
      where: { code },
      include: {
        values: {
          where: {
            ...(query.startDate && { date: { gte: new Date(query.startDate) } }),
            ...(query.endDate && { date: { lte: new Date(query.endDate) } }),
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!indicator) return reply.status(404).send({ error: 'Indicator not found' })

    await fastify.redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(indicator))
    return indicator
  })

  // GET /api/indicators/:code/download?format=csv
  fastify.get<{ Params: { code: string } }>('/api/indicators/:code/download', async (request, reply) => {
    const { code } = request.params
    const { format } = request.query as { format?: string }

    if (format !== 'csv') {
      return reply.status(400).send({ error: 'Only format=csv is supported' })
    }

    const indicator = await fastify.prisma.indicator.findUnique({
      where: { code },
      include: {
        values: { orderBy: { date: 'asc' } },
      },
    })

    if (!indicator) return reply.status(404).send({ error: 'Indicator not found' })

    const today = new Date().toISOString().slice(0, 10)
    const filename = `${code}_${today}.csv`

    const lines: string[] = ['date,value,unit']
    for (const v of indicator.values) {
      const dateStr = new Date(v.date).toISOString().slice(0, 10)
      lines.push(`${dateStr},${v.value},${indicator.unit}`)
    }
    const csv = lines.join('\n')

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
    return reply.send(csv)
  })

  // GET /api/indicators/:code/compare?countries=USA,KOR,CHN
  fastify.get<{ Params: { code: string } }>('/api/indicators/:code/compare', async (request, reply) => {
    const { code } = request.params
    const { countries } = request.query as { countries?: string }

    if (!countries) return reply.status(400).send({ error: 'countries query param required' })

    const countryList = countries.split(',').map((c) => c.trim())
    const cacheKey = `indicators:compare:${code}:${countryList.join(',')}`

    const cached = await fastify.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // WB_USA_GDP 형식: prefix_COUNTRY_suffix 패턴 파싱
    const parts = code.split('_')
    // 국가 코드(2-3자 대문자)가 중간에 있는지 확인
    const countryIdx = parts.findIndex((p, i) => i > 0 && i < parts.length - 1 && /^[A-Z]{2,3}$/.test(p))

    if (countryIdx === -1) {
      // 국가 코드가 없는 지표(예: FRED_FEDFUNDS)는 비교 불가
      return []
    }

    const prefix = parts.slice(0, countryIdx).join('_')
    const suffix = parts.slice(countryIdx + 1).join('_')

    const indicators = await fastify.prisma.indicator.findMany({
      where: {
        country: { in: countryList },
        code: { startsWith: `${prefix}_`, endsWith: `_${suffix}` },
      },
      include: { values: { orderBy: { date: 'asc' } } },
    })

    await fastify.redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(indicators))
    return indicators
  })
}

export default indicatorsRoute
