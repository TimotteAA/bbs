
import { redirect } from '@tanstack/react-router';
import type { RouterContext } from '@/routes/__root';


// 获取 session（可复用）
export async function getSession({ trpc, queryClient }: RouterContext) {
  return queryClient.fetchQuery(trpc.auth.getSession.queryOptions());
}

// 守卫：必须登录
export async function requireAuth(ctx: RouterContext, redirectTo = '/auth') {
  const session = await getSession(ctx);
  if (!session.data?.user) {
    throw redirect({ to: redirectTo });
  }
  return session.data;
}

// 守卫：必须未登录（用于登录/注册页）
export async function requireGuest(ctx: RouterContext, redirectTo = '/') {
  const session = await getSession(ctx);
  if (session.data?.user) {
    throw redirect({ to: redirectTo });
  }
}