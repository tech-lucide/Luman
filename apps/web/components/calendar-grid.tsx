"use client";

import { Calendar as CalendarIcon, Check, List } from "lucide-react";
import { useState } from "react";

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  event_type: "event" | "reminder" | "task";
  is_completed: boolean;
}

interface CalendarGridProps {
  events: Event[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  onEventComplete?: (eventId: string) => void;
}

export function CalendarGrid({ events, currentDate, onDateClick, onEventComplete }: CalendarGridProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // Create calendar grid
  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get events for a specific date
  function getEventsForDate(day: number) {
    const dateStr = new Date(year, month, day).toDateString();
    return events.filter((event) => {
      const eventDate = new Date(event.start_time).toDateString();
      return eventDate === dateStr;
    });
  }

  // Check if date has events
  function hasEvents(day: number) {
    return getEventsForDate(day).length > 0;
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.start_time).toDateString();
        return eventDate === selectedDate.toDateString();
      })
    : [];

  if (viewMode === "grid") {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black uppercase">CALENDAR GRID</h2>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setSelectedDate(null);
              }}
              className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-background flex items-center gap-3"
            >
              <List className="h-6 w-6" />
              LIST VIEW
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="border-brutal-thick bg-card p-8">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-4 mb-8">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day} className="text-center text-lg font-black uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-4">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square" />;
                }

                const dateObj = new Date(year, month, day);
                const isToday = new Date().toDateString() === dateObj.toDateString();
                const dayHasEvents = hasEvents(day);
                const isSelected = selectedDate && selectedDate.toDateString() === dateObj.toDateString();

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateObj);
                      onDateClick?.(dateObj);
                    }}
                    className={`aspect-square border-brutal-thick p-6 relative transition-none ${
                      isSelected
                        ? "bg-accent text-accent-foreground shadow-brutal-lg"
                        : isToday
                          ? "bg-foreground text-background shadow-brutal"
                          : dayHasEvents
                            ? "bg-muted hover-brutal"
                            : "bg-background hover-brutal"
                    }`}
                  >
                    <div className="text-4xl font-black leading-none">{day}</div>
                    {dayHasEvents && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {getEventsForDate(day)
                          .slice(0, 3)
                          .map((_, i) => (
                            <div key={i} className="w-3 h-3 border-2 border-foreground bg-accent" />
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && selectedDateEvents.length > 0 && (
            <div className="border-brutal-thick p-8 bg-card shadow-brutal-xl">
              <h3 className="text-3xl font-black uppercase mb-8 border-b-4 border-foreground pb-4">
                {selectedDate
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </h3>
              <div className="space-y-6">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="border-brutal-thick p-8 bg-background shadow-brutal">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div
                          className={`text-2xl font-black uppercase leading-tight mb-3 ${
                            event.is_completed ? "opacity-50 line-through" : ""
                          }`}
                        >
                          {event.title}
                        </div>
                        <div className="flex items-center gap-4 mb-3">
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
                          {!event.all_day && (
                            <div className="text-base font-bold uppercase">
                              {formatTime(event.start_time)}
                              {event.end_time && ` - ${formatTime(event.end_time)}`}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-base font-bold pt-4 border-t-4 border-foreground">{event.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventComplete?.(event.id);
                        }}
                        className={`p-4 border-brutal-thick hover-brutal shrink-0 ${
                          event.is_completed ? "bg-accent text-accent-foreground" : "bg-background"
                        }`}
                        title={event.is_completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        <Check className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setViewMode("grid")}
      className="px-8 py-4 text-lg font-black uppercase border-brutal hover-brutal bg-accent text-accent-foreground flex items-center gap-3"
    >
      <CalendarIcon className="h-6 w-6" />
      FULL CALENDAR
    </button>
  );
}
