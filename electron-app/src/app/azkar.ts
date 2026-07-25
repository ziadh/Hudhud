import { azkarEntries } from "./azkar-data";
import {
  parseAzkarDisplayPreferences,
  toggleAzkarDisplayPreference,
} from "./azkar-display";
import {
  clampAzkarEntryIndex,
  getInitialAzkarEntryIndex,
  moveAzkarEntryIndex,
} from "./azkar-navigation";
import { azkarList } from "./dom";
import { escapeHtml } from "./formatters";
import { state } from "./state";
import {
  AZKAR_DISPLAY_KEY,
  AZKAR_LAYOUT_KEY,
  AZKAR_PROGRESS_KEY,
} from "./storage-keys";
import type {
  AzkarDisplayPreferences,
  AzkarEntry,
  AzkarLayout,
  AzkarPeriod,
  DailyProgress,
  DailyProgressStore,
} from "./types";

const MAX_RETAINED_DAYS = 3;

const emptyProgress = (): DailyProgress => ({
  counters: {},
  completed: {
    morning: false,
    evening: false,
  },
  confirmedPrayers: [],
});

export function bindAzkarEvents(): void {
  azkarList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const backButton = target.closest<HTMLButtonElement>("[data-azkar-back]");
    if (backButton !== null) {
      showAzkarHome();
      return;
    }

    const periodButton = target.closest<HTMLButtonElement>(
      "[data-azkar-period-card]",
    );
    if (periodButton !== null) {
      const period = parseAzkarPeriod(periodButton.dataset.azkarPeriodCard);
      if (period !== null) {
        setAzkarPeriod(period);
      }
      return;
    }

    const layoutButton = target.closest<HTMLButtonElement>(
      "[data-azkar-layout]",
    );
    if (layoutButton !== null) {
      const layout = layoutButton.dataset.azkarLayout;
      if (layout === "single" || layout === "all") {
        state.currentAzkarLayout = layout;
        saveAzkarLayout(layout);
        renderAzkar();
      }
      return;
    }

    const displayButton = target.closest<HTMLButtonElement>(
      "[data-azkar-display]",
    );
    if (displayButton !== null) {
      const field = displayButton.dataset.azkarDisplay;
      if (field === "transliteration" || field === "translation") {
        state.azkarDisplayPreferences = toggleAzkarDisplayPreference(
          state.azkarDisplayPreferences,
          field,
        );
        saveAzkarDisplayPreferences(state.azkarDisplayPreferences);
        renderAzkar();
      }
      return;
    }

    const navigationButton = target.closest<HTMLButtonElement>(
      "[data-azkar-navigation]",
    );
    if (navigationButton !== null) {
      const direction = navigationButton.dataset.azkarNavigation;
      if (direction === "previous" || direction === "next") {
        const entryCount = getEntriesForPeriod(state.currentAzkarPeriod).length;
        state.currentAzkarEntryIndex = moveAzkarEntryIndex(
          state.currentAzkarEntryIndex,
          direction,
          entryCount,
        );
        renderAzkar();
      }
      return;
    }

    const button = target.closest<HTMLButtonElement>("[data-azkar-entry]");
    if (button === null) {
      return;
    }

    const entry = getEntry(button.dataset.azkarEntry ?? "");
    if (entry === null) {
      return;
    }

    incrementCounter(entry);
  });
}

export function setAzkarPeriod(period: AzkarPeriod): void {
  state.currentAzkarView = "reader";
  state.currentAzkarPeriod = period;
  state.currentAzkarLayout = loadAzkarLayout();
  state.azkarDisplayPreferences = loadAzkarDisplayPreferences();
  const progress = loadTodayProgress();
  state.currentAzkarEntryIndex = getInitialAzkarEntryIndex(
    getEntriesForPeriod(period).map(
      (entry) => getEntryCount(progress, entry) >= entry.repeat,
    ),
  );
  renderAzkar();
}

export function showAzkarHome(): void {
  state.currentAzkarView = "home";
  renderAzkar();
}

export function renderAzkar(): void {
  if (state.currentAzkarView === "home") {
    renderAzkarHome();
    return;
  }

  renderAzkarReader();
}

export function isAzkarComplete(period: AzkarPeriod): boolean {
  const progress = loadTodayProgress();
  const entries = getEntriesForPeriod(period);
  return (
    entries.length > 0 &&
    entries.every((entry) => getEntryCount(progress, entry) >= entry.repeat)
  );
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderAzkarHome(): void {
  azkarList.classList.remove("azkar-list-single");
  const progress = loadTodayProgress();
  azkarList.innerHTML = `
    <div class="azkar-home-cards">
      ${renderPeriodCard("morning", progress)}
      ${renderPeriodCard("evening", progress)}
    </div>
  `;
}

function renderPeriodCard(
  period: AzkarPeriod,
  progress: DailyProgress,
): string {
  const entries = getEntriesForPeriod(period);
  const completedCount = getCompletedCount(entries, progress);
  const totalCount = entries.length;
  const percent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return `
    <button class="azkar-period-card" type="button" data-azkar-period-card="${period}">
      <div>
        <span class="next-label">${period}</span>
        <h3>${getPeriodTitle(period)}</h3>
      </div>
      <p>${getPeriodDescription(period)}</p>
      <div class="azkar-progress" aria-label="${completedCount} of ${totalCount} completed">
        <span style="width: ${percent}%"></span>
      </div>
      <strong>${completedCount}/${totalCount}</strong>
    </button>
  `;
}

function renderAzkarReader(): void {
  const progress = loadTodayProgress();
  const entries = getEntriesForPeriod(state.currentAzkarPeriod);
  const completedCount = getCompletedCount(entries, progress);
  const totalCount = entries.length;
  const isPeriodComplete = totalCount > 0 && completedCount === totalCount;
  const layout = state.currentAzkarLayout;
  azkarList.classList.toggle("azkar-list-single", layout === "single");
  state.currentAzkarEntryIndex = clampAzkarEntryIndex(
    state.currentAzkarEntryIndex,
    totalCount,
  );

  if (progress.completed[state.currentAzkarPeriod] !== isPeriodComplete) {
    progress.completed[state.currentAzkarPeriod] = isPeriodComplete;
    saveTodayProgress(progress);
  }

  const cards =
    layout === "single"
      ? renderSingleCard(entries, progress, state.currentAzkarEntryIndex)
      : entries.map((entry) => renderEntry(entry, progress)).join("");

  azkarList.innerHTML = `
    <div class="azkar-summary">
      <div class="azkar-summary-title">
        <button class="azkar-back-action" type="button" data-azkar-back
          aria-label="Back to azkar home" title="Back to azkar home">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M19 12H5"></path>
            <path d="m12 19-7-7 7-7"></path>
          </svg>
        </button>
        <h2>${getPeriodTitle(state.currentAzkarPeriod)}</h2>
      </div>
      <div class="azkar-summary-end">
        <strong>${completedCount}/${totalCount}</strong>
        <div class="azkar-reader-controls">
          <div class="azkar-display-toggle" role="group" aria-label="Supporting text">
            ${renderDisplayButton("transliteration", state.azkarDisplayPreferences)}
            ${renderDisplayButton("translation", state.azkarDisplayPreferences)}
          </div>
          <div class="azkar-layout-toggle" role="group" aria-label="View mode">
            ${renderLayoutButton("single", layout)}
            ${renderLayoutButton("all", layout)}
          </div>
        </div>
      </div>
    </div>
    <div class="azkar-progress" aria-label="${completedCount} of ${totalCount} completed">
      <span style="width: ${totalCount === 0 ? 0 : (completedCount / totalCount) * 100}%"></span>
    </div>
    ${isPeriodComplete ? `<p class="azkar-complete">Completed for today.</p>` : ""}
    <div class="azkar-cards">
      ${cards}
    </div>
    ${layout === "single" ? renderSingleNavigation(totalCount) : ""}
  `;
}

function renderDisplayButton(
  field: keyof AzkarDisplayPreferences,
  preferences: AzkarDisplayPreferences,
): string {
  const label = field === "transliteration" ? "Transliteration" : "Translation";
  const action = preferences[field] ? "Hide" : "Show";
  return `<button class="button azkar-display-button" type="button" data-azkar-display="${field}" aria-pressed="${preferences[field]}" aria-label="${action} ${label.toLowerCase()}">${label}</button>`;
}

function renderLayoutButton(mode: AzkarLayout, current: AzkarLayout): string {
  const isActive = mode === current;
  const label = mode === "single" ? "One at a time" : "All at once";
  const icon =
    mode === "single"
      ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="2"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="12" height="5" rx="1.5"/><rect x="2" y="9" width="12" height="5" rx="1.5"/></svg>`;
  return `<button class="button icon-button" type="button" data-azkar-layout="${mode}" aria-pressed="${isActive}" aria-label="${label}">${icon}</button>`;
}

function renderSingleCard(
  entries: readonly AzkarEntry[],
  progress: DailyProgress,
  index: number,
): string {
  const current = entries[index];
  if (current === undefined) {
    return "";
  }
  return renderEntry(current, progress);
}

function renderSingleNavigation(totalCount: number): string {
  if (totalCount === 0) {
    return "";
  }

  const index = state.currentAzkarEntryIndex;
  const position = index + 1;
  return `
    <nav class="azkar-navigation" aria-label="Azkar navigation">
      <button class="button secondary" type="button" data-azkar-navigation="previous"
        aria-label="Previous azkar, ${Math.max(position - 1, 1)} of ${totalCount}"
        ${index === 0 ? "disabled" : ""}>
        <span aria-hidden="true">←</span> Previous
      </button>
      <span class="azkar-navigation-position" aria-live="polite">${position} of ${totalCount}</span>
      <button class="button secondary" type="button" data-azkar-navigation="next"
        aria-label="Next azkar, ${Math.min(position + 1, totalCount)} of ${totalCount}"
        ${index === totalCount - 1 ? "disabled" : ""}>
        Next <span aria-hidden="true">→</span>
      </button>
    </nav>
  `;
}

function renderEntry(entry: AzkarEntry, progress: DailyProgress): string {
  const count = getEntryCount(progress, entry);
  const isComplete = count >= entry.repeat;
  const buttonLabel =
    entry.repeat === 1
      ? isComplete
        ? "Done"
        : "Mark done"
      : `${Math.min(count, entry.repeat)}/${entry.repeat}`;

  return `
    <article class="azkar-card${isComplete ? " complete" : ""}">
      <p class="azkar-arabic" lang="ar" dir="rtl">
        <span>${escapeHtml(entry.arabic)}</span>
        <span class="azkar-repeat-separator" aria-hidden="true">·</span>
        <bdi class="azkar-repeat" dir="ltr" aria-label="Repeat ${entry.repeat} ${entry.repeat === 1 ? "time" : "times"}">×${entry.repeat}</bdi>
      </p>
      <div class="azkar-reference-row">
        <p class="azkar-reference">${escapeHtml(entry.reference)}</p>
        <button class="button ${isComplete ? "secondary" : "primary"} azkar-counter" type="button" data-azkar-entry="${escapeHtml(entry.id)}">
          ${escapeHtml(buttonLabel)}
        </button>
      </div>
      ${
        state.azkarDisplayPreferences.transliteration
          ? `<div class="azkar-supporting-text">
              <span class="azkar-supporting-label">Transliteration</span>
              <p class="azkar-transliteration" lang="ar-Latn" dir="ltr">${escapeHtml(entry.transliteration)}</p>
            </div>`
          : ""
      }
      ${
        state.azkarDisplayPreferences.translation
          ? `<div class="azkar-supporting-text">
              <span class="azkar-supporting-label">Translation</span>
              <p class="azkar-translation" lang="en" dir="ltr">${escapeHtml(entry.translation)}</p>
            </div>`
          : ""
      }
    </article>
  `;
}

function incrementCounter(entry: AzkarEntry): void {
  const progress = loadTodayProgress();
  const current = getEntryCount(progress, entry);
  if (current >= entry.repeat) {
    return;
  }

  progress.counters[entry.id] = current + 1;
  const reachedTarget = current + 1 >= entry.repeat;

  const period = entry.period;
  const wasComplete = progress.completed[period];
  const periodEntries = getEntriesForPeriod(period);
  const isComplete = periodEntries.every(
    (periodEntry) => getEntryCount(progress, periodEntry) >= periodEntry.repeat,
  );
  progress.completed[period] = isComplete;

  saveTodayProgress(progress);
  if (state.currentAzkarLayout === "single" && reachedTarget) {
    state.currentAzkarEntryIndex = moveAzkarEntryIndex(
      state.currentAzkarEntryIndex,
      "next",
      periodEntries.length,
    );
  }
  renderAzkar();
  window.dispatchEvent(new CustomEvent("azkar:progress-changed"));
  if (isComplete && !wasComplete) {
    window.dispatchEvent(
      new CustomEvent("azkar:period-complete", { detail: { period } }),
    );
  }
}

function getCompletedCount(
  entries: readonly AzkarEntry[],
  progress: DailyProgress,
): number {
  return entries.filter(
    (entry) => getEntryCount(progress, entry) >= entry.repeat,
  ).length;
}

function getEntryCount(progress: DailyProgress, entry: AzkarEntry): number {
  return Math.min(progress.counters[entry.id] ?? 0, entry.repeat);
}

function getEntry(id: string): AzkarEntry | null {
  return azkarEntries.find((entry) => entry.id === id) ?? null;
}

function getEntriesForPeriod(period: AzkarPeriod): readonly AzkarEntry[] {
  return azkarEntries.filter((entry) => entry.period === period);
}

function loadProgressStore(): DailyProgressStore {
  const raw = localStorage.getItem(AZKAR_PROGRESS_KEY);
  if (raw === null) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDailyProgressStore(parsed)) {
      return {};
    }
    return pruneStore(parsed);
  } catch (err) {
    console.error("Failed to parse daily progress store:", err);
    return {};
  }
}

function saveProgressStore(store: DailyProgressStore): void {
  localStorage.setItem(AZKAR_PROGRESS_KEY, JSON.stringify(pruneStore(store)));
}

function pruneStore(
  store: DailyProgressStore,
  referenceDate = new Date(),
): DailyProgressStore {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - (MAX_RETAINED_DAYS - 1));
  const cutoffKey = getLocalDateKey(cutoff);

  const pruned: DailyProgressStore = {};
  for (const [dateKey, entry] of Object.entries(store)) {
    if (dateKey >= cutoffKey) {
      pruned[dateKey] = entry;
    }
  }
  return pruned;
}

function loadTodayProgress(): DailyProgress {
  const today = getLocalDateKey();
  return loadProgressStore()[today] ?? emptyProgress();
}

function saveTodayProgress(progress: DailyProgress): void {
  const today = getLocalDateKey();
  const store = loadProgressStore();
  store[today] = progress;
  saveProgressStore(store);
}

export function addConfirmedPrayerOccurrence(key: string): void {
  const today = getLocalDateKey();
  const store = loadProgressStore();
  const todayProgress = store[today] ?? emptyProgress();
  if (!todayProgress.confirmedPrayers.includes(key)) {
    todayProgress.confirmedPrayers = [...todayProgress.confirmedPrayers, key];
  }
  store[today] = todayProgress;
  saveProgressStore(store);
}

export function getConfirmedPrayerOccurrences(): Set<string> {
  const store = loadProgressStore();
  const occurrences = new Set<string>();
  for (const progress of Object.values(store)) {
    for (const key of progress.confirmedPrayers) {
      occurrences.add(key);
    }
  }
  return occurrences;
}

function loadAzkarLayout(): AzkarLayout {
  const stored = localStorage.getItem(AZKAR_LAYOUT_KEY);
  return stored === "all" ? "all" : "single";
}

function saveAzkarLayout(layout: AzkarLayout): void {
  localStorage.setItem(AZKAR_LAYOUT_KEY, layout);
}

function loadAzkarDisplayPreferences(): AzkarDisplayPreferences {
  return parseAzkarDisplayPreferences(localStorage.getItem(AZKAR_DISPLAY_KEY));
}

function saveAzkarDisplayPreferences(
  preferences: AzkarDisplayPreferences,
): void {
  localStorage.setItem(AZKAR_DISPLAY_KEY, JSON.stringify(preferences));
}

function isDailyProgressStore(value: unknown): value is DailyProgressStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value as Record<string, unknown>).every(isDailyProgress);
}

function isDailyProgress(value: unknown): value is DailyProgress {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Partial<DailyProgress>;
  return (
    typeof record.counters === "object" &&
    record.counters !== null &&
    typeof record.completed === "object" &&
    record.completed !== null &&
    typeof record.completed.morning === "boolean" &&
    typeof record.completed.evening === "boolean" &&
    Array.isArray(record.confirmedPrayers)
  );
}

function parseAzkarPeriod(value: string | undefined): AzkarPeriod | null {
  return value === "morning" || value === "evening" ? value : null;
}

function getPeriodTitle(period: AzkarPeriod): string {
  return period === "morning" ? "Morning Azkar" : "Evening Azkar";
}

function getPeriodDescription(period: AzkarPeriod): string {
  return period === "morning"
    ? "Open the morning list and complete today's counters."
    : "Open the evening list and complete today's counters.";
}
