import type { PrayerSettings } from "../types";
import { fetchPrayerTimes } from "./api";
import { defaultSettings } from "./constants";
import { bindEvents } from "./controller-events";
import {
  getPrimaryActionLabel,
  isPrimaryActionDisabled,
  setError,
  setFormMode,
  setState,
  setStep,
} from "./controller-state";
import {
  clearCountdown,
  setRolloverHandler,
  startNextPrayerCountdown,
} from "./countdown";
import {
  devBadge,
  launchAtStartup,
  prayerBanner,
  prayerBannerConfirm,
  prayerBannerText,
  primaryAction,
} from "./dom";
import { bindFeedbackEvents } from "./feedback";
import { fillForm, populateMethods, readFormSettings } from "./form";
import { loadCountryCityOptions } from "./location";
import {
  confirmActivePrayer,
  confirmCurrentPrayer,
  setPetStatusCallback,
  startPetScheduler,
  updatePetScheduler,
} from "./pet-scheduler";
import {
  hasFuturePrayerTarget,
  renderDashboardHtml,
  renderEmptyPreviewHtml,
  renderLoadingHtml,
  renderPreviewHtml,
} from "./render";
import { state } from "./state";
import { loadSettings, saveSettings } from "./storage";
import {
  applyThemePreference,
  loadThemePreference,
  syncThemeButtons,
} from "./theme";
import type { PrayerResult } from "./types";
import { bindUpdateEvents, loadLaunchAtStartup } from "./updates";

export async function init(): Promise<void> {
  const theme = loadThemePreference();
  applyThemePreference(theme);
  syncThemeButtons(theme);
  applyEnvironmentMarkers();
  populateMethods();
  bindEvents();
  void bindFeedbackEvents();
  bindPetEvents();
  bindUpdateEvents();
  setRolloverHandler(handleNextPrayerRollover);
  startPetScheduler();
  setState("loading");

  const saved = loadSettings();
  void loadLaunchAtStartup(saved === null);

  const loadedLocations = await loadCountryCityOptions(saved);

  if (saved === null) {
    setFormMode("onboarding");
    fillForm(defaultSettings);
    setStep("location");
    setState(loadedLocations ? "empty" : "error");
    if (!loadedLocations) {
      setError(
        "Country and city dropdowns could not be loaded. Check your connection and try again.",
      );
    }
    renderEmptyPreview();
    return;
  }

  state.activeSettings = saved;
  fillForm(saved);
  setFormMode("settings");
  setStep("calculation");
  void fetchAndRender(saved, "configured");
}

export async function fetchAndRender(
  settings: PrayerSettings,
  successState: "preview" | "configured",
): Promise<void> {
  const requestId = ++state.previewRequestId;
  setState("loading");
  renderLoading(successState);

  try {
    const result = await fetchPrayerTimes(settings);
    if (requestId !== state.previewRequestId) {
      return;
    }

    state.previewResult = result;
    state.activeSettings = settings;

    if (successState === "preview") {
      renderPreview(result);
    } else {
      renderDashboard(result);
    }

    setState(successState);
  } catch (error) {
    if (requestId !== state.previewRequestId) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not read prayer times for that location. Check the city and country, then try again.";
    setState("error");
    setError(message);
    renderEmptyPreview();
  }
}

export function schedulePreview(delay = 350): void {
  if (state.formMode !== "settings" && state.currentStep !== "calculation") {
    return;
  }

  clearScheduledPreview();
  state.previewTimer = window.setTimeout(() => {
    state.previewTimer = undefined;
    void previewSettings();
  }, delay);
}

export function clearScheduledPreview(): void {
  state.previewRequestId += 1;
  if (state.previewTimer !== undefined) {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = undefined;
  }
}

export function renderEmptyPreview(): void {
  clearCountdown();
  renderEmptyPreviewHtml();
  updatePetScheduler();
}

export function markFormDirty(): void {
  if (state.currentState === "loading") {
    return;
  }

  state.previewResult = null;
  primaryAction.textContent = getPrimaryActionLabel();
  if (state.currentState === "preview" || state.currentState === "error") {
    setState("empty");
    renderEmptyPreview();
  } else {
    primaryAction.disabled = isPrimaryActionDisabled(state.currentState);
  }
}

export async function completeSetupFromPreview(): Promise<void> {
  if (state.previewResult === null) {
    return;
  }

  if (!(await saveLaunchAtStartupPreference())) {
    return;
  }

  saveSettings(state.previewResult.settings);
  state.activeSettings = state.previewResult.settings;
  renderDashboard(state.previewResult);
  setState("configured");
}

export async function saveLaunchAtStartupPreference(): Promise<boolean> {
  try {
    const enabled = await window.hudhud.setLaunchAtStartup(
      launchAtStartup.checked,
    );
    launchAtStartup.checked = enabled;
    return true;
  } catch (err) {
    console.error("Failed to update launch-at-startup setting:", err);
    setState("error");
    setError("Launch at startup could not be updated. Try again.");
    return false;
  }
}

export function exitSettings(): void {
  if (state.previewResult !== null) {
    renderDashboard(state.previewResult);
    setState("configured");
    return;
  }

  if (state.activePrayerResult !== null) {
    renderDashboard(state.activePrayerResult);
    setState("configured");
    return;
  }

  void fetchAndRender(state.activeSettings, "configured");
}

async function previewSettings(): Promise<void> {
  const parsed = readFormSettings();
  if (!parsed.ok) {
    setState("error");
    setError(parsed.message);
    return;
  }

  await fetchAndRender(parsed.settings, "preview");
  if (state.formMode === "settings" && state.previewResult !== null) {
    saveSettings(state.previewResult.settings);
    state.activeSettings = state.previewResult.settings;
  }
}

function renderLoading(nextState: "preview" | "configured"): void {
  clearCountdown();
  renderLoadingHtml(nextState);
  updatePetScheduler();
}

function renderPreview(result: PrayerResult): void {
  renderPreviewHtml(result);
  startNextPrayerCountdown();
  updatePetScheduler();
}

function renderDashboard(result: PrayerResult): void {
  renderDashboardHtml(result);
  startNextPrayerCountdown();
  updatePetScheduler();
}

function handleNextPrayerRollover(): void {
  if (
    state.currentState === "configured" &&
    state.activePrayerResult !== null
  ) {
    if (hasFuturePrayerTarget(state.activePrayerResult, new Date())) {
      renderDashboard(state.activePrayerResult);
      return;
    }

    void fetchAndRender(state.activeSettings, "configured");
    return;
  }

  if (state.currentState === "preview" && state.previewResult !== null) {
    if (hasFuturePrayerTarget(state.previewResult, new Date())) {
      renderPreview(state.previewResult);
      return;
    }

    void fetchAndRender(state.activeSettings, "preview");
  }
}

function applyEnvironmentMarkers(): void {
  devBadge.hidden = !window.hudhud.isDev;
  document.title = window.hudhud.isDev ? "Hudhud (Dev)" : "Hudhud";
}

function bindPetEvents(): void {
  window.hudhud.onConfirmPrayer((prayer) => {
    confirmCurrentPrayer(prayer);
  });

  setPetStatusCallback((status) => {
    if (status.animation === "prayer" && status.activePrayer !== undefined) {
      prayerBannerText.textContent = `${status.activePrayer} prayer is due`;
      prayerBanner.hidden = false;
    } else {
      prayerBanner.hidden = true;
    }
  });

  prayerBannerConfirm.addEventListener("click", () => {
    confirmActivePrayer();
  });
}
