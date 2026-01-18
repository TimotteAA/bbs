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
    key: text('key').notNull(), // e.g., 'email', 'storage', etc.
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
