import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceFolder = {
  id: string;
  name: string;
  color: string;
  organization_id: string;
  created_at: string;
};

export async function createFolder(name: string, organizationId: string, color = "stone", creatorId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspace_folders")
    .insert({
      name,
      organization_id: organizationId,
      color,
      created_by: creatorId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating folder:", error);
    throw error;
  }

  return data as WorkspaceFolder;
}

export async function getFolders(organizationId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspace_folders")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching folders:", error);
    throw error;
  }

  return data as WorkspaceFolder[];
}

export async function deleteFolder(folderId: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("workspace_folders").delete().eq("id", folderId);

  if (error) {
    console.error("Error deleting folder:", error);
    throw error;
  }
}
