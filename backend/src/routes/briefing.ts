import { FastifyPluginAsync } from 'fastify'
import axios from 'axios'

const CACHE_TTL = 3600 * 6 // 6시간 캐시

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const briefingRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/briefing', async (request, reply) => {
    const cacheKey = 'briefing:latest'

    // 호출 횟수 카운트
    await fastify.redis.incr('briefing:total_calls')

    const cached = await fastify.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // AI 실제 호출 횟수 카운트 (캐시 미스)
    await fastify.redis.incr('briefing:ai_calls')

    // 주요 지표 최신값 조회
    const indicators = await fastify.prisma.indicator.findMany({
      where: {
        code: {
          in: [
            'FRED_FEDFUNDS', 'FRED_CPIAUCSL', 'FRED_UNRATE', 'FRED_GDP',
            'ECOS_BASE_RATE', 'ECOS_USD_KRW', 'ECOS_CPI',
            'WB_USA_GDP', 'WB_KOR_GDP',
            'BLS_NONFARM_PAYROLL', 'KOSIS_UNEMPLOYMENT',
          ]
        }
      },
      include: {
        values: { orderBy: { date: 'desc' }, take: 2 }
      }
    })

    // AI에 전달할 데이터 요약 구성
    const summaryLines = indicators.map(ind => {
      const latest = ind.values[0]
      const prev = ind.values[1]
      if (!latest) return null
      const change = prev ? (latest.value - prev.value) : null
      const changeStr = change !== null
        ? ` (전월 대비 ${change >= 0 ? '+' : ''}${change.toFixed(2)} ${ind.unit})`
        : ''
      return `${ind.nameKo ?? ind.name}: ${latest.value} ${ind.unit}${changeStr} (${new Date(latest.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })})`
    }).filter(Boolean)

    const prompt = `당신은 경제 분석 전문가입니다. 아래의 최신 경제 지표 데이터를 바탕으로 현재 글로벌 경제 상황을 한국어로 브리핑해주세요.

## 최신 경제 지표
${summaryLines.join('\n')}

## 요청사항
- 3~4개 문단으로 작성
- 한국 경제와 미국 경제 상황 각각 분석
- 주요 리스크 요인과 긍정적 요인 언급
- 비전문가도 이해할 수 있는 쉬운 언어로 작성
- 마크다운 사용 금지, 순수 텍스트로만 작성`

    let briefingText = ''
    try {
      const res = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )
      briefingText = res.data.choices?.[0]?.message?.content ?? ''
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      const errMsg = axiosErr.response?.data?.error?.message ?? String(err)
      fastify.log.error(`[briefing] GLM API error: ${errMsg}`)
      return reply.status(503).send({
        error: 'AI 브리핑 생성 실패',
        detail: errMsg,
      })
    }

    const result = {
      text: briefingText,
      generatedAt: new Date().toISOString(),
      indicators: indicators.map(ind => ({
        code: ind.code,
        nameKo: ind.nameKo ?? ind.name,
        latestValue: ind.values[0] ?? null,
      }))
    }

    await fastify.redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result))
    return result
  })
}

export default briefingRoute
