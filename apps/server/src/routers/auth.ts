import { eq } from "drizzle-orm";

import {
  user,
  signUpSchema,
  signInEmailSchema,
  signInUsernameSchema,
  sendOtpSchema,
  verifyOtpSchema,
  githubCallbackSchema,
} from "@bbs/db";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "../db";
import { lucia, generateId, hashPassword, verifyPassword, ok, fail, type ApiResponse } from "../lib";
import {
  createGitHubAuthorizationURL,
  handleGitHubCallback,
  createAndSendOtp, 
  verifyOtp
} from "../services";



export const authRouter = router({
  // 邮箱密码注册
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse> => {
      // 检查邮箱是否已存在
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        return fail("邮箱已被注册");
      }

      // 如果提供了 username，检查是否已存在
      if (input.username) {
        const existingUsername = await db
          .select()
          .from(user)
          .where(eq(user.username, input.username))
          .limit(1);

        if (existingUsername.length > 0) {
          return fail("用户名已被使用");
        }
      }

      // 创建用户
      const userId = generateId();
      const passwordHash = await hashPassword(input.password);

      await db.insert(user).values({
        id: userId,
        email: input.email,
        passwordHash,
        name: input.name,
        username: input.username ?? null,
        emailVerified: false,
      });

      // 创建 session
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      // 设置 cookie
      ctx.res.header("Set-Cookie", sessionCookie.serialize());

      return ok();
    }),

  // 邮箱密码登录
  signInEmail: publicProcedure
    .input(signInEmailSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse> => {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (users.length === 0 || !users[0].passwordHash) {
        return fail("邮箱或密码错误");
      }

      const valid = await verifyPassword(users[0].passwordHash, input.password);
      if (!valid) {
        return fail("邮箱或密码错误");
      }

      const session = await lucia.createSession(users[0].id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      ctx.res.header("Set-Cookie", sessionCookie.serialize());

      return ok();
    }),

  // 用户名密码登录
  signInUsername: publicProcedure
    .input(signInUsernameSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse> => {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.username, input.username))
        .limit(1);

      if (users.length === 0 || !users[0].passwordHash) {
        return fail("用户名或密码错误");
      }

      const valid = await verifyPassword(users[0].passwordHash, input.password);
      if (!valid) {
        return fail("用户名或密码错误");
      }

      const session = await lucia.createSession(users[0].id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      ctx.res.header("Set-Cookie", sessionCookie.serialize());

      return ok();
    }),

  // 发送验证码 OTP
  sendOtp: publicProcedure
    .input(sendOtpSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse> => {
      // sign-up 时检查邮箱是否已存在
      if (input.type === "sign-up") {
        const existing = await db
          .select()
          .from(user)
          .where(eq(user.email, input.email))
          .limit(1);

        if (existing.length > 0) {
          return fail("邮箱已被注册");
        }
      }

      // sign-in 时检查邮箱是否存在
      if (input.type === "sign-in") {
        const existing = await db
          .select()
          .from(user)
          .where(eq(user.email, input.email))
          .limit(1);

        if (existing.length === 0) {
          return fail("该邮箱未注册");
        }
      }

      const result = await createAndSendOtp(input.email, input.type, ctx.email);

      if (!result.success) {
        return fail(result.error || "发送验证码失败");
      }

      return ok();
    }),

  // 验证 OTP 并登录/注册
  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse> => {
      const result = await verifyOtp(input.email, input.code, input.type);

      if (!result.valid) {
        return fail(result.error || "验证码无效");
      }

      // sign-up: 创建新用户
      if (input.type === "sign-up") {
        const userId = generateId();
        await db.insert(user).values({
          id: userId,
          email: input.email,
          name: input.name || input.email.split("@")[0],
          emailVerified: true,
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        ctx.res.header("Set-Cookie", sessionCookie.serialize());

        return ok();
      }

      // sign-in: 直接登录
      if (input.type === "sign-in") {
        const users = await db
          .select()
          .from(user)
          .where(eq(user.email, input.email))
          .limit(1);

        if (users.length === 0) {
          return fail("用户不存在");
        }

        const session = await lucia.createSession(users[0].id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        ctx.res.header("Set-Cookie", sessionCookie.serialize());

        return ok();
      }

      // email-verification: 标记邮箱已验证
      if (input.type === "email-verification") {
        await db
          .update(user)
          .set({ emailVerified: true })
          .where(eq(user.email, input.email));

        return ok();
      }

      return ok();
    }),

  // GitHub OAuth 获取授权 URL
  githubAuthorize: publicProcedure.query(async (): Promise<ApiResponse<{ url: string; state: string } | null>> => {
    const result = await createGitHubAuthorizationURL();

    if (!result) {
      return fail("GitHub OAuth 未配置");
    }

    return ok(result);
  }),

  // GitHub OAuth 回调处理
  githubCallback: publicProcedure
    .input(githubCallbackSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse<{ user: any } | null>> => {
      const result = await handleGitHubCallback(input.code, input.state);

      if ("error" in result) {
        return fail(result.error);
      }

      const sessionCookie = lucia.createSessionCookie(result.sessionId);
      ctx.res.header("Set-Cookie", sessionCookie.serialize());

      return ok({ user: result.user });
    }),

  // 获取当前用户信息
  getSession: publicProcedure.query(async ({ ctx }): Promise<ApiResponse<{ user: any; session: any }>> => {
    return ok({
      user: ctx.user,
      session: ctx.session,
    });
  }),

  // 退出登录
  signOut: protectedProcedure.mutation(async ({ ctx }): Promise<ApiResponse> => {
    await lucia.invalidateSession(ctx.session.id);
    const blankCookie = lucia.createBlankSessionCookie();
    ctx.res.header("Set-Cookie", blankCookie.serialize());

    return ok();
  }),
});
