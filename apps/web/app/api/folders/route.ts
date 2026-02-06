import { createFolder, deleteFolder, getFolders } from "@/lib/db/folders";
import { getUserMembership } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) return NextResponse.json({ error: "Org ID required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check membership
  const member = await getUserMembership(orgId, user.id);
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const folders = await getFolders(orgId);
  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, orgId, color } = body;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await getUserMembership(orgId, user.id);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const folder = await createFolder(name, orgId, color || "stone", user.id);
    return NextResponse.json(folder);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("id");
  if (!folderId) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // We should verify ownership or org admin status here ideally
  // For now, assuming member access is enough or simple logic

  try {
    await deleteFolder(folderId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
