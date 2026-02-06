import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkspaces(orgId: string, userId: string, roleFilter?: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch workspaces for this org OR workspaces with no org where user is the owner/creator
  // This helps bring back "disappeared" workspaces that haven't been assigned an Org ID yet
  let query = supabase
    .from("workspaces")
    .select("*")
    .or(`organization_id.eq.${orgId},and(organization_id.is.null,or(owner_id.eq.${userId},created_by.eq.${userId}))`);

  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase error fetching workspaces:", error);
    throw error;
  }

  return data;
}

export async function createWorkspace({
  ownerName,
  role = "founder",
  orgId,
  userId,
  folderId,
  color,
}: {
  ownerName: string;
  role?: string;
  orgId: string;
  userId: string;
  folderId?: string | null;
  color?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_name: ownerName,
      role: role,
      organization_id: orgId,
      created_by: userId,
      owner_id: userId, // For backwards compatibility
      folder_id: folderId,
      color: color,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating workspace:", error);
    throw error;
  }

  return data;
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  // Ensure ownership before deleting
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId)
    .or(`owner_id.eq.${userId},created_by.eq.${userId}`);

  if (error) {
    console.error("Supabase error deleting workspace:", error);
    throw error;
  }
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  updates: { folderId?: string | null; color?: string; name?: string },
) {
  const supabase = await createSupabaseServerClient();

  // Build update object with only provided fields
  const updateData: Record<string, any> = {};
  if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.name !== undefined) updateData.owner_name = updates.name;

  const { error } = await supabase
    .from("workspaces")
    .update(updateData)
    .eq("id", workspaceId)
    .or(`owner_id.eq.${userId},created_by.eq.${userId}`); // Check both for compatibility

  if (error) {
    console.error("Error updating workspace:", error);
    throw error;
  }
}
