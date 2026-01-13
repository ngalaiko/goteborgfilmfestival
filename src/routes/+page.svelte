<script lang="ts">
  import {
    Calendar,
    TimeGrid,
    ResourceTimeline,
    Interaction,
  } from "@event-calendar/core";
  import { selectedEvents, currentView } from "$lib/state.svelte";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // Get initial view once (non-reactive) to avoid scroll reset on URL changes
  const initialView = currentView.value;
</script>

<main>
  <Calendar
    plugins={[TimeGrid, ResourceTimeline, Interaction]}
    options={{
      height: "calc(100vh - 1.5rem)",
      titleFormat: () => "Göteborg Film Festival 2026",
      date: "2026-01-22",
      validRange: {
        start: "2026-01-22",
        end: "2026-02-01",
      },
      slotMinTime: "08:00:00",
      slotMaxTime: "23:59:59",
      duration: { days: 11 },
      filterResourcesWithEvents: true,
      view: initialView,
      viewDidMount: ({ view }) => {
        if (view.type !== currentView.value) {
          currentView.set(view.type);
        }
      },
      headerToolbar: {
        start: "timeGridWeek,resourceTimelineWeek",
        center: "title",
        end: "share export",
      },
      customButtons: {
        share: {
          text: "Share",
          click: async () => {
            const shareData = {
              title: "Göteborg Film Festival 2026",
              url: window.location.href,
            };
            if (navigator.share && navigator.canShare?.(shareData)) {
              await navigator.share(shareData);
            } else {
              await navigator.clipboard.writeText(window.location.href);
              alert("URL copied to clipboard!");
            }
          },
        },
        export: {
          text: "iCal",
          click: async () => {
            const selected = new URL(window.location.href).searchParams.get(
              "selected",
            );
            if (!selected) {
              alert("No events selected");
              return;
            }

            const url = new URL("/export.ics", window.location.href);
            url.protocol = "webcal:";
            url.searchParams.set("selected", selected);
            window.location.href = url.toString();
          },
        },
      },
      resourceLabelContent: ({ resource }) => ({
        html: `<a href="https://program.goteborgfilmfestival.se/en/program/${resource.id}">${resource.title}</a>`,
      }),
      eventClassNames: ({ event }) => {
        return selectedEvents.has(String(event.id)) ? "event-selected" : "";
      },
      views: {
        timeGridWeek: {
          eventTimeFormat: () => "",
          eventFilter: ({ event }) => {
            return selectedEvents.has(String(event.id));
          },
          eventContent: ({ event }) => {
            const location = (event.extendedProps?.location as string) || "";
            return {
              html: `<div class="event-title">${event.title}</div><div class="event-location">${location}</div>`,
            };
          },
          eventClick: ({ event }) => {
            window.open(
              `https://program.goteborgfilmfestival.se/en/program/${event.resourceIds[0]}`,
              "_blank",
            );
          },
        },
        resourceTimelineWeek: {
          eventContent: ({ event }) => {
            const location = (event.extendedProps?.location as string) || "";
            return {
              html: location,
            };
          },
          eventClick: ({ event }) => {
            selectedEvents.toggle(String(event.id));
          },
        },
      },
      events: data.events.map((event) => ({
		...event,
		start: new Date(event.start).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }),
		end: new Date(event.end).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }),
	  })),
      resources: data.resources,
    }}
  />
</main>

<style>
  :global(.ec-row-head) {
    width: 10rem;
    text-align: start;
    min-height: min-content;
  }

  :global(.event-selected) {
    background-color: #4caf50 !important;
    border-color: #388e3c !important;
  }

  :global(.event-location) {
    font-size: 0.85em;
    opacity: 0.8;
  }
</style>
