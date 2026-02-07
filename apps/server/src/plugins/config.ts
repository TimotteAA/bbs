import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { db } from "../db";
import { systemConfigs } from "@bbs/db";
import { eq } from "drizzle-orm";
import { SystemConfigSchema, type SystemConfig } from "@bbs/db/clients";

/**
 * 内存缓存，缓存系统设置
 * key: provider 名称
 * value: { value, valueType, timestamp }
 */
const cache = new Map<string, SystemConfig & { timestamp: number }>();
const CACHE_TTL = 60000; // 默认缓存一分钟

// 扩展 Fastify 类型
declare module 'fastify' {
    interface FastifyInstance {
        getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined>;
        clearSettingCache(key?: string): void;
    }
}

/**
 * 根据 valueType 将存储的字符串值转换为对应的 JS 类型
 */
function parseValue<T>(value: string, valueType: string): T {
    switch (valueType) {
        case "string":
            return value as T;
        case "boolean":
            return (value === "true") as T;
        case "number":
            return parseFloat(value) as T;
        case "object":
        case "array":
            return JSON.parse(value) as T;
        default:
            return value as T;
    }
}

const systemConfigPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate("getSetting", async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
        const now = Date.now();
        const cached = cache.get(key);
        
        // 缓存命中且未过期
        if (cached && now - cached.timestamp < CACHE_TTL) {
            return parseValue<T>(cached.value, cached.valueType);
        }
        
        // 缓存失效或不存在，查询数据库
        const [cfg] = await db
            .select()
            .from(systemConfigs)
            .where(eq(systemConfigs.provider, key))
            .limit(1);
        
        if (!cfg) {
            return defaultValue;
        }
        
        try {
            const parsed = await SystemConfigSchema.parseAsync(cfg.config);
            // 更新缓存
            cache.set(key, { 
                value: parsed.value, 
                valueType: parsed.valueType, 
                timestamp: now 
            });
            return parseValue<T>(parsed.value, parsed.valueType);
        } catch (err: any) {
            fastify.log.error({ err, key }, `[SystemConfig] Failed to parse config for key: ${key}`);
            return defaultValue;
        }
    });

    fastify.decorate("clearSettingCache", (key?: string) => {
        if (key) {
            cache.delete(key);
        } else {
            cache.clear();
        }
    }); 
};

const systemConfig = fp(systemConfigPlugin);

export { systemConfig };