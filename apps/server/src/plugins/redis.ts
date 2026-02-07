import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import type { FastifyPluginAsync } from 'fastify';

const { REDIS_URL } = process.env;

declare module 'fastify' {
    interface FastifyInstance {
        remember: <T>(key: string, ttl: number, getter: () => Promise<T>) => Promise<T>;
        invalidate: (keys: string | string[]) => Promise<void>;
    }
}

export const redisPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyRedis, {
    url: REDIS_URL,
    connectTimeout: 5000,
    maxRetriesPerRequest: 3,
  })

  fastify.addHook('onReady', async () => {
    try {
      await fastify.redis.ping()
      fastify.log.info('✅ Redis connected successfully')
    } catch (err) {
      fastify.log.error('❌ Redis connection failed:', err)
    }
  })

  fastify.decorate('cache', {
    remember: async <T>(key: string, ttl: number, getter: () => Promise<T>): Promise<T> => {
      if (!fastify.redis) {
        return await getter()
      }

      try {
        const cached = await fastify.redis.get(key)
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch (err) {
        fastify.log.warn(`Redis get error for key ${key}:`, err)
      }

      const result = await getter()

      try {
        if (result !== undefined && result !== null) {
          await fastify.redis.setex(key, ttl, JSON.stringify(result))
        }
      } catch (err) {
        fastify.log.warn(`Redis set error for key ${key}:`, err)
      }

      return result
    },

    invalidate: async (keys: string | string[]) => {
      if (!fastify.redis) return

      try {
        const keysArray = Array.isArray(keys) ? keys : [keys]
        if (keysArray.length > 0) {
          await fastify.redis.del(...keysArray)
        }
      } catch (err) {
        fastify.log.warn('Redis invalidate error:', err)
      }
    }
  })
}

const redis = fp(redisPlugin, {
  name: 'redis'
})  

export {
    redis
}