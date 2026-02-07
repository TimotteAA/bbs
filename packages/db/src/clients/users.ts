import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { user } from '../schemas';

export const CreateUserSchema = createInsertSchema(user);
export const updateUserSchema = createUpdateSchema(user);