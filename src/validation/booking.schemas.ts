import { z } from 'zod';
export const bookingSchema = z.object({ requested_start: z.string().min(1), requested_end: z.string().min(1), notes: z.string().optional() }).refine(v => new Date(v.requested_start) < new Date(v.requested_end), { path: ['requested_end'], message: 'End must be after start' });
