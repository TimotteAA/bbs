import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy,  } from '@trpc/tanstack-react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import type { AppRouter } from "@bbs/server";
import { authClient } from "./utils";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";


export const queryClient = new QueryClient();

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        // since we are using Vite, the server is running on the same port,
        // this means in dev the url is `http://localhost:3000/trpc`
        // and since its from the same origin, we don't need to explicitly set the full URL
        url: import.meta.env.VITE_TRPC_URL,
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
      authClient
    },
    defaultPendingComponent: () => (
      <div>
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
