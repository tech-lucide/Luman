import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getNote(noteId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createNote({
  workspaceId,
  title,
  templateType,
  content,
}: {
  workspaceId: string;
  title: string;
  templateType: string;
  content: any;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      workspace_id: workspaceId,
      title,
      template_type: templateType,
      content,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
