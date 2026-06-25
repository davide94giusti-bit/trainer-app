import { z } from 'zod';
export const metricSchema = z.object({ customer_user_id: z.string().uuid(), measured_at: z.string(), weight_kg: z.coerce.number().positive().optional(), body_fat_percent: z.coerce.number().min(0).max(100).optional() });
