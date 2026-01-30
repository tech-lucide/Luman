import { createWorkspace, getWorkspaces } from "@/lib/db/workspaces";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getWorkspaces();
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

    const { ownerName, role, ownerId } = body;

    if (!ownerName) {
      return NextResponse.json({ error: "ownerName is required" }, { status: 400 });
    }

    const data = await createWorkspace({
      ownerName,
      role: role || "founder",
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
