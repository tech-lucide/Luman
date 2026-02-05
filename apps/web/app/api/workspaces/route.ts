import { getUserMembership } from "@/lib/db/organizations";
import { createWorkspace, getWorkspaces } from "@/lib/db/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // Authenticate and check role
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getUserMembership(orgId, user.id);
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }

    // Filter logic: Interns see ONLY 'intern' workspaces. Founders/Admins see ALL.
    const roleFilter = membership.role === "intern" ? "intern" : undefined;

    const data = await getWorkspaces(orgId, roleFilter);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/workspaces error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("DEBUG: POST /api/workspaces body:", body);

    const { ownerName, ownerId, role: requestedRole } = body;

    if (!ownerName) {
      return NextResponse.json({ error: "ownerName is required" }, { status: 400 });
    }

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }

    // Authenticate and check role to enforce correct tag
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getUserMembership(ownerId, user.id);
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }

    // Force role: If user is intern, they MUST create intern workspace.
    // If founder/admin, they can create whatever, but default to their role.
    let roleToAssign = membership.role;

    // Optional: Allow Founder/Admin to explicitly create an 'intern' workspace if they want (via requestedRole)
    if (membership.role !== "intern" && requestedRole) {
      roleToAssign = requestedRole;
    }

    const data = await createWorkspace({
      ownerName,
      role: roleToAssign,
      ownerId,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("DEBUG: POST /api/workspaces CRASHED:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
        stack: err instanceof Error ? err.stack : undefined,
        details: String(err),
      },
      { status: 500 },
    );
  }
}
