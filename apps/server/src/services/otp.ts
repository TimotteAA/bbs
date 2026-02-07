import { db } from "../db";
import { emailOtp } from "@bbs/db";
import { eq, and, gt } from "drizzle-orm";
import { generateId } from "../lib/lucia";
import type { EmailSender } from "../plugins/email";

const OTP_EXPIRES_IN = 5 * 60 * 1000; // 5 分钟

export type OtpType = "sign-in" | "sign-up" | "email-verification";

/**
 * 生成 6 位数字验证码
 */
function generateOtpCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, "0");
}

/**
 * 创建并发送 OTP
 */
export async function createAndSendOtp(
  email: string,
  type: OtpType,
  emailSender: EmailSender
): Promise<{ success: boolean; error?: string }> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN);

  // 插入验证码记录
  await db.insert(emailOtp).values({
    id: generateId(),
    email,
    code,
    type,
    expiresAt,
    used: false,
  });

  // 发送邮件
  const subjectMap: Record<OtpType, string> = {
    "sign-in": "登录验证码",
    "sign-up": "注册验证码",
    "email-verification": "邮箱验证码",
  };

  const htmlContent = `<div>
    <h2>您的验证码</h2>
    <p style="font-size: 24px; font-weight: bold; color: #1890ff;">${code}</p>
    <p>验证码有效期为 5 分钟，请尽快使用。</p>
  </div>`;

  try {
    await emailSender.send(
      process.env.EMAIL_FROM || "noreply@example.com",
      email,
      subjectMap[type],
      htmlContent
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 验证 OTP
 */
export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<{ valid: boolean; error?: string }> {
  const now = new Date();

  // 查找未使用且未过期的验证码
  const records = await db
    .select()
    .from(emailOtp)
    .where(
      and(
        eq(emailOtp.email, email),
        eq(emailOtp.code, code),
        eq(emailOtp.type, type),
        eq(emailOtp.used, false),
        gt(emailOtp.expiresAt, now)
      )
    )
    .limit(1);

  if (records.length === 0) {
    return { valid: false, error: "验证码无效或已过期" };
  }

  // 标记为已使用
  await db
    .update(emailOtp)
    .set({ used: true })
    .where(eq(emailOtp.id, records[0].id));

  return { valid: true };
}
