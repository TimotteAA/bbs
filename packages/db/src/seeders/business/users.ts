import { faker } from "@faker-js/faker";

import { user } from "../../schemas";
import { type SeederFunction } from "../types";

export type UserType = typeof user.$inferInsert;

// just non-null fields for default
export type UserDefault = {
    id: string;
    name: string;
    email: string;
}

export const userSeederFunction: SeederFunction<UserDefault> = async (db, count = 10) => {
    const userDefaults: UserDefault[] = Array.from({ length: count }).map(_ => ({
        id: crypto.randomUUID(),
        name: faker.internet.username(),
        email: faker.internet.email(),
    }))
    console.log(`🚀 开始填充${count}个 users...`);
    await db.insert(user).values(userDefaults);
    console.log('✅ users填充完成');
}