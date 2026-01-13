<script lang="ts">
  import { selectedEvents } from "$lib/state.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // View state
  let currentView = $state<"week" | "timeline">("timeline");

  // Timeline constants
  const HOUR_WIDTH = 60; // pixels per hour
  const DAY_WIDTH = 120; // pixels per day in week view
  const HOUR_HEIGHT = 50; // pixels per hour in week view

  // Festival time range (Stockholm timezone)
  const festivalStart = new Date("2026-01-22T08:00:00");
  const festivalEnd = new Date("2026-02-02T00:00:00");

  // Festival days for week view
  const festivalDays = $derived(() => {
    const result: { date: Date; label: string; dayIndex: number }[] = [];
    let current = new Date("2026-01-22T00:00:00");
    let dayIndex = 0;

    while (current < festivalEnd) {
      result.push({
        date: new Date(current),
        label: current.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        dayIndex,
      });
      current.setDate(current.getDate() + 1);
      dayIndex++;
    }

    return result;
  });

  // Hours of day for week view (8:00 - 24:00)
  const dayHours = $derived(() => {
    const result: { hour: number; label: string }[] = [];
    for (let h = 8; h <= 24; h++) {
      result.push({
        hour: h,
        label: `${h.toString().padStart(2, "0")}:00`,
      });
    }
    return result;
  });

  // Generate days array for timeline header
  const days = $derived(() => {
    const result: { date: Date; label: string; startHour: number; hours: number }[] = [];
    let current = new Date(festivalStart);

    while (current < festivalEnd) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);
      dayEnd.setHours(0, 0, 0, 0);

      if (dayEnd > festivalEnd) {
        dayEnd.setTime(festivalEnd.getTime());
      }

      const startHour = (dayStart.getTime() - festivalStart.getTime()) / (1000 * 60 * 60);
      const endHour = (dayEnd.getTime() - festivalStart.getTime()) / (1000 * 60 * 60);

      result.push({
        date: dayStart,
        label: dayStart.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        startHour,
        hours: endHour - startHour,
      });

      current.setDate(current.getDate() + 1);
      current.setHours(8, 0, 0, 0);
    }

    return result;
  });

  // Generate hourly markers for timeline
  const hours = $derived(() => {
    const result: { hour: number; label: string; left: number }[] = [];
    let current = new Date(festivalStart);
    let hourIndex = 0;

    while (current < festivalEnd) {
      result.push({
        hour: hourIndex,
        label: current.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        left: hourIndex * HOUR_WIDTH,
      });
      current.setHours(current.getHours() + 1);
      hourIndex++;
    }

    return result;
  });

  // Total timeline width
  const timelineWidth = $derived(hours().length * HOUR_WIDTH);

  // Process movies with screening positions for timeline
  const movies = $derived(
    data.resources
      .map((resource) => {
        const screenings = data.events
          .filter((e) => e.resourceIds[0] === resource.id)
          .map((e) => {
            const start = new Date(e.start);
            const end = new Date(e.end);

            // Convert to Stockholm time for positioning
            const startLocal = new Date(start.toLocaleString("en-US", { timeZone: "Europe/Stockholm" }));
            const endLocal = new Date(end.toLocaleString("en-US", { timeZone: "Europe/Stockholm" }));

            const startHours = (startLocal.getTime() - festivalStart.getTime()) / (1000 * 60 * 60);
            const durationHours = (endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60);

            return {
              id: String(e.id),
              title: e.title,
              start: startLocal,
              end: endLocal,
              left: startHours * HOUR_WIDTH,
              width: durationHours * HOUR_WIDTH,
              venue: e.extendedProps.location,
            };
          })
          .filter((s) => s.left >= 0 && s.left < timelineWidth)
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        return {
          id: resource.id,
          title: resource.title,
          imageUrl: resource.extendedProps.imageUrl,
          screenings,
        };
      })
      .filter((m) => m.screenings.length > 0)
  );

  // Selected screenings for week view
  const selectedScreenings = $derived(() => {
    const result: {
      id: string;
      movieId: string;
      title: string;
      venue: string;
      dayIndex: number;
      top: number;
      height: number;
    }[] = [];

    const festivalStartDay = new Date("2026-01-22T00:00:00");

    for (const movie of movies) {
      for (const screening of movie.screenings) {
        if (selectedEvents.has(screening.id)) {
          const dayIndex = Math.floor(
            (screening.start.getTime() - festivalStartDay.getTime()) / (1000 * 60 * 60 * 24)
          );
          const hourOfDay = screening.start.getHours() + screening.start.getMinutes() / 60;
          const durationHours =
            (screening.end.getTime() - screening.start.getTime()) / (1000 * 60 * 60);

          result.push({
            id: screening.id,
            movieId: movie.id,
            title: screening.title,
            venue: screening.venue,
            dayIndex,
            top: (hourOfDay - 8) * HOUR_HEIGHT,
            height: durationHours * HOUR_HEIGHT,
          });
        }
      }
    }

    return result;
  });

  async function share() {
    const url = selectedEvents.getShareUrl();
    const shareData = {
      title: "Göteborg Film Festival 2026",
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      alert("URL copied to clipboard!");
    }
  }

  function exportIcal() {
    const ids = selectedEvents.ids;
    if (ids.size === 0) {
      alert("No events selected");
      return;
    }

    const url = new URL("/export.ics", window.location.href);
    url.protocol = "webcal:";
    url.searchParams.set("selected", [...ids].join(","));
    window.location.href = url.toString();
  }
</script>

<div class="container">
  <header>
    <div class="view-selector">
      <button
        class:active={currentView === "timeline"}
        onclick={() => (currentView = "timeline")}
      >
        schedule
      </button>
      <button
        class:active={currentView === "week"}
        onclick={() => (currentView = "week")}
      >
        selected
      </button>
    </div>
    <h1>Göteborg Film Festival 2026</h1>
    <div class="actions">
      <button onclick={share}>Share</button>
      <button onclick={exportIcal}>iCal</button>
    </div>
  </header>

  {#if currentView === "week"}
    <!-- Week View -->
    <div class="week-wrapper">
      <div class="week-grid" style="grid-template-columns: 60px repeat({festivalDays().length}, {DAY_WIDTH}px)">
        <!-- Corner -->
        <div class="week-corner"></div>

        <!-- Day headers -->
        {#each festivalDays() as day}
          <div class="week-day-header">{day.label}</div>
        {/each}

        <!-- Hour labels column -->
        <div class="week-hours-column">
          {#each dayHours() as hour}
            <div class="week-hour-label">{hour.label}</div>
          {/each}
        </div>

        <!-- Day columns with screenings -->
        {#each festivalDays() as day}
          <div class="week-day-column">
            <!-- Hour grid lines -->
            {#each dayHours() as hour}
              <div class="week-cell"></div>
            {/each}

            <!-- Screenings for this day -->
            {#each selectedScreenings().filter(s => s.dayIndex === day.dayIndex) as screening}
              <a
                class="week-screening"
                href="https://program.goteborgfilmfestival.se/en/program/{screening.movieId}"
                target="_blank"
                style="top: {screening.top}px; height: {screening.height}px;"
              >
                <div class="week-screening-title">{screening.title}</div>
                <div class="week-screening-venue">{screening.venue}</div>
              </a>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Timeline View -->
    <div class="timeline-wrapper">
      <div class="timeline">
        <!-- Corner cell (empty, for alignment) -->
        <div class="corner"></div>

        <!-- Day headers -->
        <div class="day-headers" style="width: {timelineWidth}px">
          {#each days() as day}
            <div
              class="day-header"
              style="left: {day.startHour * HOUR_WIDTH}px; width: {day.hours * HOUR_WIDTH}px"
            >
              {day.label}
            </div>
          {/each}
        </div>

        <!-- Hour headers row -->
        <div class="hour-label-spacer"></div>
        <div class="hour-headers" style="width: {timelineWidth}px">
          {#each hours() as hour}
            <div class="hour-header" style="left: {hour.left}px">
              {hour.label}
            </div>
          {/each}
        </div>

        <!-- Movie rows -->
        {#each movies as movie}
          <a class="movie-cell" href="https://program.goteborgfilmfestival.se/en/program/{movie.id}">
            {#if movie.imageUrl?.thumbnail}
              <img
                class="movie-poster"
                src={movie.imageUrl.thumbnail}
                alt={movie.title}
                loading="lazy"
              />
            {:else}
              <div class="movie-poster placeholder"></div>
            {/if}
            <span class="movie-title">{movie.title}</span>
          </a>
          <div class="screenings-track" style="width: {timelineWidth}px">
            {#each movie.screenings as screening}
              <button
                class="screening"
                class:selected={selectedEvents.has(screening.id)}
                onclick={() => selectedEvents.toggle(screening.id)}
                style="left: {screening.left}px; width: {Math.max(screening.width, 30)}px"
              >
                {screening.venue}
              </button>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid #ddd;
    background: #fff;
    flex-shrink: 0;
  }

  h1 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .view-selector {
    display: flex;
    gap: 0;
  }

  .view-selector button {
    background: #fff;
    border: 1px solid #ddd;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 12px;
  }

  .view-selector button:first-child {
    border-radius: 3px 0 0 3px;
  }

  .view-selector button:last-child {
    border-radius: 0 3px 3px 0;
    border-left: none;
  }

  .view-selector button.active {
    background: #333;
    color: #fff;
    border-color: #333;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .actions button {
    background: none;
    border: 1px solid #ddd;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 12px;
  }

  .actions button:hover {
    border-color: #999;
  }

  /* Week View Styles */
  .week-wrapper {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .week-grid {
    display: grid;
    grid-template-rows: 30px 1fr;
  }

  .week-corner {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 30;
    background: #fff;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
  }

  .week-day-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
    line-height: 30px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
  }

  .week-hours-column {
    position: sticky;
    left: 0;
    z-index: 10;
    background: #fff;
  }

  .week-hour-label {
    background: #fff;
    border-bottom: 1px solid #eee;
    border-right: 1px solid #ddd;
    height: 50px;
    line-height: 50px;
    text-align: center;
    font-size: 11px;
    color: #666;
  }

  .week-day-column {
    position: relative;
    border-right: 1px solid #ddd;
  }

  .week-cell {
    border-bottom: 1px solid #eee;
    height: 50px;
  }

  .week-screening {
    position: absolute;
    left: 2px;
    right: 2px;
    background: #4caf50;
    border-radius: 3px;
    padding: 4px 6px;
    overflow: hidden;
    color: #fff;
    font-size: 11px;
    z-index: 5;
    text-decoration: none;
    display: block;
    cursor: pointer;
  }

  .week-screening:hover {
    background: #43a047;
  }

  .week-screening-title {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .week-screening-venue {
    opacity: 0.9;
    font-size: 10px;
  }

  /* Timeline View Styles */
  .timeline-wrapper {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
  }

  .timeline {
    display: grid;
    grid-template-columns: 200px 1fr;
    width: max-content;
    min-width: 100%;
  }

  .corner {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 30;
    background: #fff;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
    height: 50px;
  }

  .day-headers {
    position: sticky;
    top: 0;
    z-index: 20;
    height: 25px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .day-header {
    position: absolute;
    top: 0;
    height: 25px;
    line-height: 25px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    border-right: 1px solid #ddd;
    background: #f5f5f5;
  }

  .hour-label-spacer {
    position: sticky;
    left: 0;
    top: 25px;
    z-index: 30;
    height: 25px;
    background: #fff;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
  }

  .hour-headers {
    position: sticky;
    top: 25px;
    z-index: 20;
    height: 25px;
    background: #fff;
    border-bottom: 1px solid #ddd;
  }

  .hour-header {
    position: absolute;
    top: 0;
    width: 60px;
    height: 25px;
    line-height: 25px;
    text-align: center;
    font-size: 11px;
    color: #666;
    border-right: 1px solid #eee;
  }

  .movie-cell {
    position: sticky;
    left: 0;
    z-index: 10;
    background: #fff;
    padding: 5px 10px;
    height: 60px;
    border-bottom: 1px solid #eee;
    border-right: 1px solid #ddd;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #0060a0;
  }

  .movie-cell:hover {
    background: #f9f9f9;
  }

  .movie-cell:hover .movie-title {
    color: #ff4f20;
    text-decoration: underline;
  }

  .movie-poster {
    width: 35px;
    height: 50px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .movie-poster.placeholder {
    background: #eee;
  }

  .movie-title {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .screenings-track {
    position: relative;
    height: 60px;
    border-bottom: 1px solid #eee;
    background:
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 59px,
        #f0f0f0 59px,
        #f0f0f0 60px
      );
  }

  .screening {
    position: absolute;
    top: 5px;
    height: 50px;
    background: #90caf9;
    border: none;
    border-radius: 3px;
    padding: 0 6px;
    font-size: 11px;
    color: #1565c0;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  .screening:hover {
    background: #64b5f6;
  }

  .screening.selected {
    background: #4caf50;
    color: #fff;
  }

  .screening.selected:hover {
    background: #43a047;
  }
</style>
