import { error } from "@sveltejs/kit";
import events from "$lib/data/events.json";
import resources from "$lib/data/resources.json";
import type { RequestHandler } from "./$types";

function formatICalDate(date: Date): string {
  // Format as local time in Stockholm timezone: YYYYMMDDTHHMMSS
  const formatted = date
    .toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/[-: ]/g, "")
    .replace(",", "T");
  // Result: YYYYMMDDHHMMSS, need to insert T
  return formatted.slice(0, 8) + "T" + formatted.slice(8);
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
