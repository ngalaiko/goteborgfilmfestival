import { error } from "@sveltejs/kit";
import events from "$lib/data/events.json" with { type: "json" };
import resources from "$lib/data/resources.json" with { type: "json" };
import type { RequestHandler } from "./$types";

function formatICalDate(date: Date): string {
  // Format as UTC time with Z suffix: YYYYMMDDTHHMMSSZ
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export const GET: RequestHandler = ({ url }) => {
  const selectedIds =
    url.searchParams.get("selected")?.split(",").filter(Boolean) || [];

  if (selectedIds.length === 0) {
    throw error(400, "No events selected");
  }

  const selected = events.filter((e) => selectedIds.includes(String(e.id)));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Göteborg Film Festival//Schedule//EN",
  ];

  for (const event of selected) {
    const resource = resources.find((r) => r.id === event.resourceIds[0]);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@goteborgfilmfestival`,
      `DTSTART:${formatICalDate(new Date(event.start))}`,
      `DTEND:${formatICalDate(new Date(event.end))}`,
      `SUMMARY:${resource?.title || event.title}`,
      `LOCATION:${event.extendedProps?.location || ""}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": 'attachment; filename="gff-schedule.ics"',
    },
  });
};
