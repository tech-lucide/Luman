import { createWorkspace } from "@/lib/db/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, password, role } = body;

    if (!ownerName || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role !== "founder" && role !== "intern") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase.from("workspaces").select("id").eq("owner_name", ownerName).single();

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    // Create the new workspace (user)
    // Note: Password is provided but not stored since we don't have a password column yet.
    // Users will log in with the demo passwords (founder123/intern123) based on their role.
    const workspace = await createWorkspace({
      ownerName,
      role,
    });

    return NextResponse.json({
      success: true,
      user: workspace,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
