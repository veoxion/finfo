import { FastifyPluginAsync } from 'fastify'

const userRoute: FastifyPluginAsync = async (fastify) => {
  // 내 정보 조회
  fastify.get('/api/user/me', async (request) => {
    const { userId } = request.user as { userId: string }
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, createdAt: true, deletedAt: true },
    })
    return user
  })

  // 닉네임 수정
  fastify.put<{ Body: { nickname: string } }>('/api/user/nickname', async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { nickname } = request.body

    if (!nickname || nickname.trim().length < 2) {
      return reply.status(400).send({ error: '닉네임은 2자 이상이어야 합니다.' })
    }

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname.trim() },
      select: { nickname: true },
    })
    return { nickname: user.nickname }
  })

  // 회원탈퇴 (소프트 딜리트)
  fastify.delete('/api/user', async (request, reply) => {
    const { userId } = request.user as { userId: string }
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })
    return reply.status(200).send({ message: '탈퇴 처리되었습니다.' })
  })
}

export default userRoute
