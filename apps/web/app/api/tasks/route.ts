import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrganizationBySlug, getUserOrganizations } from "@/lib/db/organizations";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const { tasks, workspaceId } = body;

    if (!tasks || !Array.isArray(tasks) || !workspaceId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .upsert(
        tasks.map((task: any) => {
          const payload: any = {
            content: task.content,
            is_completed: task.checked,
            workspace_id: workspaceId,
          };
          // Only add ID if it exists and is valid UUID (simple check for truthy)
          if (task.id) {
            payload.id = task.id;
          }
          return payload;
        }),
      )
      .select();

    if (error) {
      console.error("Error syncing tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const orgSlug = searchParams.get("org");

    const query = supabase
      .from("tasks")
      .select("*, workspaces(owner_name)")
      .eq("is_completed", false);

    if (workspaceId) {
      query.eq("workspace_id", workspaceId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      let targetOrg = null;
      if (orgSlug) {
        targetOrg = await getOrganizationBySlug(orgSlug);
      }

      if (!targetOrg) {
        const userOrgs = await getUserOrganizations(user.id);
        if (userOrgs && userOrgs.length > 0) {
          targetOrg = userOrgs[0];
        }
      }

      if (!targetOrg) {
        return NextResponse.json([]);
      }

      // Get workspace IDs of this organization
      const { data: workspaces, error: wsError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("organization_id", targetOrg.id);

      if (wsError) throw wsError;

      const workspaceIds = workspaces.map((w: any) => w.id);
      if (workspaceIds.length === 0) {
        return NextResponse.json([]);
      }

      query.in("workspace_id", workspaceIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (_) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
