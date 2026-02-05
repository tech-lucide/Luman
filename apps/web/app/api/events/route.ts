import { createEvent, getEvents } from "@/lib/db/events";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/events?workspaceId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const events = await getEvents(workspaceId || undefined);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, start_time, end_time, all_day, event_type, workspace_id, note_id, created_by } = body;

    if (!title || !start_time) {
      return NextResponse.json({ error: "Title and start_time are required" }, { status: 400 });
    }

    const event = await createEvent({
      title,
      description,
      start_time,
      end_time,
      all_day: all_day || false,
      event_type: event_type || "event",
      workspace_id,
      note_id,
      created_by,
      is_completed: false,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
