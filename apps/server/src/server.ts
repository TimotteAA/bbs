import cors from "@fastify/cors";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { createContext } from "./context";
import { type AppRouter, appRouter } from "./routers";
import { email, redis } from "./plugins";

const server = Fastify({
	routerOptions: {
		maxParamLength: 50000,
	},
	logger: true
});

// use envs
const { SERVER_PREFIX = "/trpc", SERVER_PORT = 4000, FRONTEND_URL = 'http://localhost:3000' } = process.env;

(async () => {
	try {
		// 配置cors
		await server.register(cors, {
			origin: true,
			credentials: true, 
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		});
		// 配置email插件
		await server.register(email);
		// 配置redis插件
		await server.register(redis);

		// 3. 挂载trpc专属路径
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
