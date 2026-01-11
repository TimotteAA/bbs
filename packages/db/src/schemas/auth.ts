import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { $defaults } from "../clients/comon";


export const session = sqliteTable("sessions", {
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
    ...$defaults,
});

// 账户表 (Account) - 用于 OAuth (GitHub/Google)
// export const account = sqliteTable("accounts", {
//   accountId: text("account_id").notNull(),
//   providerId: text("provider_id").notNull(),
//   userId: text("user_id")
//     .notNull()
//     .references(() => users.id),
//   accessToken: text("access_token"),
//   refreshToken: text("refresh_token"),
//   idToken: text("id_token"),
//   accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
//   refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
//   scope: text("scope"),
//   password: text("password"),
//   createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
//   updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
// });


export const verification = sqliteTable("verifications", {
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ...$defaults
});