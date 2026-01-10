import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from './router'








// // Create a new router instance
// const router = createRouter({
//   routeTree,
//   context: {
//     queryClient,
//     trpc: trpcClient,
//   },
//   defaultPreload: "intent",
//   scrollRestoration: true,
//   defaultStructuralSharing: true,
//   defaultPreloadStaleTime: 0,
// });


// Set up a Router instance
const router = createRouter()

const rootElement = document.getElementById('root')!
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}


