import { defineConfig } from 'drizzle-kit';
import { resolve } from "node:path";
import schemas from "@bbs/db";

// 1. 获取纯净的绝对文件系统路径 (不要带 file:)
// 假设 process.env.DB_FILE_NAME 现在只是 "sqlite.db"
const dbFileName = process.env.DB_FILE_NAME || 'sqlite.db';
const absolutePath = resolve(process.cwd(), dbFileName);

console.log("File System Path:", absolutePath); 
// 输出应该类似: /home/timotte/projects/bbs/apps/server/sqlite.db

export default defineConfig({
  out: './drizzle',
  schema: './src/db/index.ts',
  dialect: 'sqlite',
  dbCredentials: {
    // 2. 在这里添加 file: 协议，做成标准的 Absolute URL
    // 注意：绝对路径前面通常加 file: 即可，或者更规范的 file://
    url: `file:${absolutePath}`,
  },
});