import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const { tasks, workspaceId } = body;

    if (!tasks || !Array.isArray(tasks) || !workspaceId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Process tasks: upset each task based on its content or some ID if we had one in the editor node
    // Since tiptap task items don't strictly have IDs unless we add them, we might be doing content matching or just simple creation for now.
    // However, the prompt says "If a taskItem is created or updated, automatically sync".
    // Challenge: Avoiding duplicates. Ideally, we should attach an ID to the taskItem in Tiptap.
    // GUIDANCE: For this iteration, we'll assume we wipe and recreate tasks for the referenced note/context,
    // OR we try to upsert if we can persist IDs in the editor attributes.
    // Given the constraints and typical Tiptap usage, persisting an ID attribute on the taskItem node is best.
    // But for simplicity/speed requested, we might just insert new ones or look for existing text.

    // BETTER APPROACH: The editor should send tasks with a `uuid` attribute if possible.
    // If we can't modify the schema of the editor nodes easily right now, we might just assume the content + workspace is unique enough or just replace all non-completed tasks for this note?
    // Wait, the tasks have `workspace_id` but are also linked to a note?
    // The prompt says: "Modify the notes table or create a new tasks table... workspace_id... assignee_id".
    // It DOES NOT explicitly link tasks to a specific note_id in the schema requirement,
    // BUT "Add a due_date column to the notes table...".
    // The task extraction implies extracting from the editor (which is per note).
    // Let's assume we should send the `noteId` as well contextually, maybe storing it in metadata or just handling them as workspace-level entities.

    // REFINED STRATEGY matching "student startup" MVP vibe:
    // We will iterate through incoming tasks.
    // We'll upsert based on `content` and `workspace_id` (imperfect but works for simple lists)
    // OR, better, we check if we can pass a temporary ID from the frontend.

    // Let's stick to valid upserts.

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

    const query = supabase.from("tasks").select("*").eq("is_completed", false);

    if (workspaceId) {
      query.eq("workspace_id", workspaceId);
    }

    // If no workspaceId, maybe return user's tasks across all workspaces?
    // The prompt says "Organization View: Aggregated tasks from all workspaces the user belongs to".
    // RLS policies already filter by "user in workspace". So fetching all tasks without workspace_id filter
    // should return all tasks the user has access to (Organization View).

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (_) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
