import { Role } from '@/lib/db/schema';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from './permission-types';

export type Permission = 'manage_organization' | 'manage_billing' | 'manage_members' | 'manage_invites' | 'access_all' | 'access_assigned';

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class RoleManager {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }

  /**
   * Check if a role has all of the specified permissions
   */
  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role has any of the specified permissions
   */
  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if one role is superior to another in the hierarchy
   */
  static isRoleSuperiorTo(role: Role, compareRole: Role): boolean {
    return ROLE_HIERARCHY[role].includes(compareRole);
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Check if a role can modify another role
   */
  static canModifyRole(actorRole: Role, targetRole: Role): boolean {
    return this.isRoleSuperiorTo(actorRole, targetRole) && actorRole !== targetRole;
  }

  /**
   * Get all roles that a given role can assign
   */
  static getAssignableRoles(role: Role): Role[] {
    return ROLE_HIERARCHY[role].filter(r => r !== 'owner');
  }
}

export class PermissionChecker {
  private role: Role;

  constructor(role: Role) {
    this.role = role;
  }

  /**
   * Check if the role has the required permission
   */
  can(permission: Permission): boolean {
    return RoleManager.hasPermission(this.role, permission);
  }

  /**
   * Check if the role has all the required permissions
   */
  canAll(permissions: Permission[]): boolean {
    return RoleManager.hasAllPermissions(this.role, permissions);
  }

  /**
   * Check if the role has any of the specified permissions
   */
  canAny(permissions: Permission[]): boolean {
    return RoleManager.hasAnyPermission(this.role, permissions);
  }

  /**
   * Assert that the role has the required permission
   */
  assert(permission: Permission, message?: string): void {
    if (!this.can(permission)) {
      throw new PermissionError(
        message || `Permission denied: ${permission} is required`
      );
    }
  }

  /**
   * Assert that the role has all required permissions
   */
  assertAll(permissions: Permission[], message?: string): void {
    if (!this.canAll(permissions)) {
      throw new PermissionError(
        message || `Permission denied: all of [${permissions.join(', ')}] are required`
      );
    }
  }

  /**
   * Assert that the role has any of the specified permissions
   */
  assertAny(permissions: Permission[], message?: string): void {
    if (!this.canAny(permissions)) {
      throw new PermissionError(
        message || `Permission denied: at least one of [${permissions.join(', ')}] is required`
      );
    }
  }
}