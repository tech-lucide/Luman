import { verifyOrganizationCode, addMemberToOrganization } from "@/lib/db/organizations";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orgSlug, code } = await req.json();

    if (!orgSlug || !code) {
      return NextResponse.json({ error: "Organization Name and Code are required" }, { status: 400 });
    }

    // Verify the code against the database
    const org = await verifyOrganizationCode(orgSlug, code);

    if (!org) {
      return NextResponse.json({ error: "Invalid Organization Name or Invitation Code" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (user) {
      // User is logged in, add them to the organization immediately!
      let assignedRoleId: string | undefined;

      if (org.hierarchy_type === "custom") {
        const supabase = await createSupabaseServerClient();
        const { data: roles } = await supabase
          .from("roles")
          .select("id")
          .eq("organization_id", org.id)
          .order("hierarchy_level", { ascending: false }); // lowest role first (highest hierarchy level)
        if (roles && roles.length > 0) {
          assignedRoleId = roles[0].id;
        }
      }

      await addMemberToOrganization(org.id, user.id, "intern", assignedRoleId);

      return NextResponse.json({ success: true, slug: org.slug, loggedIn: true });
    }

    // If valid but not logged in, set a cookie to indicate pending join
    const cookieStore = await cookies();
    cookieStore.set("pending_join_org", org.slug, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
    });

    return NextResponse.json({ success: true, slug: org.slug, loggedIn: false });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
