// apps/server/src/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users, session, verification } from "@bbs/db"; 

import { db } from "./db";


export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
        user: users,
        session,
        verification
    }, 
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ['http://172.25.166.121:3000', 'http://localhost:3000'],
});