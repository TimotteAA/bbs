import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { lucia } from "./lib/lucia";
import type { Session, User } from "lucia";

export const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  const email = req.server.email;

  // 从 cookie 中获取 session ID
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  let user: User | null = null;
  let session: Session | null = null;

  if (sessionId) {
    const result = await lucia.validateSession(sessionId);
    user = result.user;
    session = result.session;

    // 如果 session 接近过期，刷新它
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      res.header("Set-Cookie", sessionCookie.serialize());
    }
    // 如果 session 无效，清除 cookie
    if (!session) {
      const blankCookie = lucia.createBlankSessionCookie();
      res.header("Set-Cookie", blankCookie.serialize());
    }
  }

  return {
    req,
    res,
    user,
    session,
    email,
  };
};

// 推导 Context 对象的类型
export type Context = Awaited<ReturnType<typeof createContext>>;