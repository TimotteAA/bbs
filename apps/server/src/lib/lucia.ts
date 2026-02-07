import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db";
import { user, session } from "@bbs/db";

// 创建 Drizzle 适配器
const adapter = new DrizzleSQLiteAdapter(db, session, user);

// 初始化 Lucia
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      emailVerified: attributes.emailVerified,
      username: attributes.username,
      name: attributes.name,
      nickname: attributes.nickname,
      role: attributes.role,
    };
  },
});

// 声明 Lucia 类型
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  emailVerified: boolean;
  username: string | null;
  name: string;
  nickname: string | null;
  role: string | null;
}

// 生成唯一 ID
export function generateId(): string {
  return crypto.randomUUID();
}
