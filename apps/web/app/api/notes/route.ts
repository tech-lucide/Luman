import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    // ✅ Always return JSON, even if workspaceId is missing
    if (!workspaceId) {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabase
      .from("notes")
      .select("id, workspace_id, title, created_at, tags, due_date")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/notes error:", error.message);
      return NextResponse.json([], { status: 200 });
    }

    // ✅ Guaranteed JSON array
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("GET /api/notes crashed:", err);
    // ✅ Still return valid JSON
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  console.log("POST /api/notes hit");

  try {
    const supabase = await createSupabaseServerClient();

    let body: { 
      workspaceId?: string; 
      title?: string; 
      templateType?: string;
      visibilityMode?: string;
      minimumVisibleRoleLevel?: number;
      specificRoleIds?: string[];
    };
    try {
      body = await req.json();
    } catch {
      console.error("Failed to parse JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { 
      workspaceId, 
      title, 
      templateType,
      visibilityMode = "public",
      minimumVisibleRoleLevel,
      specificRoleIds
    } = body;

    if (!workspaceId || !title || !templateType) {
      console.error("Missing fields", body);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve workspace organization context
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("organization_id")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let userHierarchyLevel: number | null = null;
    let userRoleId: string | null = null;

    if (workspace.organization_id) {
      // Fetch user's membership and hierarchy level
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("assigned_role_id, roles(hierarchy_level)")
        .eq("organization_id", workspace.organization_id)
        .eq("user_id", user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
      }

      userRoleId = member.assigned_role_id;
      const rolesObj = member.roles as any;
      userHierarchyLevel = rolesObj?.hierarchy_level;

      if (userHierarchyLevel === null || userHierarchyLevel === undefined) {
        return NextResponse.json({ error: "User role hierarchy level not found" }, { status: 403 });
      }

      // Enforce Note Creation Rules:
      // Creator must have visibility to the note they are creating under the rules
      if (visibilityMode === "hierarchy" && minimumVisibleRoleLevel !== undefined) {
        if (userHierarchyLevel > minimumVisibleRoleLevel) {
          return NextResponse.json({ error: "Cannot create note visible above your hierarchy level" }, { status: 403 });
        }
      } else if (visibilityMode === "specific" && specificRoleIds) {
        if (!specificRoleIds.includes(userRoleId || "")) {
          return NextResponse.json({ error: "Cannot create note that you do not have visibility for" }, { status: 403 });
        }
      }
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        workspace_id: workspaceId,
        title,
        template_type: templateType,
        content: { type: "doc", content: [] },
        visibility_mode: visibilityMode,
        minimum_visible_role_level: minimumVisibleRoleLevel,
        specific_role_ids: specificRoleIds,
        created_by_role_level: userHierarchyLevel,
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      
      let diag = "";
      try {
        const diagClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: ws } = await diagClient.from("workspaces").select("organization_id, owner_id").eq("id", workspaceId).single();
        if (!ws) {
          diag = "Workspace does not exist in DB.";
        } else if (!ws.organization_id) {
          diag = `Workspace has no organization (personal workspace). User ID: ${user.id}, Workspace Owner: ${ws.owner_id}`;
        } else {
          const { data: member } = await diagClient.from("organization_members").select("role").eq("organization_id", ws.organization_id).eq("user_id", user.id).maybeSingle();
          if (!member) {
            diag = `User is not a member of organization ${ws.organization_id}. User ID: ${user.id}`;
          } else {
            diag = `User is a member of org ${ws.organization_id} with role ${member.role}, but RLS insert notes policy is violated.`;
          }
        }
      } catch (diagErr: any) {
        diag = `Diagnostics error: ${diagErr.message}`;
      }

      return NextResponse.json({ error: `${error.message}. Diagnostic info: ${diag}` }, { status: 500 });
    }

    console.log("NOTE CREATED:", data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes CRASHED:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
