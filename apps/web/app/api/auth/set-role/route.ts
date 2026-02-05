import { addMemberToOrganization, getOrganizationBySlug } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgSlug, role } = body;

    if (!orgSlug || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["founder", "admin", "intern"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify organization exists
    const organization = await getOrganizationBySlug(orgSlug);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Add user to organization with selected role
    await addMemberToOrganization(organization.id, user.id, role as "founder" | "admin" | "intern");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Set role error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
