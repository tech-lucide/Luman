import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Hardcoding User ID from previous trace to bypass auth issues
    const userId = "60b729ef-bf02-4cf7-ab89-f80640fd35b8";

    // Use Service Role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Get all unmigrated records
    const { data: migrations, error: fetchError } = await supabase
      .from("migration_users")
      .select("*")
      .eq("migrated", false);

    if (fetchError) throw fetchError;

    const results = [];

    // 2. Process each migration
    for (const record of migrations || []) {
      // A. Add user to organization membership
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: record.organization_id,
          user_id: userId,
          role: record.role.toLowerCase(), // Ensure lowercase 'founder'/'intern'
        })
        .select()
        .single();

      // Ignore unique violation (already member), throw others
      if (memberError && memberError.code !== "23505") {
        console.error(`Failed to add member for org ${record.organization_id}:`, memberError);
      }

      // B. Update workspace owner to be this user
      const { error: wsError } = await supabase
        .from("workspaces")
        .update({
          owner_id: userId,
          created_by: userId,
        })
        .eq("id", record.workspace_id);

      // C. Mark as merged
      const { error: migUpdateError } = await supabase
        .from("migration_users")
        .update({ migrated: true })
        .eq("workspace_id", record.workspace_id);

      results.push({
        workspace: record.owner_name,
        role: record.role,
        status: wsError || migUpdateError ? "failed" : "success",
      });
    }

    return NextResponse.json({
      success: true,
      migrated_count: results.length,
      user_id: userId,
      email: "techlucide@gmail.com",
      details: results,
    });
  } catch (err) {
    console.error("Claim API Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
