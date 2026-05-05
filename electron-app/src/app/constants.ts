import type { PrayerSettings } from "../types";
import type { HybridOption, MethodOption } from "./types";

export const API_BASE = "https://api.aladhan.com/v1/timingsByCity";
export const COUNTRIES_API = "https://countriesnow.space/api/v0.1/countries";
export const STATES_API =
  "https://countriesnow.space/api/v0.1/countries/states";
export const STATE_CITIES_API =
  "https://countriesnow.space/api/v0.1/countries/state/cities";

export const MAIN_PRAYERS = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const;
export const SECONDARY_PRAYERS = ["Sunrise"] as const;
export const STATE_REQUIRED_COUNTRIES = new Set(["United States", "Canada"]);

export const PET_ONBOARDING_BUBBLE = "Click me to set up your settings";
export const PET_PRAYER_CONFIRM_HINT = "Right click to confirm done";
export const PET_ALERT_WINDOW_MS = 10 * 60 * 1000;
export const PET_SCHEDULER_INTERVAL_MS = 15 * 1000;
export const PET_HAPPY_MS = 20 * 1000;

export const methodOptions: readonly MethodOption[] = [
  { value: "auto", label: "Closest local authority" },
  { value: 0, label: "Shia Ithna-Ashari" },
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America" },
  { value: 3, label: "Muslim World League" },
  { value: 4, label: "Umm Al-Qura University, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" },
  { value: 7, label: "Institute of Geophysics, University of Tehran" },
  { value: 8, label: "Gulf Region" },
  { value: 9, label: "Kuwait" },
  { value: 10, label: "Qatar" },
  { value: 11, label: "Majlis Ugama Islam Singapura" },
  { value: 12, label: "Union Organization Islamic de France" },
  { value: 13, label: "Diyanet, Turkey" },
  { value: 14, label: "Spiritual Administration of Muslims of Russia" },
  { value: 15, label: "Moonsighting Committee Worldwide" },
  { value: 16, label: "Dubai" },
];

export const latitudeOptions: readonly HybridOption[] = [
  { value: "default", label: "API default" },
  { value: "1", label: "Middle of the Night" },
  { value: "2", label: "One Seventh" },
  { value: "3", label: "Angle Based" },
];

export const shafaqOptions: readonly HybridOption[] = [
  { value: "general", label: "General" },
  { value: "ahmer", label: "Ahmer" },
  { value: "abyad", label: "Abyad" },
];

export const defaultSettings: PrayerSettings = {
  city: "",
  country: "",
  state: "",
  method: "auto",
  school: 0,
  latitudeAdjustmentMethod: "default",
  shafaq: "general",
  offsets: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};
