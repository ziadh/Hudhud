import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { PetWindowPosition, PetWindowPreferences } from "./types";

const PREFERENCES_FILE = "window-preferences.json";

const defaultPreferences: PetWindowPreferences = {
  alwaysOnTop: true,
  position: null,
};

export function loadPetWindowPreferences(): PetWindowPreferences {
  try {
    const raw = fs.readFileSync(preferencesPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return parsePreferences(parsed);
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePetWindowPreferences(
  preferences: PetWindowPreferences,
): void {
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  const storedPreferences = {
    petAlwaysOnTop: preferences.alwaysOnTop,
    petPosition: preferences.position,
  };
  fs.writeFileSync(
    preferencesPath(),
    `${JSON.stringify(storedPreferences, null, 2)}\n`,
    "utf8",
  );
}

function preferencesPath(): string {
  return path.join(app.getPath("userData"), PREFERENCES_FILE);
}

function parsePreferences(value: unknown): PetWindowPreferences {
  if (typeof value !== "object" || value === null) {
    return { ...defaultPreferences };
  }

  const record = value as Partial<{
    petAlwaysOnTop: unknown;
    petPosition: unknown;
  }>;

  return {
    alwaysOnTop:
      typeof record.petAlwaysOnTop === "boolean"
        ? record.petAlwaysOnTop
        : defaultPreferences.alwaysOnTop,
    position: parsePosition(record.petPosition),
  };
}

function parsePosition(value: unknown): PetWindowPosition | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Partial<Record<keyof PetWindowPosition, unknown>>;
  if (typeof record.x !== "number" || typeof record.y !== "number") {
    return null;
  }

  if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) {
    return null;
  }

  return {
    x: Math.round(record.x),
    y: Math.round(record.y),
  };
}
