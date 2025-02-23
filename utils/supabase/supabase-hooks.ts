import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";


import { Profile } from "@/lib/db/schema";
import { createClient } from "./client";

const supabase = createClient();

export function useAuth() {

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*, organizations(*)")
            .eq("id", authUser.id)
            .single();
            
          setUser(profile);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*, organizations(*)")
            .eq("id", session.user.id)
            .single();
            
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}

export function useOrganization() {
  const { user } = useAuth();
  
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      if (user?.organizationId) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("organization_id", user.organizationId);
            
          setMembers(data || []);
        } catch (error) {
          console.error("Error loading members:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMembers();
  }, [user, supabase]);

  return {
    organization: user?.organizationId,
    members,
    loading,
  };
}


//Usage examples:

//Server Component with auth requirement:

//typescriptCopyimport { requireAuth, getCurrentOrganization } from "@/utils/supabase";

//export default async function DashboardPage() {
//  const user = await requireAuth();
//  const org = getCurrentOrganization();
  
//  return <div>Welcome {user.email} to {org?.name}</div>;
//}

//API Route with auth and organization protection:

//typescriptCopyimport { withAuth, withOrganization } from "@/utils/supabase";

//export const POST = withAuth(
//  withOrganization(async (req: Request, user: User, org: Organization) => {
//    // Handle request
//    return Response.json({ success: true });
//  })
//);

//Client Component with organization data:

//typescriptCopyimport { useOrganization } from "@/utils/supabase/hooks";

//export function TeamMembers() {
//  const { organization, members, loading } = useOrganization();
  
//  if (loading) return <div>Loading...</div>;
  
//  return (
//    <div>
//      <h1>{organization?.name} Team</h1>
//      {members.map(member => (
//        <div key={member.id}>{member.email}</div>
//      ))}
//    </div>
//  );
//}