import { describe, expect, it } from 'vitest';
import { canManageFinancials, canReadOwnRecord, isAdmin, isCustomer } from '../src/lib/permissions';

const admin: any = { id: 'admin-id', role: 'admin', status: 'active' };
const customer: any = { id: 'customer-id', role: 'customer', status: 'active' };
const deactivated: any = { id: 'x', role: 'admin', status: 'deactivated' };

describe('permission helpers', () => {
  it('recognizes active admins only', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(customer)).toBe(false);
    expect(isAdmin(deactivated)).toBe(false);
  });

  it('recognizes active customers only', () => {
    expect(isCustomer(customer)).toBe(true);
    expect(isCustomer(admin)).toBe(false);
  });

  it('restricts financial management to admins', () => {
    expect(canManageFinancials(admin)).toBe(true);
    expect(canManageFinancials(customer)).toBe(false);
  });

  it('allows admins or owners to read records', () => {
    expect(canReadOwnRecord(admin, 'any-id')).toBe(true);
    expect(canReadOwnRecord(customer, 'customer-id')).toBe(true);
    expect(canReadOwnRecord(customer, 'other-id')).toBe(false);
  });
});
