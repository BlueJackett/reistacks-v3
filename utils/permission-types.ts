export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: Object.values(Permissions) as Permission[],
  admin: [
    Permissions.ACCESS_DASHBOARD,
    Permissions.ACCESS_API,
    Permissions.VIEW_MEMBERS,
    Permissions.INVITE_MEMBERS,
    Permissions.REMOVE_MEMBERS,
    Permissions.VIEW_ANALYTICS,
    Permissions.VIEW_AUDIT_LOGS,
    Permissions.VIEW_INVOICES,
    Permissions.UPDATE_ORGANIZATION_SETTINGS,
    Permissions.MANAGE_CUSTOM_DOMAIN,
    Permissions.UPDATE_BRANDING,
    Permissions.CONFIGURE_INTEGRATIONS,
    Permissions.VIEW_API_KEYS,
    Permissions.EXPORT_DATA,
  ],
  member: [
    Permissions.ACCESS_DASHBOARD,
    Permissions.ACCESS_API,
    Permissions.VIEW_MEMBERS,
    Permissions.VIEW_ANALYTICS,
  ],
} as const;

// Role hierarchy for inheritance
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  owner: ['owner', 'admin', 'member'],
  admin: ['admin', 'member'],
  member: ['member'],
};