// Usage: import { createClient } from "utils/supabase/server";
//
// export default async function handler(req, res) {
//   const { supabase } = createClient(req);
//   const { data, error } = await supabase
//     .from("todos")
//     .select("*")
//     .order("id", { ascending: false });
//   if (error) return res.status(500).json({ error: error.message });
//   return res.status(200).json(data);
// }


import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return ( await cookieStore ).getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(async ({ name, value, options }) => ( await cookieStore ).set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
