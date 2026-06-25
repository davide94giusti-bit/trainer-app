import { z } from 'zod';
export const paymentSchema = z.object({ customer_user_id: z.string().uuid(), package_id: z.string().uuid(), amount: z.coerce.number().positive(), method: z.enum(['bank_transfer','stripe','cash','other']) });
