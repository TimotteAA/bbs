// apps/web/src/utils/trpc.ts

import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy,  } from '@trpc/tanstack-react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
// 关键：直接从 workspace 导入后端的类型！
// 这里的路径取决于你 apps/server/package.json 里的 name 和 exports
import type { AppRouter } from "@bbs/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// 1. 创建 React Hooks 实例 (组件内用)
// export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient();


// 2. 创建纯客户端实例 (Loader 内用)
// // TanStack Router 的 loader 运行在组件渲染前，所以不能用 Hooks
// export const trpcClient = createTRPCOptionsProxy<AppRouter>({
//   links: [
//     httpBatchLink({
//       url: "http://localhost:4000/trpc", // 指向你的 Fastify 后端

//       // 如果需要 Auth Token，可以在这里加 headers
//       // headers() {
//       //   return {
//       //     Authorization: localStorage.getItem('token'),
//       //   };
//       // },
//     }),
//   ],
//   queryClient
// });

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        // since we are using Vite, the server is running on the same port,
        // this means in dev the url is `http://localhost:3000/trpc`
        // and since its from the same origin, we don't need to explicitly set the full URL
        url: 'http://localhost:4000/trpc',
      }),
    ],
  }),
  queryClient,
})

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    context: {
      trpc,
      queryClient,
    },
    defaultPendingComponent: () => (
      <div className={`p-2 text-2xl`}>
        loading....
      </div>
    ),
    Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    },
  })

  return router
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
