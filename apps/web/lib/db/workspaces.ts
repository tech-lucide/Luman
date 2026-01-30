import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkspaces() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.from("workspaces").select("*").order("created_at", { ascending: true });

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
  ownerId?: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_name: ownerName,
      role: role,
      owner_id: ownerId || crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating workspace:", error);
    throw error;
  }

  return data;
}
