"use client";

import { CalendarGrid } from "@/components/calendar-grid";
import { EventModal } from "@/components/event-modal";
import AppShell from "@/components/layouts/app-shell";
import { Calendar, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  event_type: "event" | "reminder" | "task";
  workspace_id?: string;
  note_id?: string;
  workspaces?: { owner_name: string };
};

export default function OrganizationCalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await fetch("/api/calendar/organization");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter events by workspace
  const filteredEvents =
    selectedWorkspace === "all" ? events : events.filter((e) => e.workspace_id === selectedWorkspace);

  // Get unique workspaces
  const workspaces = Array.from(new Set(events.map((e) => e.workspace_id).filter(Boolean))).map((id) => {
    const event = events.find((e) => e.workspace_id === id);
    return {
      id,
      name: event?.workspaces?.owner_name || "Unknown",
    };
  });

  // Get upcoming events (all future events)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const upcomingEvents = filteredEvents
    .filter((event) => {
      const eventDate = new Date(event.start_time);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <AppShell>
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <h1 className="font-black uppercase leading-none border-l-8 border-foreground pl-6">
              ORGANIZATION
              <br />
              CALENDAR
            </h1>

            <div className="flex items-center gap-4">
              <CalendarGrid
                events={filteredEvents.map((e) => ({
                  ...e,
                  is_completed: false,
                }))}
                currentDate={currentDate}
                onEventComplete={async (eventId) => {
                  // Optional: handle event completion via API
                  console.log("Complete event:", eventId);
                }}
              />

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground flex items-center gap-3"
              >
                <Plus className="h-6 w-6" />
                NEW EVENT
              </button>
            </div>
          </div>

          {/* Workspace Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-black uppercase tracking-wider">FILTER:</span>
            <button
              type="button"
              onClick={() => setSelectedWorkspace("all")}
              className={`px-6 py-3 text-sm font-black uppercase border-brutal hover-brutal ${
                selectedWorkspace === "all" ? "bg-accent text-accent-foreground" : "bg-background"
              }`}
            >
              ALL WORKSPACES ({events.length})
            </button>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => setSelectedWorkspace(ws.id!)}
                className={`px-6 py-3 text-sm font-black uppercase border-brutal hover-brutal ${
                  selectedWorkspace === ws.id ? "bg-accent text-accent-foreground" : "bg-background"
                }`}
              >
                {ws.name} ({events.filter((e) => e.workspace_id === ws.id).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-lg font-bold uppercase">LOADING...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="border-brutal-thick p-12 bg-muted">
            <div className="text-center space-y-6">
              <Calendar className="h-16 w-16 mx-auto opacity-50" />
              <h3 className="text-3xl font-black uppercase">NO UPCOMING EVENTS</h3>
              <p className="text-lg font-bold uppercase">CREATE YOUR FIRST EVENT</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase border-b-4 border-foreground pb-4">
              UPCOMING EVENTS ({upcomingEvents.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-brutal shadow-brutal hover-brutal bg-card p-8">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-2xl font-black uppercase leading-tight mb-2">
                          {event.note_id && event.workspace_id ? (
                            <a
                              href={`/workspace/${event.workspace_id}/note/${event.note_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent transition-colors underline decoration-2"
                              title="Open linked note"
                            >
                              {event.title} 📝
                            </a>
                          ) : (
                            event.title
                          )}
                        </div>
                        <div className="text-sm font-bold uppercase opacity-70">
                          {formatDate(event.start_time)}
                          {!event.all_day && ` • ${formatTime(event.start_time)}`}
                          {event.end_time && !event.all_day && ` - ${formatTime(event.end_time)}`}
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm font-black uppercase border-brutal ${
                          event.event_type === "event"
                            ? "bg-accent text-accent-foreground"
                            : event.event_type === "reminder"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-foreground text-background"
                        }`}
                      >
                        {event.event_type}
                      </span>
                    </div>

                    {event.workspaces && (
                      <div className="px-4 py-2 text-xs font-black uppercase border-2 border-foreground bg-muted inline-block">
                        {event.workspaces.owner_name}
                      </div>
                    )}

                    {event.description && (
                      <p className="text-base font-bold pt-4 border-t-4 border-foreground">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onEventCreated={loadEvents} />
    </AppShell>
  );
}
