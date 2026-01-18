import { faker } from "@faker-js/faker";

import { users } from "../../schemas";
import { type SeederFunction } from "../types";

export type User = typeof users.$inferInsert;

// just non-null fields for default
export type UserDefault = {
    name: string;
    email: string;
}

export const userSeederFunction: SeederFunction<UserDefault> = async (db, count = 10) => {
    const userDefaults: UserDefault[] = Array.from({ length: count }).map(_ => ({
        name: faker.internet.username(),
        email: faker.internet.email(),
    }))
    console.log(`🚀 开始填充${count}个 users...`);
    await db.insert(users).values(userDefaults);
    console.log('✅ users填充完成');
}