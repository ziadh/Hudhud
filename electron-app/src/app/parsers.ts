import type {
  AsrSchool,
  CalculationMethod,
  LatitudeAdjustmentMethod,
  PrayerSettings,
  Shafaq,
} from "../types";
import { methodOptions } from "./constants";
import type { SettingsTab } from "./types";

export function parseMethod(value: string): CalculationMethod {
  if (value === "auto") {
    return "auto";
  }

  const method = Number(value);
  return isCalculationMethod(method) ? method : "auto";
}

export function isCalculationMethod(
  value: unknown,
): value is CalculationMethod {
  return methodOptions.some((option) => option.value === value);
}

export function parseSchool(value: string): AsrSchool {
  return value === "1" ? 1 : 0;
}

export function parseSettingsTab(value: string): SettingsTab | null {
  return value === "location" || value === "calculation" || value === "general"
    ? value
    : null;
}

export function parseLatitudeAdjustment(
  value: string,
): LatitudeAdjustmentMethod {
  if (value === "1" || value === "2" || value === "3") {
    return Number(value) as LatitudeAdjustmentMethod;
  }

  return "default";
}

export function isLatitudeAdjustment(
  value: unknown,
): value is LatitudeAdjustmentMethod {
  return value === "default" || value === 1 || value === 2 || value === 3;
}

export function parseShafaq(value: string): Shafaq {
  return isShafaq(value) ? value : "general";
}

export function isShafaq(value: unknown): value is Shafaq {
  return value === "general" || value === "ahmer" || value === "abyad";
}

export function parseOffset(value: string): number {
  return Number(value);
}

export function isValidOffset(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= -30 &&
    value <= 30
  );
}

export function parseTimingDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPrayerSettings(value: unknown): value is PrayerSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<PrayerSettings>;
  return (
    typeof settings.city === "string" &&
    typeof settings.country === "string" &&
    typeof settings.state === "string" &&
    isCalculationMethod(settings.method) &&
    (settings.school === 0 || settings.school === 1) &&
    isLatitudeAdjustment(settings.latitudeAdjustmentMethod) &&
    isShafaq(settings.shafaq) &&
    typeof settings.offsets === "object" &&
    settings.offsets !== null &&
    isValidOffset(settings.offsets.fajr) &&
    isValidOffset(settings.offsets.dhuhr) &&
    isValidOffset(settings.offsets.asr) &&
    isValidOffset(settings.offsets.maghrib) &&
    isValidOffset(settings.offsets.isha)
  );
}
