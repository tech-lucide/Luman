import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const { orgId, roleId } = await params;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleId)
      .eq("organization_id", orgId);

    if (error) {
      // Handles ON DELETE RESTRICT (users assigned) or hierarchy_level = 1 check gracefully
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
