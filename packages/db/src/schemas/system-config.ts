import { sqliteTable, integer, text, customType } from 'drizzle-orm/sqlite-core';
import { $defaults } from '../clients/common';

// 定义一个json类型，用于存储系统配置数据
const jsonb = <TData>(name: string) => customType<{ data: TData; driverData: string }>({
    dataType() {
        return 'text';
    },
    toDriver(value: TData): string {
        try {
            return JSON.stringify(value);
        } catch {
            return '';
        }
    },
    fromDriver(value: string): TData {
        try {
            return JSON.parse(value);
        } catch {
            return {} as TData;
        }
    },
})(name);

export const systemConfigs = sqliteTable('system_configs', {
    /**
     * 配置对象key
     */
    key: text('key').notNull(), // e.g., 'email', 'storage', 'system', etc.
    /**
     * 配置对象提供商
     */
    provider: text('provider').notNull(), // 'smtp', 'aliyun', 'tencent'
    /**
     * 配置对象
     */
    config: jsonb('config').notNull(), // Provider-specific settings
    /**
     * 是否启用
     */
    enabled: integer('enabled', { mode: 'boolean' }).default(false).notNull(),
    ...$defaults,
});

/**
 * Resend 只需要一个 API Key
 */
export interface ResendAuth {
    type: 'resend';
    apiKey: string;
}

/**
 * 阿里云 SMTP 模式配置
 * 对应 Nodemailer 的 Transport Options
 */
export interface SmtpAuth {
    type: 'smtp';
    /**
     * 阿里云通常是: smtpdm.aliyun.com
     */
    host: string;
    /**
     * SSL 建议用 465，普通用 25 或 80
     */
    port: number;
    /**
     * 是否启用 SSL 安全连接 (端口 465 时设为 true)
     */
    secure: boolean;
    /**
     * 鉴权信息
     */
    auth: {
        user: string;
        pass: string;
    };
}

export type EmailAuth = ResendAuth | SmtpAuth;

/**
 * email服务数据库，目前只考虑resend和nodemailer+aliyun sftp
 */
export interface EmailAuthConfig {
    auth: EmailAuth;
}