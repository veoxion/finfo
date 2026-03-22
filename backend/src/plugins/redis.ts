import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { createClient, RedisClientType } from 'redis'

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const client = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' }) as RedisClientType
  await client.connect()

  fastify.decorate('redis', client)
  fastify.addHook('onClose', async () => {
    await client.quit()
  })
})

export default redisPlugin
