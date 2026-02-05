import { getOrganizationMembers, getUserMembership, updateMemberRole } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// Initialize Admin Client for fetching user details
// We need this because we can't join with auth.users using the regular client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Verify user is a member of the organization
    const membership = await getUserMembership(orgId, user.id);
    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const members = await getOrganizationMembers(orgId);

    // Fetch user details for each member
    // Optimisation: Fetch all at once if possible, or iterate
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const {
          data: { user: userData },
          error,
        } = await supabaseAdmin.auth.admin.getUserById(member.user_id);

        if (error || !userData) {
          console.warn(`Could not fetch user details for ${member.user_id}`);
          return { ...member, full_name: "Unknown", email: "Unknown" };
        }

        return {
          ...member,
          full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || "Unknown",
          email: userData.email || "Unknown",
        };
      }),
    );

    return NextResponse.json(membersWithDetails);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, userId, role } = body;

    if (!orgId || !userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify requesting user is admin/founder
    const requesterMembership = await getUserMembership(orgId, user.id);
    if (!requesterMembership || (requesterMembership.role !== "founder" && requesterMembership.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const updatedMember = await updateMemberRole(orgId, userId, role);
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
