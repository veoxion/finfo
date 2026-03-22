import { FastifyPluginAsync } from 'fastify'
import { collectSource, collectAll } from '../scheduler/index.js'

const MASTER_EMAIL = process.env.MASTER_EMAIL ?? ''

const adminRoute: FastifyPluginAsync = async (fastify) => {
  // 어드민 전용 미들웨어
  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.routeOptions.url?.startsWith('/api/admin')) return
    const user = request.user as { email: string } | undefined
    if (!user || user.email !== MASTER_EMAIL) {
      return reply.status(403).send({ error: '접근 권한이 없습니다.' })
    }
  })

  // 사용자 목록
  fastify.get('/api/admin/users', async () => {
    const users = await fastify.prisma.user.findMany({
      select: { id: true, email: true, nickname: true, createdAt: true, deletedAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return users
  })

  // 통계 (브리핑 호출 + 수집 현황)
  fastify.get('/api/admin/stats', async () => {
    const [totalCalls, aiCalls] = await Promise.all([
      fastify.redis.get('briefing:total_calls'),
      fastify.redis.get('briefing:ai_calls'),
    ])

    // 소스별 최신 수집 로그
    const sources = ['WorldBank', 'FRED', 'ECOS', 'KOSIS', 'BLS']
    const collectorLogs = await Promise.all(
      sources.map((source) =>
        fastify.prisma.collectorLog.findFirst({
          where: { source },
          orderBy: { createdAt: 'desc' },
          select: { source: true, status: true, message: true, recordsCount: true, createdAt: true },
        })
      )
    )

    return {
      briefing: {
        totalCalls: parseInt(totalCalls ?? '0', 10),
        aiCalls: parseInt(aiCalls ?? '0', 10),
        cacheHits: parseInt(totalCalls ?? '0', 10) - parseInt(aiCalls ?? '0', 10),
      },
      collectors: collectorLogs.filter(Boolean),
    }
  })

  // 신고된 채팅방 목록
  fastify.get('/api/admin/chat-reports', async () => {
    const rooms = await fastify.prisma.chatRoom.findMany({
      where: { deletedAt: null },
      include: {
        creator: { select: { nickname: true, email: true } },
        _count: { select: { reports: true } },
        reports: { select: { reason: true, createdAt: true, user: { select: { nickname: true, email: true } } }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return rooms
      .filter((r) => r._count.reports > 0)
      .sort((a, b) => b._count.reports - a._count.reports)
      .map((r) => ({
        id: r.id,
        name: r.name,
        creatorNickname: r.creator.nickname ?? r.creator.email,
        reportCount: r._count.reports,
        isLocked: r._count.reports >= 10,
        reports: r.reports.map((rep) => ({
          reason: rep.reason,
          reporter: rep.user.nickname ?? rep.user.email,
          createdAt: rep.createdAt,
        })),
        createdAt: r.createdAt,
      }))
  })

  // 데이터 수집 트리거
  fastify.post<{ Body: { source?: string } }>('/api/admin/collect', async (request, reply) => {
    const { source } = request.body ?? {}
    if (source) {
      const result = await collectSource(source)
      if (!result.ok) return reply.status(400).send({ error: result.message })
      return { message: result.message }
    }
    // 백그라운드로 전체 수집 시작
    collectAll().catch((err) => fastify.log.error('[admin/collect] Error:', err))
    return { message: '전체 수집을 시작했습니다.' }
  })
}

export default adminRoute
