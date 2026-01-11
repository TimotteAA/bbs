import { integer } from "drizzle-orm/sqlite-core";

const $id = integer('id').primaryKey({ autoIncrement: true });

export const $createdAt = integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date());

export const $updatedAt = integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$onUpdate(() => new Date());

export const $ts = {
  createdAt: $createdAt,
  updatedAt: $updatedAt,
};

export const $defaults = {
  id: $id,
  ...$ts,
};