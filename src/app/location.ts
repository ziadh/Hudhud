import type { PrayerSettings } from "../types";
import { getStateCities, getStates, loadCountries } from "./api";
import { STATE_REQUIRED_COUNTRIES } from "./constants";
import {
  cityField,
  cityHint,
  citySelect,
  countrySelect,
  stateField,
  stateSelect,
} from "./dom";
import {
  getHybridValue,
  replaceHybridOptions,
  resetCitySelect,
  resetStateSelect,
  setHybridValue,
} from "./hybrid-select";
import { state } from "./state";

export function requiresState(country: string): boolean {
  return STATE_REQUIRED_COUNTRIES.has(country);
}

export function updateLocationFieldVisibility(): void {
  const country = getHybridValue(countrySelect) ?? "";
  const needsState = requiresState(country);
  stateField.hidden = !needsState;
  cityField.hidden =
    country === "" ||
    (needsState && (getHybridValue(stateSelect) ?? "") === "");
  cityHint.textContent = "";
}

export async function loadCountryCityOptions(
  saved: PrayerSettings | null,
): Promise<boolean> {
  countrySelect.disabled = true;
  replaceHybridOptions(countrySelect, [
    { value: "", label: "Loading countries..." },
  ]);
  resetStateSelect("Choose a country first");
  resetCitySelect("Choose a country first");
  updateLocationFieldVisibility();

  try {
    state.countryCities = await loadCountries();

    replaceHybridOptions(countrySelect, [
      { value: "", label: "Choose a country" },
      ...state.countryCities.map((item) => ({
        value: item.country,
        label: item.country,
      })),
    ]);
    countrySelect.disabled = false;

    if (saved !== null) {
      setHybridValue(countrySelect, saved.country);
      void applyCountrySelection(saved.state, saved.city);
    }

    return true;
  } catch (err) {
    console.error("Failed to load countries:", err);
    replaceHybridOptions(countrySelect, [
      { value: "", label: "Countries unavailable" },
    ]);
    resetStateSelect("States unavailable");
    resetCitySelect("Cities unavailable");
    updateLocationFieldVisibility();
    return false;
  }
}

export async function applyCountrySelection(
  selectedState = "",
  selectedCity = "",
): Promise<void> {
  const country = getHybridValue(countrySelect) ?? "";
  state.previewResult = null;

  if (country === "") {
    resetStateSelect("Choose a country first");
    resetCitySelect("Choose a country first");
    updateLocationFieldVisibility();
    return;
  }

  if (requiresState(country)) {
    cityField.hidden = true;
    resetCitySelect("Choose a state or province first");
    await populateStates(country, selectedState);

    if (stateSelect.value !== "") {
      await applyStateSelection(selectedCity);
    } else {
      updateLocationFieldVisibility();
    }
    return;
  }

  resetStateSelect("Not needed");
  populateCountryCities(country, selectedCity);
  updateLocationFieldVisibility();
}

async function populateStates(
  country: string,
  selectedState = "",
): Promise<void> {
  stateField.hidden = false;
  stateSelect.disabled = true;
  replaceHybridOptions(stateSelect, [
    { value: "", label: "Loading states..." },
  ]);

  try {
    const states = await getStates(country);
    replaceHybridOptions(stateSelect, [
      {
        value: "",
        label: country === "Canada" ? "Choose a province" : "Choose a state",
      },
      ...states.map((s) => ({ value: s.name, label: s.name })),
    ]);
    stateSelect.disabled = false;
    setHybridValue(stateSelect, selectedState);
  } catch (err) {
    console.error("Failed to load states:", err);
    resetStateSelect("States unavailable");
    resetCitySelect("Cities unavailable");
  }
}

export async function applyStateSelection(selectedCity = ""): Promise<void> {
  const country = getHybridValue(countrySelect) ?? "";
  const stateValue = getHybridValue(stateSelect) ?? "";

  if (!requiresState(country) || stateValue === "") {
    resetCitySelect("Choose a state or province first");
    updateLocationFieldVisibility();
    return;
  }

  cityField.hidden = false;
  citySelect.disabled = true;
  replaceHybridOptions(citySelect, [{ value: "", label: "Loading cities..." }]);

  try {
    const cities = await getStateCities(country, stateValue);
    replaceHybridOptions(citySelect, [
      { value: "", label: "Choose a city" },
      ...cities.map((city) => ({ value: city, label: city })),
    ]);
    citySelect.disabled = false;
    setHybridValue(citySelect, selectedCity);
  } catch (err) {
    console.error("Failed to load cities:", err);
    resetCitySelect("Cities unavailable");
  }

  updateLocationFieldVisibility();
}

function populateCountryCities(country: string, selectedCity = ""): void {
  const match = state.countryCities.find((item) => item.country === country);
  if (match === undefined) {
    resetCitySelect("Choose a country first");
    return;
  }

  replaceHybridOptions(citySelect, [
    { value: "", label: "Choose a city" },
    ...match.cities.map((city) => ({ value: city, label: city })),
  ]);
  citySelect.disabled = false;
  setHybridValue(citySelect, selectedCity);
}
