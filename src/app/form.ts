import type { AsrSchool, PrayerSettings } from "../types";
import { latitudeOptions, methodOptions, shafaqOptions } from "./constants";
import {
  citySelect,
  countrySelect,
  latitudeSelect,
  methodSelect,
  offsetAsr,
  offsetDhuhr,
  offsetFajr,
  offsetIsha,
  offsetMaghrib,
  schoolButtons,
  shafaqSelect,
  stateSelect,
} from "./dom";
import {
  getHybridValue,
  replaceHybridOptions,
  setHybridValue,
} from "./hybrid-select";
import { applyCountrySelection, requiresState } from "./location";
import {
  parseLatitudeAdjustment,
  parseMethod,
  parseOffset,
  parseSchool,
  parseShafaq,
} from "./parsers";
export function populateMethods(): void {
  replaceHybridOptions(
    methodSelect,
    methodOptions.map((method) => ({
      value: String(method.value),
      label: method.label,
    })),
  );
  replaceHybridOptions(latitudeSelect, [...latitudeOptions]);
  replaceHybridOptions(shafaqSelect, [...shafaqOptions]);
}

export function setSchool(school: AsrSchool): void {
  for (const button of schoolButtons) {
    button.classList.toggle(
      "active",
      parseSchool(button.dataset.school ?? "0") === school,
    );
  }
}

export function getSelectedSchool(): AsrSchool {
  const active = schoolButtons.find((button) =>
    button.classList.contains("active"),
  );
  return parseSchool(active?.dataset.school ?? "0");
}

export function updateShafaqAvailability(): void {
  shafaqSelect.disabled =
    parseMethod(getHybridValue(methodSelect) ?? "") !== 15;
}

export function fillForm(settings: PrayerSettings): void {
  setHybridValue(countrySelect, settings.country);
  void applyCountrySelection(settings.state, settings.city);
  setHybridValue(methodSelect, String(settings.method));
  setHybridValue(latitudeSelect, String(settings.latitudeAdjustmentMethod));
  setHybridValue(shafaqSelect, settings.shafaq);
  offsetFajr.value = String(settings.offsets.fajr);
  offsetDhuhr.value = String(settings.offsets.dhuhr);
  offsetAsr.value = String(settings.offsets.asr);
  offsetMaghrib.value = String(settings.offsets.maghrib);
  offsetIsha.value = String(settings.offsets.isha);
  setSchool(settings.school);
  updateShafaqAvailability();
}

export function validateLocationStep():
  | { ok: true }
  | { ok: false; message: string } {
  const country = getHybridValue(countrySelect);
  const stateValue = getHybridValue(stateSelect);
  const city = getHybridValue(citySelect);

  if (countrySelect.value.trim() !== "" && country === null) {
    return {
      ok: false,
      message: "Choose a valid country from the list to continue.",
    };
  }

  if (country === null) {
    return { ok: false, message: "Choose your country to continue." };
  }

  if (country === "") {
    return { ok: false, message: "Choose your country to continue." };
  }

  if (
    requiresState(country) &&
    stateSelect.value.trim() !== "" &&
    stateValue === null
  ) {
    return {
      ok: false,
      message:
        country === "Canada"
          ? "Choose a valid province from the list to continue."
          : "Choose a valid state from the list to continue.",
    };
  }

  if (requiresState(country) && stateValue === "") {
    return {
      ok: false,
      message:
        country === "Canada"
          ? "Choose your province to continue."
          : "Choose your state to continue.",
    };
  }

  if (citySelect.value.trim() !== "" && city === null) {
    return {
      ok: false,
      message: "Choose a valid city from the list to continue.",
    };
  }

  if (city === "") {
    return { ok: false, message: "Choose your city to continue." };
  }

  return { ok: true };
}

export function readFormSettings():
  | { ok: true; settings: PrayerSettings }
  | { ok: false; message: string } {
  const country = getHybridValue(countrySelect);
  const stateValue = getHybridValue(stateSelect);
  const city = getHybridValue(citySelect);
  const method = getHybridValue(methodSelect);
  const latitudeAdjustmentMethod = getHybridValue(latitudeSelect);
  const shafaq = getHybridValue(shafaqSelect);

  const settings: PrayerSettings = {
    city: city ?? citySelect.value.trim(),
    country: country ?? countrySelect.value.trim(),
    state:
      country !== null && requiresState(country)
        ? (stateValue ?? stateSelect.value.trim())
        : "",
    method: parseMethod(method ?? methodSelect.value),
    school: getSelectedSchool(),
    latitudeAdjustmentMethod: parseLatitudeAdjustment(
      latitudeAdjustmentMethod ?? latitudeSelect.value,
    ),
    shafaq: parseShafaq(shafaq ?? shafaqSelect.value),
    offsets: {
      fajr: parseOffset(offsetFajr.value),
      dhuhr: parseOffset(offsetDhuhr.value),
      asr: parseOffset(offsetAsr.value),
      maghrib: parseOffset(offsetMaghrib.value),
      isha: parseOffset(offsetIsha.value),
    },
  };

  if (country === null && countrySelect.value.trim() !== "") {
    return {
      ok: false,
      message: "Choose a valid country from the list before previewing.",
    };
  }

  if (stateValue === null && stateSelect.value.trim() !== "") {
    return {
      ok: false,
      message:
        settings.country === "Canada"
          ? "Choose a valid province from the list before previewing."
          : "Choose a valid state from the list before previewing.",
    };
  }

  if (city === null && citySelect.value.trim() !== "") {
    return {
      ok: false,
      message: "Choose a valid city from the list before previewing.",
    };
  }

  if (method === null) {
    return {
      ok: false,
      message: "Choose a valid calculation method from the list.",
    };
  }

  if (latitudeAdjustmentMethod === null) {
    return {
      ok: false,
      message: "Choose a valid high latitude option from the list.",
    };
  }

  if (!shafaqSelect.disabled && shafaq === null) {
    return {
      ok: false,
      message: "Choose a valid shafaq option from the list.",
    };
  }

  if (settings.city === "") {
    return {
      ok: false,
      message: "Choose a city before previewing prayer times.",
    };
  }

  if (settings.country === "") {
    return {
      ok: false,
      message: "Choose a country before previewing prayer times.",
    };
  }

  if (requiresState(settings.country) && settings.state === "") {
    return {
      ok: false,
      message:
        settings.country === "Canada"
          ? "Choose a province before previewing prayer times."
          : "Choose a state before previewing prayer times.",
    };
  }

  const offsets = Object.values(settings.offsets);
  if (
    offsets.some(
      (offset) => !Number.isInteger(offset) || offset < -30 || offset > 30,
    )
  ) {
    return {
      ok: false,
      message: "Offsets must be whole minutes between -30 and 30.",
    };
  }

  return { ok: true, settings };
}
