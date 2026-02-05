import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export type Event = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  event_type: "event" | "reminder" | "task";
  is_completed: boolean;
  workspace_id?: string;
  note_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export async function getEvents(workspaceId?: string) {
  let query = supabase.from("events").select("*").order("start_time", { ascending: true });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Event[];
}

export async function getOrganizationEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*, workspaces(owner_name)")
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getEventById(id: string) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();

  if (error) throw error;
  return data as Event;
}

export async function createEvent(event: Omit<Event, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("events").insert([event]).select().single();

  if (error) throw error;
  return data as Event;
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;
}
