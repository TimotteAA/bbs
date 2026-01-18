import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as seeders from "./business";

const runBussinessSeeders = async (db: BetterSQLite3Database<any>) => {
    for (const seederFn of Object.values(seeders)) {
        await seederFn(db)
    }
}

export {
    runBussinessSeeders
}