import { addMemberToOrganization, getOrganizationBySlug, getOrganizationMembers } from "@/lib/db/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, orgSlug } = body;

    if (!name || !email || !password || !role || !orgSlug) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate role
    if (!["founder", "admin", "intern"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify organization exists
    const organization = await getOrganizationBySlug(orgSlug);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Smart Role Assignment
    // Check if organization has any members
    const members = await getOrganizationMembers(organization.id);
    const assignedRole = members.length === 0 ? "founder" : "intern";

    console.log(
      `[Register] Assigning role '${assignedRole}' to new user (Organization has ${members.length} existing members)`,
    );

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          organization_id: organization.id,
          role: assignedRole, // Use calculated role
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?org=${orgSlug}`,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "This email is already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Add user to organization
    try {
      await addMemberToOrganization(organization.id, authData.user.id, assignedRole);
    } catch (memberError) {
      console.error("Error adding user to organization:", memberError);
      // User was created but failed to add to organization
      // This should be handled by a cleanup job or manual intervention
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
