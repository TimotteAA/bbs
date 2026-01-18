import { router } from "../trpc";
import { userRouter } from "./user";
import { emailRouter } from "./email";

export const appRouter = router({
  user: userRouter,
  email: emailRouter
});

export type AppRouter = typeof appRouter;