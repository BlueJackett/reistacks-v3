'use server';

import { desc, and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { db } from './drizzle';
import { activityLogs, profiles, organizations } from './schema';
import { createClient } from '@/utils/supabase/server';



export async function getProfile ()
{
  const supabase = createClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile.length === 0) {
    return null;
  }

  return profile[0];
}

export async function getOrganizationByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateOrganizationSubscription(
  organizationId: string,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(organizations)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));
}

export async function getProfileWithOrg(profileId: string) {
  const result = await db
    .select({
      profile: profiles,
      organization: organizations,
    })
    .from(profiles)
    .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(eq(profiles.id, profileId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs(organizationId: string) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: profiles.name,
    })
    .from(activityLogs)
    .leftJoin(profiles, eq(activityLogs.userId, profiles.id))
    .where(eq(activityLogs.organizationId, organizationId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getOrganizationForProfile(profileId: string) {
  const result = await db
    .select({
      organization: organizations,
      members: profiles,
    })
    .from(organizations)
    .leftJoin(
      profiles,
      eq(profiles.organizationId, organizations.id)
    )
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  // Get all members for this organization
  const members = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.organizationId, result[0].organization.id));

  return {
    ...result[0].organization,
    members
  };
}

export async function getOrganizationMembers(organizationId: string) {
  return await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.organizationId, organizationId));
}

export async function getOrganizationBySubdomain(subdomain: string) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.subdomain, subdomain))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getOrganizationByCustomDomain(domain: string) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.customDomain, domain))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}