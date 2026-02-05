import { getOrganizationEvents } from "@/lib/db/events";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/calendar/organization
export async function GET(req: NextRequest) {
  try {
    const events = await getOrganizationEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching organization calendar:", error);
    return NextResponse.json({ error: "Failed to fetch organization calendar" }, { status: 500 });
  }
}
