import { describe, expect, it } from 'vitest';
import { loginSchema, resetPasswordSchema } from '../src/validation/auth.schemas';
import { bookingSchema } from '../src/validation/booking.schemas';

describe('validation schemas', () => {
  it('validates login input', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
  });

  it('requires matching reset passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: 'password123', confirmPassword: 'password123' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: 'password123', confirmPassword: 'different123' }).success).toBe(false);
  });

  it('requires booking end after start', () => {
    expect(bookingSchema.safeParse({ requested_start: '2026-01-01T10:00', requested_end: '2026-01-01T11:00' }).success).toBe(true);
    expect(bookingSchema.safeParse({ requested_start: '2026-01-01T12:00', requested_end: '2026-01-01T11:00' }).success).toBe(false);
  });
});
