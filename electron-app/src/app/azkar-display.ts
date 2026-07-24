import type { AzkarDisplayPreferences } from "./types";

export const defaultAzkarDisplayPreferences: AzkarDisplayPreferences = {
  transliteration: true,
  translation: true,
};

export function parseAzkarDisplayPreferences(
  raw: string | null,
): AzkarDisplayPreferences {
  if (raw === null) {
    return { ...defaultAzkarDisplayPreferences };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return { ...defaultAzkarDisplayPreferences };
    }

    const record = value as Partial<AzkarDisplayPreferences>;
    return {
      transliteration:
        typeof record.transliteration === "boolean"
          ? record.transliteration
          : true,
      translation:
        typeof record.translation === "boolean" ? record.translation : true,
    };
  } catch {
    return { ...defaultAzkarDisplayPreferences };
  }
}

export function toggleAzkarDisplayPreference(
  preferences: AzkarDisplayPreferences,
  field: keyof AzkarDisplayPreferences,
): AzkarDisplayPreferences {
  return {
    ...preferences,
    [field]: !preferences[field],
  };
}
