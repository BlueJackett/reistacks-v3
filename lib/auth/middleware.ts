'use server';

import { z } from 'zod';
import { Profile, Organization, profiles } from '@/lib/db/schema';
import { getProfile } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { hasPermission, Permission } from '@/utils/permissions';
import { createClient } from '@/utils/supabase/server';
import { db } from '../db/drizzle';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithProfileFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  profile: Profile
) => Promise<T>;

// --- Corrected validatedActionWithProfile ---
export async function validatedActionWithProfile<  //  <-- Add async here
  S extends z.ZodType<any, any>,
  T
>(schema: S, action: ValidatedActionWithProfileFunction<S, T>) {
  // Initialize Supabase client
  const supabase = createClient(cookies());
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    // Check Supabase auth session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      redirect('/auth/login');
    }

    // Get profile data
    const profile = await getProfile();
    if (!profile) {
      redirect('/auth/login');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData, profile!);
  };
}


type ActionWithOrgFunction<T> = (
  formData: FormData,
  organization: Organization & { profiles: Profile[] }
) => Promise<T>;

// --- Corrected withPermission ---
export async function withPermission<T>(permission: Permission) { // Make withPermission async
  return async (action: (formData: FormData) => Promise<T>) => {  // Return an async function that TAKES the action
    return async (formData: FormData): Promise<T> => { // Return *another* async function, suitable for a server action
      const profile = await requireAuth();

      if (!hasPermission(profile.role, permission)) {
        throw new Error(`Unauthorized: Requires ${permission} permission`);
      }

      // Now, *call* the provided action and await its result:
      return await action(formData);
    };
  };
}


export async function withOrganization<T>(action: ActionWithOrgFunction<T>) {
  async function orgAction(formData: FormData): Promise<T> {
    const supabase = createClient(cookies());

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      redirect('/auth/login');
    }

    const profileWithOrg = await getProfileWithOrg(session!.user.id);
    if (!profileWithOrg?.organization) {
      throw new Error('Organization not found');
    }

    return action(formData, profileWithOrg.organization);
  }

  return orgAction;
}


// Helper function to require authentication and return profile
export async function requireAuth(): Promise<Profile> {
  const supabase = createClient(cookies());

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    redirect('/auth/login');
  }

  const profile = await getProfile();
  if (!profile) {
    redirect('/auth/login');
  }

  return profile!;
}

// Helper function to require organization access and return org data
export async function requireOrganization() {
  const profile = await requireAuth();

  const profileWithOrg = await getProfileWithOrg(profile.id);
  if (!profileWithOrg?.organization) {
    throw new Error('Organization not found');
  }

  return profileWithOrg.organization;
}

// Helper function to validate organization ownership
export async function requireOrganizationOwner() {
  const profile = await requireAuth();

  const profileWithOrg = await getProfileWithOrg(profile.id);
  if (!profileWithOrg?.organization) {
    throw new Error('Organization not found');
  }

  if (profile.role !== 'owner') {
    throw new Error('Unauthorized: Requires organization owner role');
  }

  return {
    profile,
    organization: profileWithOrg.organization
  };
}

// Helper to validate custom domain access
export async function validateDomainAccess(domain: string) {
  const profile = await requireAuth();

  const profileWithOrg = await getProfileWithOrg(profile.id);
  if (!profileWithOrg?.organization || profileWithOrg.organization.customDomain !== domain) {
    throw new Error('Invalid domain access');
  }

  return {
    profile,
    organization: profileWithOrg.organization
  };
}

export async function getProfileWithOrg(userId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    with: {
      organization: {
        with: {
          profiles: true
        }
      }
    }
  });
}