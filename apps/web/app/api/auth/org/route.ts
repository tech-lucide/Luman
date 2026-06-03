import { createOrganization, getOrganizations } from "@/lib/db/organizations";
import { getCurrentUser } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/auth/org - List all organizations
export async function GET() {
  try {
    const organizations = await getOrganizations();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}

// POST /api/auth/org - Create new organization
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, hierarchyType = "fixed", customRoles } = body;

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Organization name must be at least 3 characters" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const creatorUserId = user ? user.id : undefined;

    const organization = await createOrganization(name.trim(), creatorUserId, hierarchyType, customRoles);

    return NextResponse.json({
      ...organization,
      loggedIn: !!user
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
