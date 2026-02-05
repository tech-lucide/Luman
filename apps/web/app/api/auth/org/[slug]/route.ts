import { getOrganizationBySlug } from "@/lib/db/organizations";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/auth/org/[slug] - Verify organization exists
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({
      exists: true,
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
  }
}
