import type { PrayerSettings } from "../types";
import { defaultSettings, SETTINGS_KEY } from "./constants";
import { isPrayerSettings } from "./parsers";

export function saveSettings(settings: PrayerSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): PrayerSettings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateToCurrentSchema(parsed);
    return isPrayerSettings(migrated) ? migrated : null;
  } catch (err) {
    console.error("Failed to parse saved settings:", err);
    return null;
  }
}

function migrateToCurrentSchema(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  return {
    ...defaultSettings,
    ...record,
    offsets: {
      ...defaultSettings.offsets,
      ...(typeof record.offsets === "object" && record.offsets !== null
        ? (record.offsets as Record<string, unknown>)
        : {}),
    },
  };
}
