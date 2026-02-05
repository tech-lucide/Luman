import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load chat history:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
