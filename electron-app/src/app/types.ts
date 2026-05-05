import type {
  CalculationMethod,
  MainPrayerName,
  PrayerSettings,
} from "../types";
import type { MAIN_PRAYERS, SECONDARY_PRAYERS } from "./constants";

export type AppState = "empty" | "loading" | "preview" | "configured" | "error";
export type SetupStep = "location" | "calculation";
export type SettingsTab = SetupStep | "general";
export type FormMode = "onboarding" | "settings";

export type MainPrayer = (typeof MAIN_PRAYERS)[number];
export type SecondaryPrayer = (typeof SECONDARY_PRAYERS)[number];
export type PrayerName = MainPrayer | SecondaryPrayer;

export interface PrayerTimings {
  Fajr: string;
  Sunrise?: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerResult {
  settings: PrayerSettings;
  timings: PrayerTimings;
  methodName: string;
  timezone: string;
  updatedAt: Date;
}

export interface PrayerOccurrence {
  prayer: MainPrayerName;
  date: Date;
  key: string;
}

export interface PetDecision {
  status: import("../types").PetStatus;
  activeOccurrenceKey: string | null;
}

export interface AladhanResponse {
  code?: number;
  status?: string;
  data?: {
    timings?: Partial<Record<PrayerName, string>>;
    meta?: {
      timezone?: string;
      method?: {
        id?: number;
        name?: string;
      };
    };
  };
}

export interface MethodOption {
  value: CalculationMethod;
  label: string;
}

export interface HybridOption {
  value: string;
  label: string;
}

export interface CountryCities {
  country: string;
  cities: string[];
}

export interface CountriesNowResponse {
  error?: boolean;
  msg?: string;
  data?: CountryCities[];
}

export interface StateOption {
  name: string;
  state_code?: string;
}

export interface StatesNowResponse {
  error?: boolean;
  msg?: string;
  data?: {
    name?: string;
    states?: StateOption[];
  };
}

export interface StateCitiesNowResponse {
  error?: boolean;
  msg?: string;
  data?: string[];
}
