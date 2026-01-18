import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { auth } from "./auth";

export const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  const session = await auth.api.getSession({
    headers: req.headers 
  });
  const email = req.server.email;

  return {
    req,
    res,
    user: session?.user ?? null,
    session: session?.session ?? null,
    email
  };
};

// 2. [关键] 推导 Context 对象的类型
export type Context = Awaited<ReturnType<typeof createContext>>;