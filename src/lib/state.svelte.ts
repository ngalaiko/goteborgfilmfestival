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

export type View = "timeline" | "week";

function createViewState() {
  const getView = (): View => {
    const view = page.url.searchParams.get("view");
    return view === "week" ? "week" : "timeline";
  };

  const setView = (view: View) => {
    const url = new URL(page.url);
    if (view === "timeline") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    goto(url.toString(), {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  };

  return {
    get current() {
      return getView();
    },
    set(view: View) {
      setView(view);
    },
  };
}

export const viewState = createViewState();
