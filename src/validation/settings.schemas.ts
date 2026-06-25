import { z } from 'zod';
export const settingsSchema = z.object({ cancellation_window_hours: z.coerce.number().int().min(0), late_cancel_policy: z.enum(['consume_credit','do_not_consume','manual_review','warn_only']) });
