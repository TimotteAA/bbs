import { Resend } from "resend";
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { db } from "../db";
import { systemConfigs, type ResendAuth } from "@bbs/db";
import { and, eq } from "drizzle-orm";

const isDev = () => process.env.NODE_ENV === "development"; // 修复拼写错误
export interface EmailSender {
    send(from: string, to: string, subject: string, template: string, data?: any): Promise<any>;
}


// 3. 扩展 Fastify 类型
declare module 'fastify' {
    interface FastifyInstance {
        email: EmailSender;
        getEnabledEmailProviders: () => Promise<typeof systemConfigs.$inferSelect[]>;
    }
}

const emailPlugin: FastifyPluginAsync = async (fastify, options) => {
    let sender: EmailSender;

    // 查询启用的服务
    const dbConfigs = await db
        .select()
        .from(systemConfigs)
        .where(and(eq(systemConfigs.key, "email"), eq(systemConfigs.enabled, true)));

    if (dbConfigs.length === 0) {
        fastify.log.warn("⚠️ [Email Plugin] 数据库中未找到启用的 email 配置");
        sender = {
            send: async () => {
                throw new Error("Email service not configured (No enabled config found in DB)");
            }
        };
    } else {
        const rawConfig = dbConfigs[0];
        const config = rawConfig.config; 
        const provider = rawConfig.provider || 'unknown';

        // 策略 1: Mock (开发环境)
        if (provider === "mock" && isDev()) {
            fastify.log.info("📧 [Email Plugin] 加载 Mock 模式");
            sender = {
                send: async (from, to, subject, template, data) => {
                    fastify.log.info(`[Mock Email] To: ${to} | Template: ${template} | Data: ${JSON.stringify(data)}`);
                    await new Promise(r => setTimeout(r, 500)); // 模拟延迟
                }
            };
        } 
        else if (provider === "resend") {
            const cfg = config as ResendAuth

            const resendClient = new Resend(cfg.apiKey); // 创建resend实例
            fastify.log.info("📧 [Email Plugin] 加载 Resend 模式");

            sender = {
                async send(from, to, subject, template, data) {
                    const htmlContent = `<div>[Template: ${template}]</div>`; 
                    resendClient.emails.send({
                        from, to, subject, html: htmlContent
                    }).then(res => {
                        fastify.log.info(`[Email Sent] result: ${JSON.stringify(res)}`);
                    }).catch (err => {
                        fastify.log.error(`[Email Failed] ${err.message}`);
                    })
                    // 直接返回
                    return true;
                }
            };
        } 
        
        else {
            fastify.log.error(`[Email Plugin] 未支持的 Provider: ${provider}`);
            sender = { send: async () => { throw new Error(`Unsupported provider: ${provider}`); } };
        }
    }

    fastify.decorate('email', sender);
    fastify.decorate("getEnabledEmailProviders", async () => {
        return await db
            .select()
            .from(systemConfigs)
            .where(and(eq(systemConfigs.key, "email"), eq(systemConfigs.enabled, true)));
    });
};

const email = fp(emailPlugin);

export {
    email
};