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


// 扩展 Fastify 类型
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
                    // 如果 template 以 < 开头，视为 HTML 内容；否则视为模板名称
                    const htmlContent = template.startsWith('<') 
                        ? template 
                        : `<div>[Template: ${template}]</div>`; 
                    try {
                        const result = await resendClient.emails.send({
                            from, 
                            to, 
                            subject, 
                            html: htmlContent
                        });
                        fastify.log.info(`[Email Sent] result: ${JSON.stringify(result)}`);
                        return result;
                    } catch (err: any) {
                        fastify.log.error(`[Email Failed] ${err.message}`);
                        throw err;
                    }
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