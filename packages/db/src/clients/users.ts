import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { users } from '../schemas';

export const CreateUserSchema = createInsertSchema(users);
export const updateUserSchema = createUpdateSchema(users);