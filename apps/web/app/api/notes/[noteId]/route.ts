import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET — Load a note
 */
export async function GET(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notes")
    .select("id, title, content, visibility_mode, minimum_visible_role_level, specific_role_ids, created_by_role_level")
    .eq("id", noteId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "NOTE_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(data);
}

/**
 * PUT — Save a note
 */
export async function PUT(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;

  const supabase = await createSupabaseServerClient();
  const { content, title, visibilityMode, minimumVisibleRoleLevel, specificRoleIds } = await req.json();

  const updateData: any = {};
  if (content !== undefined) updateData.content = content;
  if (title !== undefined) updateData.title = title;
  if (visibilityMode !== undefined) updateData.visibility_mode = visibilityMode;
  if (minimumVisibleRoleLevel !== undefined) updateData.minimum_visible_role_level = minimumVisibleRoleLevel;
  if (specificRoleIds !== undefined) updateData.specific_role_ids = specificRoleIds;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate visibility permissions if they are being updated
  if (visibilityMode !== undefined || minimumVisibleRoleLevel !== undefined || specificRoleIds !== undefined) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("workspace_id, visibility_mode, minimum_visible_role_level, specific_role_ids")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("organization_id")
      .eq("id", note.workspace_id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.organization_id) {
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("assigned_role_id, roles(hierarchy_level)")
        .eq("organization_id", workspace.organization_id)
        .eq("user_id", user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
      }

      const userRoleId = member.assigned_role_id;
      const rolesObj = member.roles as any;
      const userHierarchyLevel = rolesObj?.hierarchy_level;

      if (userHierarchyLevel === null || userHierarchyLevel === undefined) {
        return NextResponse.json({ error: "User role hierarchy level not found" }, { status: 403 });
      }

      const targetMode = visibilityMode !== undefined ? visibilityMode : note.visibility_mode;
      const targetMinLevel = minimumVisibleRoleLevel !== undefined ? minimumVisibleRoleLevel : note.minimum_visible_role_level;
      const targetSpecificRoleIds = specificRoleIds !== undefined ? specificRoleIds : note.specific_role_ids;

      if (targetMode === "hierarchy" && targetMinLevel !== undefined) {
        if (userHierarchyLevel > targetMinLevel) {
          return NextResponse.json({ error: "Cannot make note visible above your hierarchy level" }, { status: 403 });
        }
      } else if (targetMode === "specific" && targetSpecificRoleIds) {
        if (!targetSpecificRoleIds.includes(userRoleId || "")) {
          return NextResponse.json({ error: "Cannot set visibility that you do not have permission to view" }, { status: 403 });
        }
      }
    }
  }

  const { error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId);

  if (error) {
    console.error("UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
