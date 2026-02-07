import { GitHub } from "arctic";
import { db } from "../db";
import { oauthAccount, user } from "@bbs/db";
import { eq, and } from "drizzle-orm";
import { lucia, generateId } from "../lib/lucia";

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

// 初始化 GitHub OAuth 客户端
export const github = GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET
  ? new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, null)
  : null;

// 存储 OAuth state（简单实现，生产环境应使用 Redis）
const stateStore = new Map<string, { createdAt: number }>();

/**
 * 生成 GitHub 授权 URL
 */
export async function createGitHubAuthorizationURL(): Promise<{ url: string; state: string } | null> {
  if (!github) {
    return null;
  }

  const state = generateId();
  const url = github.createAuthorizationURL(state, ["user:email"]);
  
  // 存储 state，5 分钟过期
  stateStore.set(state, { createdAt: Date.now() });
  
  // 清理过期的 state
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (now - value.createdAt > 5 * 60 * 1000) {
      stateStore.delete(key);
    }
  }

  return { url: url.toString(), state };
}

/**
 * 验证 state
 */
export function validateState(state: string): boolean {
  const stored = stateStore.get(state);
  if (!stored) return false;
  
  // 验证后删除
  stateStore.delete(state);
  
  // 检查是否过期（5 分钟）
  return Date.now() - stored.createdAt < 5 * 60 * 1000;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * 处理 GitHub OAuth 回调
 */
export async function handleGitHubCallback(
  code: string,
  state: string
): Promise<{ sessionId: string; user: any } | { error: string }> {
  if (!github) {
    return { error: "GitHub OAuth 未配置" };
  }

  // 验证 state
  if (!validateState(state)) {
    return { error: "无效的 state 参数" };
  }

  try {
    // 获取 access token
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // 获取 GitHub 用户信息
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const githubUser = await userResponse.json() as GitHubUser;

    // 获取用户邮箱（如果公开邮箱为空）
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails = await emailsResponse.json() as GitHubEmail[];
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail?.email || null;
    }

    if (!email) {
      return { error: "无法获取 GitHub 邮箱" };
    }

    const githubId = String(githubUser.id);

    // 查找是否已有关联账户
    const existingAccounts = await db
      .select()
      .from(oauthAccount)
      .where(
        and(
          eq(oauthAccount.provider, "github"),
          eq(oauthAccount.providerUserId, githubId)
        )
      )
      .limit(1);

    let userId: string;

    if (existingAccounts.length > 0) {
      // 已有账户，直接获取 userId
      userId = existingAccounts[0].userId;
      
      // 更新 token
      await db
        .update(oauthAccount)
        .set({ accessToken })
        .where(eq(oauthAccount.id, existingAccounts[0].id));
    } else {
      // 检查邮箱是否已被使用
      const existingUsers = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUsers.length > 0) {
        // 邮箱已存在，关联到现有用户
        userId = existingUsers[0].id;
      } else {
        // 创建新用户
        userId = generateId();
        await db.insert(user).values({
          id: userId,
          email,
          emailVerified: true, // GitHub 已验证邮箱
          username: githubUser.login,
          name: githubUser.name || githubUser.login,
        });
      }

      // 创建 OAuth 账户关联
      await db.insert(oauthAccount).values({
        id: generateId(),
        userId,
        provider: "github",
        providerUserId: githubId,
        accessToken,
      });
    }

    // 创建 session
    const sessionRecord = await lucia.createSession(userId, {});
    
    // 获取用户信息
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      sessionId: sessionRecord.id,
      user: users[0],
    };
  } catch (err: any) {
    console.error("[GitHub OAuth] Error:", err);
    return { error: err.message || "OAuth 处理失败" };
  }
}
