import { getCurrentUser } from "@/lib/auth";
import { getOrganizationBySlug, getUserMembership, getUserOrganizations } from "@/lib/db/organizations";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const orgSlug = searchParams.get("org");

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Get user's organizations
    const organizations = await getUserOrganizations(user.id);

    // Default values
    let role = "intern";
    const ownerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    // If orgSlug provided, get specific role
    if (orgSlug) {
      const org = await getOrganizationBySlug(orgSlug);
      if (org) {
        const membership = await getUserMembership(org.id, user.id);
        if (membership) {
          role = membership.role;
        }
      }
    } else if (organizations.length > 0) {
      // Use first organization as default
      role = organizations[0].userRole;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.id,
        email: user.email,
        role: role,
        ownerName: ownerName,
        organizations,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}
