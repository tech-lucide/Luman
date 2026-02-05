import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkspaces(ownerId: string, roleFilter?: string) {
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("workspaces").select("*").eq("owner_id", ownerId);

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
  ownerId,
}: {
  ownerName: string;
  role?: string;
  ownerId: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_name: ownerName,
      role: role,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating workspace:", error);
    throw error;
  }

  return data;
}
