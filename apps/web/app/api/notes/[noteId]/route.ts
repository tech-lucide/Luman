import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET — Load a note
 */
export async function GET(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("notes").select("id, title, content").eq("id", noteId).maybeSingle(); // 👈 IMPORTANT

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
  const { content, title } = await req.json();

  const updateData: any = {};
  if (content !== undefined) updateData.content = content;
  if (title !== undefined) updateData.title = title;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Missing content or title" }, { status: 400 });
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
