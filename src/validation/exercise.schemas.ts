import { z } from 'zod';
export const exerciseSchema = z.object({ name: z.object({ en: z.string().min(2), es: z.string().optional(), it: z.string().optional() }), category: z.string().optional(), difficulty: z.enum(['beginner','intermediate','advanced']) });
