import { type SeederFunction } from "../types"
import { type EmailAuthConfig, systemConfigs } from "../../schemas";

// @ts-ignore
const { RESEND_API_KEY = ""} = process.env;

const resendAuthConfigs: EmailAuthConfig = 
    {
        auth: {
            type: "resend",
            apiKey: RESEND_API_KEY
        }
    }


type SystemConfigInsertType = typeof systemConfigs.$inferInsert;

const emails: Array<SystemConfigInsertType> = [
    {
        key: "email",
        provider: "resend",
        config: resendAuthConfigs,
        enabled: true
    }
]


export const seederSystemConfigs: SeederFunction<any> = async (db) => {
    console.log(`🚀 开始填充systemConfigs表...`);
    await db.insert(systemConfigs).values(emails);
    console.log('✅ systemConfigs填充完成');
}