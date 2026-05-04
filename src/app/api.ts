import type { PrayerSettings } from "../types";
import {
  API_BASE,
  COUNTRIES_API,
  STATE_CITIES_API,
  STATES_API,
} from "./constants";
import { formatApiDate, getMethodLabel } from "./formatters";
import { isRecord } from "./parsers";
import { stateCache, stateCityCache } from "./state";
import type {
  AladhanResponse,
  CountriesNowResponse,
  CountryCities,
  PrayerName,
  PrayerResult,
  PrayerTimings,
  StateCitiesNowResponse,
  StateOption,
  StatesNowResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

export async function loadCountries(): Promise<CountryCities[]> {
  const response = await fetchWithTimeout(COUNTRIES_API);
  if (!response.ok) {
    throw new Error("Country list could not be loaded.");
  }

  const raw: unknown = await response.json();
  if (!isRecord(raw)) {
    throw new Error("Country list could not be loaded.");
  }
  const payload = raw as CountriesNowResponse;
  if (payload.error === true || !Array.isArray(payload.data)) {
    throw new Error("Country list could not be loaded.");
  }

  return payload.data
    .filter(
      (item) => typeof item.country === "string" && Array.isArray(item.cities),
    )
    .map((item) => ({
      country: item.country,
      cities: item.cities
        .filter((city) => typeof city === "string" && city.trim() !== "")
        .sort(),
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

export async function getStates(country: string): Promise<StateOption[]> {
  const cached = stateCache.get(country);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWithTimeout(STATES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
  });

  if (!response.ok) {
    throw new Error("States could not be loaded.");
  }

  const raw: unknown = await response.json();
  if (!isRecord(raw)) {
    throw new Error("States could not be loaded.");
  }
  const payload = raw as StatesNowResponse;
  if (payload.error === true || !Array.isArray(payload.data?.states)) {
    throw new Error("States could not be loaded.");
  }

  const states = payload.data.states
    .filter((s) => typeof s.name === "string" && s.name.trim() !== "")
    .sort((a, b) => a.name.localeCompare(b.name));
  stateCache.set(country, states);
  return states;
}

export async function getStateCities(
  country: string,
  state: string,
): Promise<string[]> {
  const key = `${country}:${state}`;
  const cached = stateCityCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWithTimeout(STATE_CITIES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, state }),
  });

  if (!response.ok) {
    throw new Error("Cities could not be loaded.");
  }

  const raw: unknown = await response.json();
  if (!isRecord(raw)) {
    throw new Error("Cities could not be loaded.");
  }
  const payload = raw as StateCitiesNowResponse;
  if (payload.error === true || !Array.isArray(payload.data)) {
    throw new Error("Cities could not be loaded.");
  }

  const cities = payload.data
    .filter((city) => typeof city === "string" && city.trim() !== "")
    .sort();
  stateCityCache.set(key, cities);
  return cities;
}

export async function fetchPrayerTimes(
  settings: PrayerSettings,
): Promise<PrayerResult> {
  const response = await fetchWithTimeout(buildTimingsUrl(settings));

  if (!response.ok) {
    throw new Error(
      "Prayer times could not be fetched. Check the location and try again.",
    );
  }

  const raw: unknown = await response.json();
  if (!isRecord(raw)) {
    throw new Error(
      "Prayer times could not be fetched. Check the location and try again.",
    );
  }
  const payload = raw as AladhanResponse;

  if (payload.code !== 200 || payload.data?.timings === undefined) {
    throw new Error(
      "Could not read prayer times for that location. Check the city and country, then try again.",
    );
  }

  const timings = normalizeTimings(payload.data.timings);
  const methodName =
    payload.data.meta?.method?.name ?? getMethodLabel(settings.method);

  return {
    settings,
    timings,
    methodName,
    timezone:
      payload.data.meta?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    updatedAt: new Date(),
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildTimingsUrl(settings: PrayerSettings): string {
  const params = new URLSearchParams({
    city: settings.city,
    country: settings.country,
    school: String(settings.school),
    iso8601: "true",
  });

  if (settings.state !== "") {
    params.set("state", settings.state);
  }

  if (settings.method !== "auto") {
    params.set("method", String(settings.method));
  }

  if (settings.latitudeAdjustmentMethod !== "default") {
    params.set(
      "latitudeAdjustmentMethod",
      String(settings.latitudeAdjustmentMethod),
    );
  }

  if (settings.method === 15) {
    params.set("shafaq", settings.shafaq);
  }

  const tune = buildTune(settings);
  if (tune !== null) {
    params.set("tune", tune);
  }

  return `${API_BASE}/${formatApiDate(new Date())}?${params.toString()}`;
}

function buildTune(settings: PrayerSettings): string | null {
  const { fajr, dhuhr, asr, maghrib, isha } = settings.offsets;
  if ([fajr, dhuhr, asr, maghrib, isha].every((offset) => offset === 0)) {
    return null;
  }

  return `0,${fajr},0,${dhuhr},${asr},${maghrib},0,${isha},0`;
}

function normalizeTimings(
  raw: Partial<Record<PrayerName, string>>,
): PrayerTimings {
  const timings = {
    Fajr: raw.Fajr,
    Dhuhr: raw.Dhuhr,
    Asr: raw.Asr,
    Maghrib: raw.Maghrib,
    Isha: raw.Isha,
    Sunrise: raw.Sunrise,
  };

  if (
    timings.Fajr === undefined ||
    timings.Dhuhr === undefined ||
    timings.Asr === undefined ||
    timings.Maghrib === undefined ||
    timings.Isha === undefined
  ) {
    throw new Error(
      "Could not read prayer times for that location. Check the city and country, then try again.",
    );
  }

  return {
    Fajr: timings.Fajr,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
    Sunrise: timings.Sunrise,
  };
}
