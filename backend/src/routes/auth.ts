import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/

const authRoute: FastifyPluginAsync = async (fastify) => {
  // 회원가입
  fastify.post<{ Body: { email: string; password: string; nickname: string } }>(
    '/api/auth/register',
    async (request, reply) => {
      const { email, password, nickname } = request.body

      if (!email || !password || !nickname) {
        return reply.status(400).send({ error: '이메일, 닉네임, 비밀번호를 모두 입력해주세요.' })
      }
      if (nickname.trim().length < 2) {
        return reply.status(400).send({ error: '닉네임은 2자 이상이어야 합니다.' })
      }
      if (!PASSWORD_REGEX.test(password)) {
        return reply.status(400).send({
          error: '비밀번호는 8자 이상, 영어 대소문자 및 특수문자를 포함해야 합니다.',
        })
      }

      const existing = await fastify.prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ error: '이미 사용 중인 이메일입니다.' })
      }

      const hashed = await bcrypt.hash(password, 10)
      const user = await fastify.prisma.user.create({
        data: { email, password: hashed, nickname: nickname.trim() },
      })

      const token = fastify.jwt.sign({ userId: user.id, email: user.email })
      return { token, email: user.email, nickname: user.nickname }
    }
  )

  // 로그인
  fastify.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    async (request, reply) => {
      const { email, password } = request.body

      if (!email || !password) {
        return reply.status(400).send({ error: '이메일과 비밀번호를 입력해주세요.' })
      }

      const user = await fastify.prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      }
      if (user.deletedAt) {
        return reply.status(401).send({ error: '탈퇴한 계정입니다.' })
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      }

      const token = fastify.jwt.sign({ userId: user.id, email: user.email })
      return { token, email: user.email, nickname: user.nickname }
    }
  )
}

export default authRoute
