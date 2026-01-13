import { writeFileSync } from "fs";
import { join } from "path";
import { Calendar } from "@event-calendar/core";

const API_BASE = "https://program.goteborgfilmfestival.se/api";
const DATA_DIR = join(process.cwd(), "src", "lib", "data");

interface FestivalDate {
  label: string;
  value: string;
}

interface ConfigResponse {
  festivalDates: FestivalDate[];
}

interface Screening {
  eventKey: string;
  occasionId: number;
  title: string;
  uniqueTitle: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  price: number;
  amount: number;
  amountLeft: number;
  type: string;
  occasionType: string;
  viewingNumber: string;
}

interface ScheduleResponse {
  result: {
    documents: Screening[];
  };
}

async function fetchAllScreenings(): Promise<Screening[]> {
  console.log("Fetching festival config...");

  // Fetch config
  const configRes = await fetch(`${API_BASE}/config`);
  const config: ConfigResponse = await configRes.json();
  const dates = config.festivalDates.map((d) => d.label);

  console.log(
    `Found ${dates.length} festival dates: ${dates[0]} to ${dates[dates.length - 1]}`,
  );

  // Fetch schedule for each day
  const allScreenings: Screening[] = [];

  for (const date of dates) {
    console.log(`Fetching schedule for ${date}...`);
    const res = await fetch(
      `${API_BASE}/tableau/schedule?dayOfSearch=${date}&offset=0&size=500`,
    );
    const data: ScheduleResponse = await res.json();
    const screenings = (data.result?.documents || []).filter(
      (s) => s.type === "Movie",
    );
    allScreenings.push(...screenings);
    console.log(`  Found ${screenings.length} movie screenings`);
  }

  return allScreenings;
}

function getUniqueResources(
  screenings: Screening[],
): Partial<Calendar.Resource>[] {
  return screenings.reduce((acc, screening) => {
    const exists = acc.find((r) => r.id === screening.uniqueTitle);
    if (!exists) {
      acc.push(convertScreeningToResource(screening));
    }
    return acc;
  }, [] as Partial<Calendar.Resource>[]);
}

function convertScreeningToResource(
  screening: Screening,
): Partial<Calendar.Resource> {
  return {
    id: screening.uniqueTitle,
    title: screening.title,
  };
}

function convertScreeingToEvent(screening: Screening): Partial<Calendar.Event> {
  return {
    id: screening.occasionId,
    resourceIds: [screening.uniqueTitle],
    start: new Date(screening.timeStart),
    end: new Date(screening.timeEnd),
    title: screening.title,
    extendedProps: {
      location: screening.location,
    },
  };
}

async function main() {
  const screenings = await fetchAllScreenings();

  const resources = getUniqueResources(screenings);
  const events = screenings.map(convertScreeingToEvent);

  // Write resources to file
  const resourcesPath = join(DATA_DIR, "resources.json");
  writeFileSync(resourcesPath, JSON.stringify(resources, null, 2));
  console.log(`Wrote ${resources.length} resources to ${resourcesPath}`);

  // Write events to file
  const eventsPath = join(DATA_DIR, "events.json");
  writeFileSync(eventsPath, JSON.stringify(events, null, 2));
  console.log(`Wrote ${events.length} events to ${eventsPath}`);
}

main().catch((error) => {
  console.error("Error occurred:", error);
  process.exit(1);
});
