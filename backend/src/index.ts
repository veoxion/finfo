import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import jwtPlugin from './plugins/jwt.js'
import healthRoute from './routes/health.js'
import authRoute from './routes/auth.js'
import adminRoute from './routes/admin.js'
import userRoute from './routes/user.js'
import chatRoute from './routes/chat.js'
import indicatorsRoute from './routes/indicators.js'
import briefingRoute from './routes/briefing.js'
import { startScheduler } from './scheduler/index.js'
import bcrypt from 'bcryptjs'

const server = Fastify({ logger: true })

async function main() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  })
  await server.register(prismaPlugin)
  await server.register(redisPlugin)
  await server.register(jwtPlugin)

  // 인증 불필요 라우트
  await server.register(healthRoute)
  await server.register(authRoute)

  // 인증 필요 라우트 - JWT 검증 preHandler 적용
  server.addHook('preHandler', async (request, reply) => {
    const { url } = request
    const isPublic =
      url === '/health' ||
      url.startsWith('/api/auth/')
    if (isPublic) return

    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: '로그인이 필요합니다.' })
    }
  })

  await server.register(adminRoute)
  await server.register(userRoute)
  await server.register(chatRoute)
  await server.register(indicatorsRoute)
  await server.register(briefingRoute)

  const port = parseInt(process.env.PORT ?? '3001', 10)
  await server.listen({ port, host: '0.0.0.0' })

  // 마스터 계정 자동 생성
  const MASTER_EMAIL = process.env.MASTER_EMAIL
  const MASTER_PASSWORD = process.env.MASTER_PASSWORD
  if (!MASTER_EMAIL || !MASTER_PASSWORD) {
    console.warn('[init] MASTER_EMAIL or MASTER_PASSWORD not set in .env — skipping master account creation')
  } else {
    const existing = await server.prisma.user.findUnique({ where: { email: MASTER_EMAIL } })
    if (!existing) {
      const hashed = await bcrypt.hash(MASTER_PASSWORD, 10)
      await server.prisma.user.create({ data: { email: MASTER_EMAIL, password: hashed } })
      console.log('[init] Master account created')
    }
  }

  startScheduler()
  console.log(`finfo backend running on port ${port}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
