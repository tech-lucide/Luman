import { updateNoteTags } from "@/lib/db/notes";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params;
    const { tags } = await req.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: "Tags must be an array" }, { status: 400 });
    }

    await updateNoteTags(noteId, tags);

    return NextResponse.json({ success: true, tags });
  } catch (err) {
    console.error("Error updating tags:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
