import type { Profile } from '../types/domain';

export function isAdmin(profile?: Pick<Profile, 'role' | 'status'> | null): boolean {
  return profile?.role === 'admin' && profile.status === 'active';
}

export function isCustomer(profile?: Pick<Profile, 'role' | 'status'> | null): boolean {
  return profile?.role === 'customer' && profile.status === 'active';
}

export function canManageFinancials(profile?: Pick<Profile, 'role' | 'status'> | null): boolean {
  return isAdmin(profile);
}

export function canReadOwnRecord(profile: Pick<Profile, 'id' | 'role' | 'status'> | null | undefined, ownerId: string): boolean {
  return !!profile && profile.status === 'active' && (profile.role === 'admin' || profile.id === ownerId);
}
