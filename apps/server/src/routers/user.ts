import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export interface User {
  id: number;
  name: string;
  role: Role;
}

const users: User[] = [
  {
    id: 1,
    name: "Super Admin",
    role: Role.ADMIN,
  },
];


export const userRouter = router({
  // 定义一个 Query (GET)
  byId: publicProcedure
    .input(
      z.object({ id: z.number(), name: z.string().trim(), role: z.enum(Role) })
    )
    .query(({ input, ctx }) => {
      const user = users.find((u) => u.id === input.id);
      if (!user) {
        return {
          success: false,
          message: "User does not exists!",
        };
      }
      return {
        success: true,
        message: "User Exists",
        data: user,
      };
    }),
  users: publicProcedure.query(async ({ ctx }) => {
    return users;
  }),

  // 定义一个 Mutation (POST)
  create: publicProcedure
    .input(
      z.object({ id: z.number(), name: z.string().trim(), role: z.enum(Role) })
    )
    .mutation(({ input }) => {
      if (!users.find((u) => u.id === input.id)) {
        users.push(input);
        return {
          success: true,
          message: "Create user successfully!",
        };
      } else {
        return {
          success: false,
          message: "User Exists",
        };
      }
    }),
});
