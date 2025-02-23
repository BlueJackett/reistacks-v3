'use client';


import { Role } from '@/lib/db/schema';

import { RoleManager, PermissionChecker } from './permission-helpers';
import { requireAuth } from '@/lib/auth/middleware';
import { useAuth } from './supabase/supabase-hooks';
import { Permission } from './permissions';

/**
 * React hook for checking permissions
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'member';

  return {
    can: (permission: Permission) => RoleManager.hasPermission(role, permission),
    canAll: (permissions: Permission[]) => RoleManager.hasAllPermissions(role, permissions),
    canAny: (permissions: Permission[]) => RoleManager.hasAnyPermission(role, permissions),
    permissions: RoleManager.getRolePermissions(role),
    role,
  };
}

/**
 * Server-side middleware for checking permissions
 */
export function withPermission(permission: Permission) {
  return async (formData: FormData) => {
    const profile = await requireAuth();
    const checker = new PermissionChecker(profile.role);
    
    checker.assert(permission);
    
    return profile;
  };
}

/**
 * Server-side middleware for checking multiple permissions (all required)
 */
export function withPermissions(permissions: Permission[]) {
  return async (formData: FormData) => {
    const profile = await requireAuth();
    const checker = new PermissionChecker(profile.role);
    
    checker.assertAll(permissions);
    
    return profile;
  };
}

/**
 * Server-side middleware for checking multiple permissions (any required)
 */
export function withAnyPermission(permissions: Permission[]) {
  return async (formData: FormData) => {
    const profile = await requireAuth();
    const checker = new PermissionChecker(profile.role);
    
    checker.assertAny(permissions);
    
    return profile;
  };
}

/**
 * Helper function to get UI elements based on permissions
 */
