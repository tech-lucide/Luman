import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET — Load a note
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, content")
    .eq("id", noteId)
    .maybeSingle(); // 👈 IMPORTANT

  if (!data) {
    return NextResponse.json(
      { error: "NOTE_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}


/**
 * PUT — Save a note
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = createSupabaseServerClient();
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json(
      { error: "Missing content" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("notes")
    .update({
      content,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  if (error) {
    console.error("UPDATE ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}


export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

