import {
  cityOptions,
  citySelect,
  countryOptions,
  countrySelect,
  latitudeDataOptions,
  latitudeSelect,
  methodDataOptions,
  methodSelect,
  shafaqDataOptions,
  shafaqSelect,
  stateOptions,
  stateSelect,
} from "./dom";
import { hybridOptions } from "./state";
import type { HybridOption } from "./types";

const hybridLists = new Map<HTMLInputElement, HTMLDataListElement>([
  [countrySelect, countryOptions],
  [stateSelect, stateOptions],
  [citySelect, cityOptions],
  [methodSelect, methodDataOptions],
  [latitudeSelect, latitudeDataOptions],
  [shafaqSelect, shafaqDataOptions],
]);

export function replaceHybridOptions(
  input: HTMLInputElement,
  options: HybridOption[],
): void {
  const list = hybridLists.get(input);
  if (list === undefined) {
    throw new Error(`Missing option list for ${input.id}`);
  }

  hybridOptions.set(
    input,
    options.filter((item) => item.value !== ""),
  );
  input.placeholder = options.find((item) => item.value === "")?.label ?? "";
  list.replaceChildren(
    ...options
      .filter((item) => item.value !== "")
      .map((item) => {
        const option = document.createElement("option");
        option.value = item.label;
        option.dataset.value = item.value;
        return option;
      }),
  );
}

export function getHybridValue(input: HTMLInputElement): string | null {
  const typed = input.value.trim();
  if (typed === "") {
    return "";
  }

  const match = hybridOptions
    .get(input)
    ?.find((option) => option.label === typed);
  return match?.value ?? null;
}

export function setHybridValue(input: HTMLInputElement, value: string): void {
  if (value === "") {
    input.value = "";
    return;
  }

  const match = hybridOptions
    .get(input)
    ?.find((option) => option.value === value);
  input.value = match?.label ?? value;
}

export function resetStateSelect(label: string): void {
  replaceHybridOptions(stateSelect, [{ value: "", label }]);
  stateSelect.disabled = true;
  stateSelect.value = "";
}

export function resetCitySelect(label: string): void {
  replaceHybridOptions(citySelect, [{ value: "", label }]);
  citySelect.disabled = true;
  citySelect.value = "";
}
