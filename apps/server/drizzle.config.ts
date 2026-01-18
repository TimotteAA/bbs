import { defineConfig } from 'drizzle-kit';
import { resolve } from "node:path";


const dbFileName = process.env.DB_FILE_NAME || 'sqlite.db';
// 这里必须是绝对路径
const absolutePath = resolve(process.cwd(), dbFileName);

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schemas/index.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${absolutePath}`,
  },
});