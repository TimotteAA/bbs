import { int, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { $defaults } from "../clients/common";


export const users = sqliteTable("users_table", {
  name: text({ length: 50 }).unique().notNull(),
  nickname: text({ length: 30 }),
  age: int(),
  email: text({ length: 100 }).unique().notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false), 
  passWordHash: text(), // empty for oauth2
  ...$defaults,

  description: text({ length: 300 }),
  role: text("role").default("user"),
});
