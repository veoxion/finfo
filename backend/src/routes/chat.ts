import { FastifyPluginAsync } from 'fastify'

const REPORT_LOCK_THRESHOLD = 10

const chatRoute: FastifyPluginAsync = async (fastify) => {
  // 채팅방 목록
  fastify.get('/api/chat/rooms', async () => {
    const rooms = await fastify.prisma.chatRoom.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { nickname: true, email: true } },
        _count: { select: { messages: true, reports: true } },
      },
    })
    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      creatorNickname: r.creator.nickname ?? r.creator.email,
      createdBy: r.createdBy,
      messageCount: r._count.messages,
      reportCount: r._count.reports,
      isLocked: r._count.reports >= REPORT_LOCK_THRESHOLD,
      createdAt: r.createdAt,
    }))
  })

  // 채팅방 생성
  fastify.post<{ Body: { name: string } }>('/api/chat/rooms', async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { name } = request.body

    if (!name || name.trim().length < 2) {
      return reply.status(400).send({ error: '채팅방 이름은 2자 이상이어야 합니다.' })
    }
    if (name.trim().length > 30) {
      return reply.status(400).send({ error: '채팅방 이름은 30자 이하여야 합니다.' })
    }

    const room = await fastify.prisma.chatRoom.create({
      data: { name: name.trim(), createdBy: userId },
      include: { creator: { select: { nickname: true, email: true } } },
    })

    return {
      id: room.id,
      name: room.name,
      creatorNickname: room.creator.nickname ?? room.creator.email,
      createdBy: room.createdBy,
      messageCount: 0,
      reportCount: 0,
      isLocked: false,
      createdAt: room.createdAt,
    }
  })

  // 채팅방 삭제 (생성자 또는 관리자)
  fastify.delete<{ Params: { id: string } }>('/api/chat/rooms/:id', async (request, reply) => {
    const { userId, email } = request.user as { userId: string; email: string }
    const { id } = request.params
    const masterEmail = process.env.MASTER_EMAIL ?? ''

    const room = await fastify.prisma.chatRoom.findUnique({ where: { id } })
    if (!room || room.deletedAt) {
      return reply.status(404).send({ error: '채팅방을 찾을 수 없습니다.' })
    }
    if (room.createdBy !== userId && email !== masterEmail) {
      return reply.status(403).send({ error: '삭제 권한이 없습니다.' })
    }

    await fastify.prisma.chatRoom.update({ where: { id }, data: { deletedAt: new Date() } })
    return { message: '채팅방이 삭제되었습니다.' }
  })

  // 메시지 조회 (after 파라미터로 증분 로딩)
  fastify.get<{ Params: { id: string }; Querystring: { after?: string } }>(
    '/api/chat/rooms/:id/messages',
    async (request, reply) => {
      const { id } = request.params
      const { after } = request.query

      const room = await fastify.prisma.chatRoom.findUnique({
        where: { id, deletedAt: null },
        include: { _count: { select: { reports: true } } },
      })
      if (!room) return reply.status(404).send({ error: '채팅방을 찾을 수 없습니다.' })

      const messages = await fastify.prisma.chatMessage.findMany({
        where: {
          roomId: id,
          ...(after ? { createdAt: { gt: new Date(after) } } : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: after ? 100 : 50,
        include: { user: { select: { nickname: true, email: true, id: true } } },
      })

      return {
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          userId: m.userId,
          nickname: m.user.nickname ?? m.user.email,
        })),
        reportCount: room._count.reports,
        isLocked: room._count.reports >= REPORT_LOCK_THRESHOLD,
        roomName: room.name,
        createdBy: room.createdBy,
      }
    }
  )

  // 메시지 전송
  fastify.post<{ Params: { id: string }; Body: { content: string } }>(
    '/api/chat/rooms/:id/messages',
    async (request, reply) => {
      const { userId } = request.user as { userId: string }
      const { id } = request.params
      const { content } = request.body

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: '내용을 입력해주세요.' })
      }
      if (content.trim().length > 500) {
        return reply.status(400).send({ error: '메시지는 500자 이하여야 합니다.' })
      }

      const room = await fastify.prisma.chatRoom.findUnique({
        where: { id, deletedAt: null },
        include: { _count: { select: { reports: true } } },
      })
      if (!room) return reply.status(404).send({ error: '채팅방을 찾을 수 없습니다.' })
      if (room._count.reports >= REPORT_LOCK_THRESHOLD) {
        return reply.status(403).send({ error: '신고가 누적되어 채팅이 잠긴 방입니다.' })
      }

      const message = await fastify.prisma.chatMessage.create({
        data: { roomId: id, userId, content: content.trim() },
        include: { user: { select: { nickname: true, email: true } } },
      })

      return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        userId: message.userId,
        nickname: message.user.nickname ?? message.user.email,
      }
    }
  )

  // 채팅방 신고
  fastify.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/api/chat/rooms/:id/report',
    async (request, reply) => {
      const { userId } = request.user as { userId: string }
      const { id } = request.params
      const { reason } = request.body

      if (!reason || reason.trim().length === 0) {
        return reply.status(400).send({ error: '신고 사유를 입력해주세요.' })
      }

      const room = await fastify.prisma.chatRoom.findUnique({ where: { id, deletedAt: null } })
      if (!room) return reply.status(404).send({ error: '채팅방을 찾을 수 없습니다.' })

      try {
        await fastify.prisma.chatReport.create({ data: { roomId: id, userId, reason: reason.trim() } })
      } catch {
        return reply.status(409).send({ error: '이미 신고한 채팅방입니다.' })
      }

      const reportCount = await fastify.prisma.chatReport.count({ where: { roomId: id } })
      return { message: '신고가 접수되었습니다.', reportCount }
    }
  )
}

export default chatRoute
