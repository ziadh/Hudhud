import { MAIN_PRAYERS, SECONDARY_PRAYERS } from "./constants";
import { previewPane } from "./dom";
import {
  escapeHtml,
  formatCountdown,
  formatLocation,
  formatTime,
  formatUpdatedAt,
  getSchoolLabel,
  renderCountdown,
} from "./formatters";
import { parseTimingDate } from "./parsers";
import { state } from "./state";
import type { PrayerName, PrayerResult, PrayerTimings } from "./types";

export function renderEmptyPreviewHtml(): void {
  const message =
    state.formMode === "settings"
      ? "Modify your settings to see the new times preview."
      : state.currentStep === "location"
        ? "Choose your country first, then select the city that appears under it."
        : "Updating preview...";
  previewPane.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
}

export function renderLoadingHtml(nextState: "preview" | "configured"): void {
  previewPane.innerHTML = `
    <div class="empty-state">
      <p>${nextState === "preview" ? "Fetching a preview for today." : "Refreshing today&apos;s prayer times."}</p>
    </div>
  `;
}

export function renderPreviewHtml(result: PrayerResult): void {
  previewPane.innerHTML = renderTimes(result, "Preview");
}

export function renderDashboardHtml(result: PrayerResult): void {
  state.activePrayerResult = result;
  previewPane.innerHTML = renderTimes(result, "Today", true);
}

function renderTimes(
  result: PrayerResult,
  eyebrow: string,
  includeDashboardActions = false,
): string {
  const nextPrayer = getNextPrayer(result.timings, result.timezone);
  const actions = includeDashboardActions
    ? `
      <div class="actions">
        <button class="button secondary icon-button" type="button" data-action="edit" aria-label="Edit settings" title="Edit settings">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.08V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.36.54.7.96.87.21.08.43.13.65.13H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"></path>
          </svg>
        </button>
        <button class="button secondary icon-button" type="button" data-action="refresh" aria-label="Refresh prayer times" title="Refresh prayer times">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2"></path>
            <path d="M4 5v4h4"></path>
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2"></path>
            <path d="M20 19v-4h-4"></path>
          </svg>
        </button>
      </div>
    `
    : "";

  return `
    <div class="preview-header">
      <div class="location">
        <span class="next-label">${eyebrow}</span>
        <strong>${escapeHtml(formatLocation(result.settings))}</strong>
        <span class="method-line">${escapeHtml(result.methodName)} · ${escapeHtml(getSchoolLabel(result.settings.school))}</span>
      </div>
      ${actions}
    </div>

    <section class="next-prayer" data-next-prayer-at="${escapeHtml(nextPrayer.target)}">
      <div>
        <div class="next-label">Next prayer</div>
        <div class="next-value">${escapeHtml(nextPrayer.label)}</div>
        <div class="method-line">${escapeHtml(nextPrayer.time)}</div>
      </div>
      <div class="time-remaining" aria-label="${escapeHtml(nextPrayer.remaining)}">${renderCountdown(nextPrayer.remaining)}</div>
    </section>

    <section class="times-grid">
      ${MAIN_PRAYERS.map(
        (name) => `
          <div class="time-cell">
            ${renderTimeHeader(name)}
            <div class="time-value">${escapeHtml(formatTime(result.timings[name], result.timezone))}</div>
          </div>
        `,
      ).join("")}
    </section>

    <div class="secondary-times">
      ${SECONDARY_PRAYERS.map((name) => {
        const value = result.timings[name];
        return value === undefined
          ? ""
          : `
            <span class="secondary-time">
              ${renderPrayerIcon(name)}
              <span>${name}: ${escapeHtml(formatTime(value, result.timezone))}</span>
            </span>
          `;
      }).join("")}
    </div>

    <p class="updated">Last updated ${escapeHtml(formatUpdatedAt(result.updatedAt))} · ${escapeHtml(result.timezone)}</p>
  `;
}

function renderTimeHeader(name: PrayerName): string {
  return `
    <div class="time-header">
      ${renderPrayerIcon(name)}
      <div class="time-name">${name}</div>
    </div>
  `;
}

function renderPrayerIcon(name: PrayerName): string {
  const paths: Record<PrayerName, string> = {
    Fajr: `
      <path d="M3 18h18"></path>
      <path d="M6 15.5a6 6 0 0 1 12 0"></path>
      <path d="M8 7.5 6.7 6.2"></path>
      <path d="M12 5.5V3.7"></path>
      <path d="m16 7.5 1.3-1.3"></path>
    `,
    Sunrise: `
      <path d="M3 17h18"></path>
      <path d="M6 14a6 6 0 0 1 12 0"></path>
      <path d="M12 2v3"></path>
      <path d="m4.9 5.9 2.1 2.1"></path>
      <path d="m19.1 5.9-2.1 2.1"></path>
      <path d="M12 17v4"></path>
      <path d="m8 21 4-4 4 4"></path>
    `,
    Dhuhr: `
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    `,
    Asr: `
      <circle cx="8" cy="8" r="3"></circle>
      <path d="M8 1.8V3"></path>
      <path d="M8 13v1.2"></path>
      <path d="M1.8 8H3"></path>
      <path d="M13 8h1.2"></path>
      <path d="m3.6 3.6.8.8"></path>
      <path d="m11.6 11.6.8.8"></path>
      <path d="M4 19h17"></path>
      <path d="m10 19 7-7"></path>
      <path d="m14 19 5-5"></path>
    `,
    Maghrib: `
      <path d="M3 18h18"></path>
      <path d="M7 15a5 5 0 0 1 10 0"></path>
      <path d="M12 9V5"></path>
      <path d="m5 7 2.1 2.1"></path>
      <path d="m19 7-2.1 2.1"></path>
      <path d="m8 21 4-3 4 3"></path>
    `,
    Isha: `
      <path d="M20.2 14.8A7 7 0 0 1 9.2 3.8 8.5 8.5 0 1 0 20.2 14.8Z"></path>
      <path d="M17 4h.01"></path>
      <path d="M20 8h.01"></path>
    `,
  };

  return `
    <svg class="prayer-icon prayer-icon-${name.toLowerCase()}" aria-hidden="true" viewBox="0 0 24 24">
      ${paths[name]}
    </svg>
  `;
}

export function getNextPrayer(
  timings: PrayerTimings,
  timezone: string,
  now = new Date(),
): { label: string; time: string; remaining: string; target: string } {
  for (const prayer of MAIN_PRAYERS) {
    const date = parseTimingDate(timings[prayer]);
    if (date !== null && date > now) {
      return {
        label: prayer,
        time: formatTime(timings[prayer], timezone),
        remaining: formatCountdown(date, now),
        target: date.toISOString(),
      };
    }
  }

  const fajrDate = parseTimingDate(timings.Fajr);
  if (fajrDate !== null) {
    const tomorrowFajr = new Date(fajrDate);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    return {
      label: "Fajr tomorrow",
      time: formatTime(tomorrowFajr.toISOString(), timezone),
      remaining: formatCountdown(tomorrowFajr, now),
      target: tomorrowFajr.toISOString(),
    };
  }

  return {
    label: "Fajr tomorrow",
    time: formatTime(timings.Fajr, timezone),
    remaining: "",
    target: "",
  };
}

export function hasFuturePrayerTarget(
  result: PrayerResult,
  now: Date,
): boolean {
  const nextPrayer = getNextPrayer(result.timings, result.timezone, now);
  const target = new Date(nextPrayer.target);
  return !Number.isNaN(target.getTime()) && target.getTime() > now.getTime();
}
