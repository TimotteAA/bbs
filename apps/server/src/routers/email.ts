import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const { EMAIL_FROM } = process.env;

export const emailRouter = router({
  // 定义一个 Mutation (POST)
  send: publicProcedure
    .input(
      z.object({
        to: z.email(),
      })
    )
    .mutation(({ input, ctx }) => {
      return ctx.email.send(EMAIL_FROM, input.to, "测试邮件", "hahahahah")
    }),
});
