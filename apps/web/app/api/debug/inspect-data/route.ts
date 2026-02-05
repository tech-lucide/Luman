import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: workspaces, error: wsError } = await supabase.from("workspaces").select("*");
  const { data: orgs, error: orgError } = await supabase.from("organizations").select("*");
  const { data: members, error: memError } = await supabase.from("organization_members").select("*");
  const { data: migration, error: migError } = await supabase.from("migration_users").select("*");

  return NextResponse.json({
    workspaces: { count: workspaces?.length, data: workspaces, error: wsError },
    organizations: { count: orgs?.length, data: orgs, error: orgError },
    members: { count: members?.length, data: members, error: memError },
    migration_users: { count: migration?.length, data: migration, error: migError },
  });
}
