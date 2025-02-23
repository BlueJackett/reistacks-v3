// utils/permissions.ts
import { Role } from '@/lib/db/schema';

export const ROLE_PERMISSIONS = {
  owner: ['manage_organization', 'manage_billing', 'manage_members', 'manage_invites', 'access_all'],
  admin: ['manage_members', 'manage_invites', 'access_all'],
  member: ['access_assigned']
} as const;

export type Permission = typeof ROLE_PERMISSIONS[Role][number];

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}