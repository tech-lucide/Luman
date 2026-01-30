import { setSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, password } = body;

    if (!ownerName || !password) {
      return NextResponse.json({ error: "Owner name and password are required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Find workspace by owner_name
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_name", ownerName)
      .single();

    if (error || !workspace) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Role-based password validation
    let validPassword = false;
    if (workspace.role === "founder") {
      validPassword = password === "founder123";
    } else if (workspace.role === "intern") {
      validPassword = password === "intern123";
    }

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Set session
    await setSession({
      userId: workspace.owner_id,
      role: workspace.role,
      ownerName: workspace.owner_name,
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: workspace.owner_id,
        role: workspace.role,
        ownerName: workspace.owner_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
