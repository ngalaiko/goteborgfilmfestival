import resources from "$lib/data/resources.json" with { type: "json" };
import events from "$lib/data/events.json" with { type: "json" };
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({}) => {
  return {
    resources,
    events,
  };
};
