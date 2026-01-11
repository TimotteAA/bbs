import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import cors from "@fastify/cors";

import { createContext } from "./context";
import { appRouter, type AppRouter } from "./routers";
const server = fastify({
  routerOptions: {
    maxParamLength: 50000,
  },
});

// use envs
const { 
  SERVER_PREFIX = "/trpc",
  SERVER_PORT = 4000
} = process.env;

(async () => {


  try {
    // 2. [关键] 在注册 tRPC 之前注册 CORS
    await server.register(cors, {
      // 允许所有来源（开发环境方便），或者指定前端地址 ["http://localhost:5173"]
      origin: true, 
      credentials: true, // 如果你需要传 cookie/token 必须开启
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // 3. 注册 tRPC
    await server.register(fastifyTRPCPlugin, {
      prefix: SERVER_PREFIX,
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error }) {
          console.error(`Error in tRPC handler on path '${path}':`, error);
        },
      } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
    });

    await server.listen({ port: Number(SERVER_PORT) });
    console.log("Server start to listen on 4000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();