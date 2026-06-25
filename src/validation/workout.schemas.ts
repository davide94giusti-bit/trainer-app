import { z } from 'zod';
export const workoutPlanSchema = z.object({ title: z.record(z.string()).or(z.object({ en: z.string().min(2) })), status: z.enum(['draft','active','archived']).default('draft') });
