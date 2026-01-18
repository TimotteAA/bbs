import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as seeders from "./business";
import * as systemSeeders from "./system";

const runBussinessSeeders = async (db: BetterSQLite3Database<any>) => {
    for (const seederFn of Object.values(seeders)) {
        await seederFn(db)
    }
}

const runSystemSeeders = async (db: BetterSQLite3Database<any>) => {
    for (const seederFn of Object.values(systemSeeders)) {
        await seederFn(db);
    }
}

export {
    runBussinessSeeders,
    runSystemSeeders
}