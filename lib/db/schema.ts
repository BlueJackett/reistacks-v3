import
  {
    pgTable,
    text,
    timestamp,
    varchar,
    uniqueIndex,
    integer,
    boolean,
    pgEnum,
    serial,
    uuid,
  } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the role enum type
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);
// New: Define permission type
export const permissionEnum = pgEnum('permission', [
  'manage_organization',
  'update_organization_settings',
  'delete_organization',
  'view_members',
  'invite_members',
  'remove_members',
  'update_member_roles',
  'manage_billing',
  'view_invoices',
  'update_subscription',
  'manage_api_keys',
  'view_api_keys',
  'manage_custom_domain',
  'update_branding',
  'configure_integrations',
  'view_analytics',
  'export_data',
  'view_audit_logs',
  'access_dashboard',
  'access_api'
]);

// New: Permissions table
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// New: Role-Permission mapping table
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull(),
  permission: permissionEnum('permission').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// New: Custom role permissions per organization
export const organizationRoles = pgTable('organization_roles', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  isCustom: boolean('is_custom').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Add relations for new tables
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [rolePermissions.permission],
    references: [permissions.name],
  }),
  organization: one(organizations, {
    fields: [rolePermissions.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationRolesRelations = relations(organizationRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationRoles.organizationId],
    references: [organizations.id],
  }),
}));

// --- Organizations (The Core of Multi-Tenancy) ---
export const organizations = pgTable(
  'organizations',
  {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    subdomain: varchar('subdomain', { length: 255 }).notNull().unique(),
    customDomain: varchar( 'custom_domain', { length: 255 } ),
    
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id'),
    subscriptionStatus: varchar('subscription_status', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    subdomainIdx: uniqueIndex('subdomain_idx').on(table.subdomain),
  })
);

export const organizationsRelations = relations( organizations, ( { many } ) => ( {
  profiles: many(profiles),
  leads: many(leads),
  activityLogs: many(activityLogs),
  customDomains: many(customDomains),
  leadPages: many(leadPages),
  subscriptions: many(subscriptions),
  dripCampaigns: many(dripCampaigns),
} ) );

// --- Profiles (Linked to Supabase Auth.Users) ---
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // UUID from auth.users
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: roleEnum('role').notNull().default('member'),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [profiles.organizationId],
    references: [organizations.id],
  }),
  invitationsSent: many(invitations)
}));


// --- Leads (Belong to an Organization) ---
export const leads = pgTable( 'leads', {
  id: serial( 'id' ).primaryKey(),
  organizationId: text( 'organization_id' )
    .notNull()
    .references( () => organizations.id ),
  name: varchar( 'name', { length: 255 } ),
  email: varchar( 'email', { length: 255 } ),
  phone: varchar( 'phone', { length: 20 } ),
  message: text( 'message' ),
  assignedTo: uuid('assigned_to').references(() => profiles.id), // VA assigned to this lead
  status: varchar('status', { length: 20 }).notNull().default('new'), // e.g., "new", "contacted", "closed"
  followUpDate: timestamp('follow_up_date', { withTimezone: true }), // When the VA should follow up
  createdAt: timestamp( 'created_at', { withTimezone: true } ).notNull().defaultNow(),
  updatedAt: timestamp( 'updated_at', { withTimezone: true } ).notNull().defaultNow(),
} );

export const leadsRelations = relations( leads, ( { one } ) => ( {
  organization: one( organizations, {
    fields: [ leads.organizationId ],
    references: [ organizations.id ],
  } ),
} ) );

// --- Drip Campaigns (Belong to an Organization) ---
export const dripCampaigns = pgTable('drip_campaigns', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  triggerEvent: varchar('trigger_event', { length: 50 }), // e.g., "lead_created"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dripCampaignSteps = pgTable('drip_campaign_steps', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => dripCampaigns.id),
  type: varchar('type', { length: 20 }).notNull(), // e.g., "email", "sms"
  content: text('content').notNull(), // Message content
  delay: integer('delay').notNull(), // Delay in hours after previous step
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


export const dripCampaignsRelations = relations(dripCampaigns, ({ many }) => ({
  steps: many(dripCampaignSteps),
}));

export const dripCampaignStepsRelations = relations(dripCampaignSteps, ({ one }) => ({
  campaign: one(dripCampaigns, {
    fields: [dripCampaignSteps.campaignId],
    references: [dripCampaigns.id],
  }),
} ) );

// --- Invitations ---
export const invitations = pgTable( 'invitations', {
  id: serial( 'id' ).primaryKey(),
  organizationId: text( 'organization_id' ).notNull().references( () => organizations.id ),
  email: varchar( 'email', { length: 255 } ).notNull(),
  role: varchar( 'role', { length: 50 } ).notNull(),
  invitedBy: uuid( 'invited_by' ).notNull().references( () => profiles.id ),
  invitedAt: timestamp( 'invited_at', { withTimezone: true } ).notNull().defaultNow(),
  status: varchar( 'status', { length: 20 } ).notNull().default( 'pending' ),
} );

export const invitationsRelations = relations( invitations, ( { one } ) => ( {
  organization: one( organizations, {
    fields: [ invitations.organizationId ],
    references: [ organizations.id ],
  } ),
  invitedBy: one( profiles, {
    fields: [ invitations.invitedBy ],
    references: [ profiles.id ]
  } )
} ) );

// --- Activity Logs (Belong to an Organization) ---
export const activityLogs = pgTable( 'activity_logs', {
  id: serial( 'id' ).primaryKey(),
  organizationId: text( 'organization_id' )
    .notNull()
    .references( () => organizations.id ),
  userId: uuid( 'user_id' ).references( () => profiles.id ),
  action: text( 'action' ).notNull(),
  timestamp: timestamp( 'timestamp', { withTimezone: true } ).notNull().defaultNow(),
  campaignId: integer('campaign_id').references(() => dripCampaigns.id),
  stepId: integer('step_id').references(() => dripCampaignSteps.id),
  ipAddress: varchar( 'ip_address', { length: 45 } ),
} );

export const activityLogsRelations = relations( activityLogs, ( { one } ) => ( {
  organization: one( organizations, {
    fields: [ activityLogs.organizationId ],
    references: [ organizations.id ],
  } ),
  user: one( profiles, {
    fields: [ activityLogs.userId ],
    references: [ profiles.id ],
  } ),
} ) );


// --- Custom Domains (Belong to an Organization) ---
export const customDomains = pgTable('custom_domains', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  verificationCode: text('verification_code').notNull(), // For DNS TXT record verification
  verified: boolean('verified').notNull().default(false),
  primary: boolean('primary').notNull().default(false), // Mark as primary domain for SEO
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const customDomainsRelations = relations(customDomains, ({ one }) => ({
  organization: one(organizations, {
    fields: [customDomains.organizationId],
    references: [organizations.id],
  }),
} ) );

// --- Lead Pages (Belong to an Organization) ---

export const leadPages = pgTable('lead_pages', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  slug: varchar('slug', { length: 255 }).notNull(), // URL slug for the page
  title: varchar('title', { length: 255 }).notNull(), // Page title for SEO
  metaDescription: text( 'meta_description' ), // Meta description for SEO
  city: varchar('city', { length: 100 }), // e.g., "Austin"
  state: varchar('state', { length: 100 }), // e.g., "Texas"
  country: varchar('country', { length: 100 }), // e.g., "USA"
  zipCode: varchar('zip_code', { length: 20 }), // e.g., "78701"
  geoJson: text('geo_json'), // GeoJSON for map integration
  schemaMarkup: text('schema_markup'), // Structured data for local SEO
  content: text('content').notNull(), // JSON or HTML content for the page
  published: boolean('published').notNull().default(false), // Whether the page is live
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


export const leadPagesRelations = relations(leadPages, ({ one }) => ({
  organization: one(organizations, {
    fields: [leadPages.organizationId],
    references: [organizations.id],
  }),
} ) );

//


// --- Subscriptions (Belong to an Organization) ---
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references( () => organizations.id ),
  trialStart: timestamp('trial_start', { withTimezone: true }),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  planId: text('plan_id').notNull(), // Stripe plan ID (e.g., "price_123")
  status: varchar('status', { length: 20 }).notNull(), // e.g., "active", "trialing", "canceled"
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
} ) );

// --- Types (for TypeScript) ---
export type Role = typeof roleEnum.enumValues[number];
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Permission = typeof permissionEnum.enumValues[number];
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type OrganizationRole = typeof organizationRoles.$inferSelect;
export type NewOrganizationRole = typeof organizationRoles.$inferInsert;
export enum ActivityType
{
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}


