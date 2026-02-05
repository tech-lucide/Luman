import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    // ✅ Always return JSON, even if workspaceId is missing
    if (!workspaceId) {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabase
      .from("notes")
      .select("id, title, created_at, tags, due_date")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/notes error:", error.message);
      return NextResponse.json([], { status: 200 });
    }

    // ✅ Guaranteed JSON array
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("GET /api/notes crashed:", err);
    // ✅ Still return valid JSON
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  console.log("POST /api/notes hit");

  try {
    const supabase = await createSupabaseServerClient();

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.error("Failed to parse JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { workspaceId, title, templateType } = body;

    if (!workspaceId || !title || !templateType) {
      console.error("Missing fields", body);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        workspace_id: workspaceId,
        title,
        template_type: templateType,
        content: { type: "doc", content: [] },
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("NOTE CREATED:", data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes CRASHED:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
