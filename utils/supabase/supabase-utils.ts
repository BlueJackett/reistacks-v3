import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db/drizzle";
import { and, eq, sql } from "drizzle-orm";
import { organizations, profiles } from "@/lib/db/schema";



// Create a cached Supabase client
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return ( await cookieStore ).get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            ( await cookieStore ).set({ name, value, ...options });
          } catch (error) {
            // Handle cookies.set in edge functions
          }
        },
        async remove(name: string, options: any) {
          try {
            ( await cookieStore ).delete({ name, ...options });
          } catch (error) {
            // Handle cookies.delete in edge functions
          }
        },
      },
    }
  );
});

// Get the authenticated user
export async function getAuthUser() {
  const supabase = createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.user) {
    return null;
  }

  return session.user;
}

// Get the authenticated user's profile with organization
export async function getAuthProfile() {
  const user = await getAuthUser();
  
  if (!user) {
    return null;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    with: {
      organization: true
    }
  });

  return profile;
}

// Require authentication and return the user
export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

// Get current organization from headers
export async function getCurrentOrganization() {
  const headersList = headers();
  const id = ( await headersList ).get("x-organization-id");
  const name = ( await headersList ).get("x-organization-name");

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name
  };
}

// Get organization by subdomain
export async function getOrganizationBySubdomain(subdomain: string) {
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.subdomain, subdomain))
    .limit(1);

  return org[0] || null;
}

// Get organization by custom domain
export async function getOrganizationByDomain(domain: string) {
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.customDomain, domain))
    .limit(1);

  return org[0] || null;
}

// Validate and normalize subdomain
export function normalizeSubdomain(subdomain: string) {
  // Remove special characters and convert to lowercase
  const normalized = subdomain
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Check length
  if (normalized.length < 3) {
    throw new Error("Subdomain must be at least 3 characters long");
  }

  // Check reserved names
  const reservedNames = ["www", "app", "api", "admin", "dashboard", "auth"];
  if (reservedNames.includes(normalized)) {
    throw new Error("This subdomain is reserved");
  }

  return normalized;
}

// Check if subdomain is available
export async function isSubdomainAvailable(subdomain: string) {
  const org = await getOrganizationBySubdomain(subdomain);
  return !org;
}

// Get member count for organization
export async function getOrganizationMemberCount(organizationId: string) {
  const members = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles)
    .where(eq(profiles.organizationId, organizationId));

  return members[0]?.count || 0;
}

// Check if user is organization owner
export async function isOrganizationOwner(userId: string, organizationId: string) {
  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, userId),
      eq(profiles.organizationId, organizationId),
      eq(profiles.role, "owner")
    ),
  });

  return !!profile;
}

// Route protection HOC for API routes
export function withAuth(handler: Function) {
  return async (request: Request) => {
    const user = await getAuthUser();
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    return handler(request, user);
  };
}

// Route protection HOC for organization access
export function withOrganization(handler: Function) {
  return async (request: Request) => {
    const organization = getCurrentOrganization();
    
    if (!organization) {
      return new Response("Organization not found", { status: 404 });
    }
    
    return handler(request, organization);
  };
}