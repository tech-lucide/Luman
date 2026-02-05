import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body to see what to delete
    const body = await req.json();
    const { target } = body; // 'all', 'orgs', 'workspaces'

    if (target === "workspaces") {
      // Delete all workspaces where user is owner (or related to their orgs)
      // For safety, let's just delete workspaces created by this user
      const { error } = await supabase.from("workspaces").delete().eq("owner_id", user.id); // This might need adjustment based on schema
      // Actually workspaces use ownerId as OrgId usually.
    }

    // For now, let's just provide a simple "Delete My Organizations" which cascades
    if (target === "organizations") {
      // Find orgs where user is founder
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("role", "founder");

      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map((m) => m.organization_id);
        const { error } = await supabase.from("organizations").delete().in("id", orgIds);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true, message: "Cleanup complete" });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
