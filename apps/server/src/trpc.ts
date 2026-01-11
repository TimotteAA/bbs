// apps/server/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";



const t = initTRPC.context<Context>().create();

export const router = t.router;

// 公共接口
export const publicProcedure = t.procedure;
// 受限接口
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts;
  
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      // 这里的类型收窄 (Type Narrowing) 会生效
      user: ctx.user,
      session: ctx.session,
    },
  });
});