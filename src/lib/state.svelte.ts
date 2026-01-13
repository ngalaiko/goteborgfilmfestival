import { goto } from "$app/navigation";
import { page } from "$app/state";

function createUrlSetState(paramName: string) {
  const getIds = () =>
    new Set(
      page.url.searchParams.get(paramName)?.split(",").filter(Boolean) || [],
    );

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

      const url = new URL(page.url);
      if (newSet.size > 0) {
        url.searchParams.set(paramName, [...newSet].join(","));
      } else {
        url.searchParams.delete(paramName);
      }
      goto(url.toString(), {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    },
  };
}

function createUrlStringState(paramName: string, defaultValue: string) {
  return {
    get value() {
      return page.url.searchParams.get(paramName) || defaultValue;
    },
    set(value: string) {
      const url = new URL(page.url);
      if (value === defaultValue) {
        url.searchParams.delete(paramName);
      } else {
        url.searchParams.set(paramName, value);
      }
      goto(url.toString(), {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    },
  };
}

export const selectedEvents = createUrlSetState("selected");
export const currentView = createUrlStringState("view", "resourceTimelineWeek");
