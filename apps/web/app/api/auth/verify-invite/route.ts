import { verifyOrganizationCode } from "@/lib/db/organizations";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orgSlug, code } = await req.json();

    if (!orgSlug || !code) {
      return NextResponse.json({ error: "Organization Name and Code are required" }, { status: 400 });
    }

    // Verify the code against the database
    // We assume orgSlug is effectively the Org Name or Slug entered by user.
    // The user might enter "Lucide Tech" -> we might need to slugify it to match,
    // but the verification function expects a slug.
    // Let's assume the frontend sends the slug or we verify by name if needed.
    // For now, let's assume the user enters the SLUG or Name and we try to match.
    // Actually, exact match on slug is safer.

    const org = await verifyOrganizationCode(orgSlug, code);

    if (!org) {
      return NextResponse.json({ error: "Invalid Organization Name or Invitation Code" }, { status: 400 });
    }

    // If valid, set a cookie to indicate pending join
    const cookieStore = await cookies();
    cookieStore.set("pending_join_org", org.slug, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
    });

    return NextResponse.json({ success: true, slug: org.slug });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
