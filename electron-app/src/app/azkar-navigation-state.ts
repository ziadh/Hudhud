import { AZKAR_NAVIGATION_KEY } from "./storage-keys";
import type { AzkarNavigationState } from "./types";

export const defaultAzkarNavigationState: AzkarNavigationState = {
  view: "home",
  period: "morning",
  entryIndex: 0,
};

export function parseAzkarNavigationState(
  raw: string | null,
): AzkarNavigationState {
  if (raw === null) {
    return { ...defaultAzkarNavigationState };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return { ...defaultAzkarNavigationState };
    }

    const record = value as Partial<AzkarNavigationState>;
    return {
      view:
        record.view === "home" || record.view === "reader"
          ? record.view
          : defaultAzkarNavigationState.view,
      period:
        record.period === "morning" || record.period === "evening"
          ? record.period
          : defaultAzkarNavigationState.period,
      entryIndex:
        typeof record.entryIndex === "number" &&
        Number.isFinite(record.entryIndex) &&
        Number.isInteger(record.entryIndex) &&
        record.entryIndex >= 0
          ? record.entryIndex
          : defaultAzkarNavigationState.entryIndex,
    };
  } catch {
    return { ...defaultAzkarNavigationState };
  }
}

export function loadAzkarNavigationState(): AzkarNavigationState {
  return parseAzkarNavigationState(localStorage.getItem(AZKAR_NAVIGATION_KEY));
}

export function saveAzkarNavigationState(value: AzkarNavigationState): void {
  localStorage.setItem(AZKAR_NAVIGATION_KEY, JSON.stringify(value));
}
