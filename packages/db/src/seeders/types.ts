import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// --- 定义 ---
export type SeederFunction<T extends Record<string, any>> = (
    db: BetterSQLite3Database<any>,
    count?: number,
    defaults?: T
) => Promise<void>;
