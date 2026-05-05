import type { AsrSchool, CalculationMethod, PrayerSettings } from "../types";
import { methodOptions } from "./constants";
import { parseTimingDate } from "./parsers";

export function formatTime(value: string, timezone?: string): string {
  const parsed = parseTimingDate(value);
  if (parsed !== null) {
    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };

    if (timezone !== undefined && timezone !== "") {
      options.timeZone = timezone;
    }

    return new Intl.DateTimeFormat(undefined, options).format(parsed);
  }

  return value.replace(/\s+\(.+\)$/, "");
}

export function formatUpdatedAt(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLocation(settings: PrayerSettings): string {
  return [settings.city, settings.state, settings.country]
    .filter((part) => part !== "")
    .join(", ");
}

export function formatCountdown(target: Date, now = new Date()): string {
  const remainingSeconds = Math.max(
    0,
    Math.floor((target.getTime() - now.getTime()) / 1000),
  );
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return `in ${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatApiDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

export function getMethodLabel(method: CalculationMethod): string {
  return (
    methodOptions.find((option) => option.value === method)?.label ??
    "Closest local authority"
  );
}

export function getSchoolLabel(school: AsrSchool): string {
  return school === 1 ? "Hanafi Asr" : "Standard Asr";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderCountdown(value: string): string {
  return [...value]
    .map((char, index) => {
      const escaped = escapeHtml(char);
      if (/\d/.test(char)) {
        return `<span class="countdown-part countdown-digit" data-index="${index}" data-char="${escaped}"><span class="countdown-digit-current">${escaped}</span></span>`;
      }

      return `<span class="countdown-part countdown-static" data-index="${index}" data-char="${escaped}">${escaped}</span>`;
    })
    .join("");
}

export function updateCountdown(container: HTMLElement, value: string): void {
  container.setAttribute("aria-label", value);
  const parts = Array.from(
    container.querySelectorAll<HTMLElement>(".countdown-part"),
  );

  if (parts.length !== value.length) {
    container.innerHTML = renderCountdown(value);
    return;
  }

  [...value].forEach((char, index) => {
    const part = parts[index];
    if (part === undefined || part.dataset.char === char) {
      return;
    }

    part.dataset.char = char;
    if (!/\d/.test(char)) {
      part.textContent = char;
      return;
    }

    part.dataset.previous = part.textContent ?? "";
    const current = part.querySelector<HTMLElement>(".countdown-digit-current");
    if (current !== null) {
      current.textContent = char;
    }

    part.classList.remove("is-flipping");
    void part.offsetWidth;
    part.classList.add("is-flipping");
  });
}
