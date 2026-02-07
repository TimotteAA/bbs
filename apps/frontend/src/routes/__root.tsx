
// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext,  } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'


import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@bbs/server'

// 定义 Context 接口
export interface RouterContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}

// 创建并导出根路由
export const Route = createRootRouteWithContext<RouterContext>()({
component: () => (
    <>
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  ),
})


