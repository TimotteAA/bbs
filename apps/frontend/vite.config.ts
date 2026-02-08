import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // 和 packages/components/tsconfig.json 中的 paths 保持一致
      // 与主项目进行区分
      "~@": fileURLToPath(
        new URL("../../packages/components/src", import.meta.url),
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  envDir: resolve(__dirname, "../../"),
  server: {
    proxy: {
      "/trpc": {
        target: "http://localhost:4000", // 转发给后端 Fastify
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
