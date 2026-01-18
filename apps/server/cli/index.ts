import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from 'better-sqlite3'; 
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { execSync } from "node:child_process"; 
import { runBussinessSeeders } from "@bbs/db/seeders";


const __filename = fileURLToPath(import.meta.url);

const main = async (command: string) => {
    // 1. 确保环境变量存在
    const DB_FILE_NAME = process.env['DB_FILE_NAME'];
    if (!DB_FILE_NAME) {
        throw new Error(`❌ 错误：没有查找到环境变量：DB_FILE_NAME`);
    }


    const dbUrl = resolve(process.cwd(), DB_FILE_NAME);
    const migrationFolder = resolve(process.cwd(), "./drizzle"); // 存放 SQL 文件的目录

    console.log(`📂 数据库路径: ${dbUrl}`);
    console.log(`📂 迁移文件目录: ${migrationFolder}`);

    const sqlite = new Database(dbUrl); 
    const db = drizzle(sqlite); 

    switch (command) {
        // 生成数据库迁移文件
        case "dbg": {
            console.log('🚀 正在对比 Schema 并生成 SQL...');
            try {
                execSync("npx drizzle-kit generate", { stdio: 'inherit' });
                console.log('✅ 生成完成');
            } catch (e) {
                console.error('❌ 生成失败', e);
            }
            break;
        }

        // 运行数据库迁移文件
        case "dbm": {
            console.log('🚀 开始应用数据库变更...');
            migrate(db, {
                migrationsFolder: migrationFolder,
            });
            
            console.log('✅ 数据库应用变更完成 (Migrated)');
            sqlite.close();
            break;
        }

        case "seed:business": {
            console.log(`🚀 开始填充业务数据...`);
            await runBussinessSeeders(db);
            console.log('✅ 业务数据填充完成');
            sqlite.close();
            break;
        }
        
        default: {
            console.error("❌❌ 未知命令 ❌❌")
        }
    }
}

if (process.argv[1] === __filename) {
    const command = process.argv[2];
    main(command);
}