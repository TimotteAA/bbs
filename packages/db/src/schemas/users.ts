import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { $defaults } from "../clients/comon";


export const users = sqliteTable("users_table", {
  name: text({ length: 50 }).unique().notNull(),
  nickname: text({ length: 30 }),
  age: int(),
  email: text({ length: 100 }).unique().notNull(),
  passWordHash: text(), // empty for oauth2
  ...$defaults,

  role: text("role").default("user"),
});
