import { z } from 'zod';
export const customerSchema = z.object({ email: z.string().email(), full_name: z.string().min(2), phone: z.string().optional(), objective: z.string().optional() });
