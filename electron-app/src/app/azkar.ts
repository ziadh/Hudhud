import { azkarEntries } from "./azkar-data";
import { azkarBackAction, azkarList, azkarToolbar } from "./dom";
import { escapeHtml } from "./formatters";
import { state } from "./state";
import { AZKAR_LAYOUT_KEY, AZKAR_PROGRESS_KEY } from "./storage-keys";
import type { AzkarEntry, AzkarLayout, AzkarPeriod, AzkarProgress } from "./types";

const emptyProgress = (date: string): AzkarProgress => ({
  date,
  counters: {},
  completed: {
    morning: false,
    evening: false,
  },
});

export function bindAzkarEvents(): void {
  azkarBackAction.addEventListener("click", showAzkarHome);

  azkarList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
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

    const layoutButton = target.closest<HTMLButtonElement>("[data-azkar-layout]");
    if (layoutButton !== null) {
      const layout = layoutButton.dataset.azkarLayout;
      if (layout === "single" || layout === "all") {
        state.currentAzkarLayout = layout;
        saveAzkarLayout(layout);
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
  const progress = loadAzkarProgress();
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
  azkarToolbar.hidden = false;
  azkarBackAction.hidden = true;
  azkarToolbar.style.visibility = "visible";
  const progress = loadAzkarProgress();
  azkarList.innerHTML = `
    <div class="azkar-home-cards">
      ${renderPeriodCard("morning", progress)}
      ${renderPeriodCard("evening", progress)}
    </div>
  `;
}

function renderPeriodCard(
  period: AzkarPeriod,
  progress: AzkarProgress,
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
  azkarToolbar.hidden = true;
  azkarBackAction.hidden = true;
  const progress = loadAzkarProgress();
  const entries = getEntriesForPeriod(state.currentAzkarPeriod);
  const completedCount = getCompletedCount(entries, progress);
  const totalCount = entries.length;
  const isPeriodComplete = totalCount > 0 && completedCount === totalCount;
  const layout = state.currentAzkarLayout;

  if (progress.completed[state.currentAzkarPeriod] !== isPeriodComplete) {
    progress.completed[state.currentAzkarPeriod] = isPeriodComplete;
    saveAzkarProgress(progress);
  }

  const cards =
    layout === "single"
      ? renderSingleCard(entries, progress)
      : entries.map((entry) => renderEntry(entry, progress)).join("");

  azkarList.innerHTML = `
    <div class="azkar-summary">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="azkar-back-action azkar-back-summary" type="button"
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
        <div class="azkar-layout-toggle" role="group" aria-label="View mode">
          ${renderLayoutButton("single", layout)}
          ${renderLayoutButton("all", layout)}
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
  `;

  const backButton = azkarList.querySelector<HTMLButtonElement>(
    ".azkar-back-summary",
  );
  if (backButton !== null) {
    backButton.addEventListener("click", showAzkarHome);
  }
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
  progress: AzkarProgress,
): string {
  const current = entries.find(
    (entry) => getEntryCount(progress, entry) < entry.repeat,
  );
  if (current === undefined) {
    return "";
  }
  return renderEntry(current, progress);
}

function renderEntry(entry: AzkarEntry, progress: AzkarProgress): string {
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
      <div class="azkar-card-header">
        <span>${escapeHtml(entry.reference)}</span>
        <span>${entry.repeat}x</span>
      </div>
      <p class="azkar-arabic" lang="ar" dir="rtl">${escapeHtml(entry.arabic)}</p>
      <button class="button ${isComplete ? "secondary" : "primary"} azkar-counter" type="button" data-azkar-entry="${escapeHtml(entry.id)}">
        ${escapeHtml(buttonLabel)}
      </button>
    </article>
  `;
}

function incrementCounter(entry: AzkarEntry): void {
  const progress = loadAzkarProgress();
  const current = getEntryCount(progress, entry);
  if (current >= entry.repeat) {
    return;
  }

  progress.counters[entry.id] = current + 1;
  saveAzkarProgress(progress);
  renderAzkar();
  window.dispatchEvent(new CustomEvent("azkar:progress-changed"));
}

function getCompletedCount(
  entries: readonly AzkarEntry[],
  progress: AzkarProgress,
): number {
  return entries.filter(
    (entry) => getEntryCount(progress, entry) >= entry.repeat,
  ).length;
}

function getEntryCount(progress: AzkarProgress, entry: AzkarEntry): number {
  return Math.min(progress.counters[entry.id] ?? 0, entry.repeat);
}

function getEntry(id: string): AzkarEntry | null {
  return azkarEntries.find((entry) => entry.id === id) ?? null;
}

function getEntriesForPeriod(period: AzkarPeriod): readonly AzkarEntry[] {
  return azkarEntries.filter((entry) => entry.period === period);
}

function loadAzkarProgress(): AzkarProgress {
  const today = getLocalDateKey();
  const raw = localStorage.getItem(AZKAR_PROGRESS_KEY);
  if (raw === null) {
    return emptyProgress(today);
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAzkarProgress(parsed) || parsed.date !== today) {
      return emptyProgress(today);
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse azkar progress:", err);
    return emptyProgress(today);
  }
}

function saveAzkarProgress(progress: AzkarProgress): void {
  localStorage.setItem(AZKAR_PROGRESS_KEY, JSON.stringify(progress));
}

function loadAzkarLayout(): AzkarLayout {
  const stored = localStorage.getItem(AZKAR_LAYOUT_KEY);
  return stored === "all" ? "all" : "single";
}

function saveAzkarLayout(layout: AzkarLayout): void {
  localStorage.setItem(AZKAR_LAYOUT_KEY, layout);
}

function isAzkarProgress(value: unknown): value is AzkarProgress {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Partial<AzkarProgress>;
  return (
    typeof record.date === "string" &&
    typeof record.counters === "object" &&
    record.counters !== null &&
    typeof record.completed === "object" &&
    record.completed !== null &&
    typeof record.completed.morning === "boolean" &&
    typeof record.completed.evening === "boolean"
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
