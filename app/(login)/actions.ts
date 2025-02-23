'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  profiles,
  organizations,
  activityLogs,
  invitations,
  ActivityType,
} from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { createCheckoutSession } from '@/lib/payments/stripe';

import { cookies } from 'next/headers';
import { ActionState } from '@/lib/auth/middleware';
import { createClient } from '@/utils/supabase/server';

// Initialize Supabase client


async function logActivity(
  organizationId: string | null | undefined,
  userId: string,
  type: ActivityType,
  ipAddress?: string,
) {
  if (organizationId === null || organizationId === undefined) {
    return;
  }
  await db.insert(activityLogs).values({
    organizationId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  });
}
export async function signOut() {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    redirect('/');
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: 'Failed to sign out. Please try again.' };
  }
}
function normalizeSubdomain(subdomain: string) {
  return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export async function signIn(state: ActionState, formData: FormData) {
  const supabase = createClient(cookies());
  const { email, password } = state;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const profileWithOrg = await db
    .select({
      profile: profiles,
      organization: organizations,
    })
    .from(profiles)
    .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(eq(profiles.id, authData.user.id))
    .limit(1);

  if (profileWithOrg.length === 0) {
    return {
      error: 'Profile not found. Please contact support.',
      email,
      password,
    };
  }

  const { profile: foundProfile, organization: foundOrg } = profileWithOrg[0];

  await logActivity(foundOrg?.id, foundProfile.id, ActivityType.SIGN_IN);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    if (!foundOrg) {
      return { error: 'Organization not found.' };
    }
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ organization: foundOrg, priceId });
  }

  redirect('/dashboard');
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1).optional(),
  subdomain: z.string().min(3).optional(),
  inviteId: z.string().optional(),
});

export async function signUp(state: ActionState, formData: FormData) {
  const { email, password, name, organizationName, subdomain, inviteId } = state;
  const supabase = createClient(cookies());
  let organizationId: string;
  let createdOrg: typeof organizations.$inferSelect | null = null;

  if (inviteId) {
  // Handle invitation signup
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, parseInt(inviteId)),
        eq(invitations.email, email),
        eq(invitations.status, 'pending'),
      ),
    )
    .limit(1);

  if (!invitation) {
    return { error: 'Invalid or expired invitation.', email, password };
  }

  organizationId = invitation.organizationId;

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        organization_id: organizationId,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  await Promise.all([
    db.update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id)),
    logActivity(organizationId, authData.user.id, ActivityType.ACCEPT_INVITATION),
  ]);
} else {
    // Handle new organization signup
    if (!organizationName || !subdomain) {
      return {
        error: 'Organization name and subdomain are required.',
        email,
        password,
      };
    }

    const normalizedSubdomain = normalizeSubdomain(subdomain);

    // Check if subdomain is available
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.subdomain, normalizedSubdomain))
      .limit(1);

    if (existingOrg.length > 0) {
      return {
        error: 'This subdomain is already taken. Please choose another.',
        email,
        password,
      };
    }

    // Create new organization
    const newOrg = {
      id: crypto.randomUUID(),
      name: organizationName,
      subdomain: normalizedSubdomain,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    [createdOrg] = await db.insert(organizations).values(newOrg).returning();

    if (!createdOrg) {
      return {
        error: 'Failed to create organization. Please try again.',
        email,
        password,
      };
    }


const supabase = createClient(cookies());
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          organization_id: createdOrg.id,
        },
      },
    });

    if (authError || !authData.user) {
      // Cleanup the organization if user creation fails
      await db.delete(organizations).where(eq(organizations.id, createdOrg.id));
      return {
        error: 'Failed to create user. Please try again.',
        email,
        password,
      };
    }

    await logActivity(createdOrg.id, authData.user.id, ActivityType.CREATE_TEAM);
  }

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    if (!createdOrg) {
      return { error: 'Organization not found.' };
    }
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ organization: createdOrg, priceId });
  }

  redirect('/dashboard');
}

function validatedAction<T extends z.ZodSchema, U>(
  schema: T,
  handler: (data: z.infer<T>, formData: FormData) => Promise<U>
) {
  return async (formData: FormData): Promise<U> => {
    const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!parsed.success) {
      throw new Error('Validation error: ' + parsed.error.message);
    }

    return handler(parsed.data, formData);
  };
}



