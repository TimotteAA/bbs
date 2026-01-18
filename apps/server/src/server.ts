import cors from "@fastify/cors";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { toNodeHandler } from "better-auth/node";
import { createContext } from "./context";
import { type AppRouter, appRouter } from "./routers";
import { auth } from "./auth";
import { email } from "./plugins";

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
		// 2. 配置cors
		await server.register(cors, {
			origin: true,
			credentials: true, 
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		});
		// 配置email
		await server.register(email)

		// 3. 配置better-auth
		// Register authentication endpoint
		server.route({
			method: ["GET", "POST"],
			url: "/api/auth/*",
			async handler(request, reply) {
				try {
				// Construct request URL
				const url = new URL(request.url, `http://${request.headers.host}`);
				
				// Convert Fastify headers to standard Headers object
				const headers = new Headers();
				Object.entries(request.headers).forEach(([key, value]) => {
					if (value) headers.append(key, value.toString());
				});
				// Create Fetch API-compatible request
				const req = new Request(url.toString(), {
					method: request.method,
					headers,
					...(request.body ? { body: JSON.stringify(request.body) } : {}),
				});
				// Process authentication request
				const response = await auth.handler(req);
				// Forward response to client
				reply.status(response.status);
				response.headers.forEach((value, key) => reply.header(key, value));
				reply.send(response.body ? await response.text() : null);
				} catch (error: any) {
				reply.status(500).send({ 
					error: "Internal authentication error",
					code: "AUTH_FAILURE"
				});
				}
			}
		});

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
