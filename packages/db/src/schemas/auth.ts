import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { z } from "zod";

// ============================================
// 通用字段定义
// ============================================
const $textId = text("id").primaryKey();

const $createdAt = integer("created_at", { mode: "timestamp" })
  .notNull()
  .$defaultFn(() => new Date());

const $updatedAt = integer("updated_at", { mode: "timestamp" })
  .notNull()
  .$onUpdate(() => new Date());

// ============================================
// 1. user - 用户表
// ============================================
export const user = sqliteTable("user", {
  id: $textId,
  email: text("email").unique().notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  username: text("username").unique(),
  passwordHash: text("password_hash"), // null for OAuth users
  name: text("name").notNull(),
  nickname: text("nickname"),
  role: text("role").default("user"),
  createdAt: $createdAt,
  updatedAt: $updatedAt,
});

// ============================================
// 2. session - Session 表 (Lucia 核心表)
// ============================================
export const session = sqliteTable("session", {
  id: $textId,
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp (秒)
});

// ============================================
// 3. oauthAccount - OAuth 账户关联
// ============================================
export const oauthAccount = sqliteTable("oauth_account", {
  id: $textId,
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'github'
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: $createdAt,
  updatedAt: $updatedAt,
}, (table) => [
  unique("oauth_provider_unique").on(table.provider, table.providerUserId),
]);

// ============================================
// 4. emailOtp - 验证码表
// ============================================
export const emailOtp = sqliteTable("email_otp", {
  id: $textId,
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(), // 'sign-in' | 'sign-up' | 'email-verification'
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: $createdAt,
});

// ============================================
// 类型导出
// ============================================
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type OAuthAccount = typeof oauthAccount.$inferSelect;
export type EmailOtp = typeof emailOtp.$inferSelect;

// ============================================
// Zod Schemas 
// ============================================

// 基础字段 schema
export const emailSchema = z
  .string({ error: "邮箱不能为空" })
  .min(1, "邮箱不能为空")
  .email("请输入有效的邮箱地址");

export const passwordSchema = z
  .string({ error: "密码不能为空" })
  .min(6, "密码至少需要6个字符")
  .max(100, "密码不能超过100个字符");

export const usernameSchema = z
  .string({ error: "用户名不能为空" })
  .min(3, "用户名至少需要3个字符")
  .max(30, "用户名不能超过30个字符")
  .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线和连字符");

export const nameSchema = z
  .string({ error: "昵称不能为空" })
  .min(1, "昵称不能为空")
  .max(50, "昵称不能超过50个字符");

export const otpCodeSchema = z
  .string({ error: "验证码不能为空" })
  .length(6, "验证码必须是6位数字");

export const otpTypeSchema = z.enum(["sign-in", "sign-up", "email-verification"], {
  error: "无效的验证码类型",
});

// ============================================
// 表单验证 Schemas
// ============================================

// 注册表单
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  username: usernameSchema.optional(),
});

// 邮箱密码登录表单
export const signInEmailSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "密码不能为空" }).min(1, "密码不能为空"),
});

// 用户名密码登录表单
export const signInUsernameSchema = z.object({
  username: z.string({ error: "用户名不能为空" }).min(1, "用户名不能为空"),
  password: z.string({ error: "密码不能为空" }).min(1, "密码不能为空"),
});

// 发送验证码表单
export const sendOtpSchema = z.object({
  email: emailSchema,
  type: otpTypeSchema,
});

// 验证OTP表单
export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  type: otpTypeSchema,
  name: nameSchema.optional(), // sign-up 时需要
});

// GitHub OAuth回调
export const githubCallbackSchema = z.object({
  code: z.string({ error: "授权码不能为空" }).min(1, "授权码不能为空"),
  state: z.string({ error: "状态参数不能为空" }).min(1, "状态参数不能为空"),
});

// ============================================
// Schema 类型导出
// ============================================
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInEmailInput = z.infer<typeof signInEmailSchema>;
export type SignInUsernameInput = z.infer<typeof signInUsernameSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type GithubCallbackInput = z.infer<typeof githubCallbackSchema>;
