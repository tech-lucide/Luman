import { getOrganizationEvents } from "@/lib/db/events";
import { getOrganizationBySlug, getUserOrganizations } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/calendar/organization
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("org");

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetOrg = null;
    if (orgSlug) {
      targetOrg = await getOrganizationBySlug(orgSlug);
    }

    if (!targetOrg) {
      const userOrgs = await getUserOrganizations(user.id);
      if (userOrgs && userOrgs.length > 0) {
        targetOrg = userOrgs[0];
      }
    }

    if (!targetOrg) {
      return NextResponse.json([]);
    }

    const events = await getOrganizationEvents(targetOrg.id);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching organization calendar:", error);
    return NextResponse.json({ error: "Failed to fetch organization calendar" }, { status: 500 });
  }
}
