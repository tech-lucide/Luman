import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "founder"; // Default to founder upgrade

    // Hardcoding User ID to ensure we target the correct account
    const userId = "60b729ef-bf02-4cf7-ab89-f80640fd35b8";

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Update all organization memberships
    const { data: updatedMembers, error: updateError } = await supabase
      .from("organization_members")
      .update({ role: role })
      .eq("user_id", userId)
      .select();

    if (updateError) throw updateError;

    // 2. Also update workspaces if they have a role field (legacy)
    // Some workspaces might mirror the role
    const { error: wsError } = await supabase.from("workspaces").update({ role: role }).eq("owner_id", userId);

    return NextResponse.json({
      success: true,
      user_id: userId,
      new_role: role,
      updated_organizations: updatedMembers?.length || 0,
      details: updatedMembers,
    });
  } catch (err) {
    console.error("Update Role Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
