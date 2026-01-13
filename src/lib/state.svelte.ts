import { goto } from "$app/navigation";
import { page } from "$app/state";

function createSelectedEventsState() {
  const getIds = (): Set<string> => {
    return new Set(
      page.url.searchParams.get("selected")?.split(",").filter(Boolean) || []
    );
  };

  const updateUrl = (ids: Set<string>) => {
    const url = new URL(page.url);
    if (ids.size > 0) {
      url.searchParams.set("selected", [...ids].join(","));
    } else {
      url.searchParams.delete("selected");
    }
    goto(url.toString(), {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  };

  return {
    get ids() {
      return getIds();
    },
    has(id: string) {
      return getIds().has(id);
    },
    toggle(id: string) {
      const newSet = new Set(getIds());
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      updateUrl(newSet);
    },
    getShareUrl() {
      return page.url.toString();
    },
  };
}

export const selectedEvents = createSelectedEventsState();
