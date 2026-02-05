import { getOrganizationBySlug, getUserMembership } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, orgSlug } = body;

    if (!email || !password || !orgSlug) {
      return NextResponse.json({ error: "Email, password, and organization are required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify organization exists
    const organization = await getOrganizationBySlug(orgSlug);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if user is a member of this organization
    const membership = await getUserMembership(organization.id, authData.user.id);
    if (!membership) {
      // User exists but not in this organization
      await supabase.auth.signOut();
      return NextResponse.json({ error: "You are not a member of this organization" }, { status: 403 });
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({ error: "Please verify your email address before logging in" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: membership.role,
        organizationId: organization.id,
        organizationName: organization.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
