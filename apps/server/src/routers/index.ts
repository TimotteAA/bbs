import { router } from "../trpc";
import { userRouter } from "./user";
import { emailRouter } from "./email";
import { authRouter } from "./auth";

export const appRouter = router({
  user: userRouter,
  email: emailRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;