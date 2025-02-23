import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { organizations } from '@/lib/db/schema';

export async function middleware(request: NextRequest) {
  // First check if it's a static asset
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check route types first
     const isSignInRoute = request.nextUrl.pathname.startsWith('/sign-in');
   const isSignUpRoute = request.nextUrl.pathname.startsWith('/sign-up');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicRoute = request.nextUrl.pathname === '/' || 
                       request.nextUrl.pathname.startsWith('/blog') || 
                       request.nextUrl.pathname.startsWith('/pricing');

  // Skip auth check for public routes
  if (isAuthRoute || isApiRoute || isPublicRoute || isSignUpRoute) {
    return response;
  }

  // Create Supabase client
  const { supabase } = createClient(request);

  // Check auth status only for protected routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle organization access via subdomain or custom domain
  const hostname = request.headers.get('host');
  if (hostname && !isApiRoute && !isAuthRoute) {
    const subdomain = hostname.split('.')[0];
    const isCustomDomain = !hostname.includes(process.env.NEXT_PUBLIC_ROOT_DOMAIN!);

    // Skip subdomain check for www and root domain
    if (subdomain !== 'www' && !isCustomDomain) {
      let org;
      
      if (isCustomDomain) {
        // Check custom domain
        org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.customDomain, hostname))
          .limit(1);
      } else {
        // Check subdomain
        org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.subdomain, subdomain))
          .limit(1);
      }

      if (!org || org.length === 0) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Add organization info to request headers
      response.headers.set('x-organization-id', org[0].id);
      response.headers.set('x-organization-name', org[0].name);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};