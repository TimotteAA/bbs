import { z } from "zod";

export const SystemConfigSchema = z.object({
    value: z.any(),
    valueType: z.enum(['string', 'number', 'boolean', 'object', 'array'])
})
export type SystemConfig = z.infer<typeof SystemConfigSchema>;
