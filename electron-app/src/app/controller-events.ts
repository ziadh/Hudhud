import { defaultSettings } from "./constants";
import {
  PRAYER_CONFIRM_HINT_SEEN_KEY,
  SETTINGS_KEY,
} from "./storage-keys";
import {
  clearScheduledPreview,
  completeSetupFromPreview,
  exitSettings,
  fetchAndRender,
  markFormDirty,
  renderEmptyPreview,
  saveLaunchAtStartupPreference,
  schedulePreview,
} from "./controller";
import {
  setError,
  setFormMode,
  setSettingsTab,
  setState,
  setStep,
  updateSettingsPreviewVisibility,
} from "./controller-state";
import {
  backAction,
  citySelect,
  countrySelect,
  form,
  latitudeSelect,
  launchAtStartup,
  methodSelect,
  offsetAsr,
  offsetDhuhr,
  offsetFajr,
  offsetIsha,
  offsetMaghrib,
  previewPane,
  resetAction,
  resetCancelAction,
  resetConfirmAction,
  resetConfirmDialog,
  schoolButtons,
  settingsBackAction,
  settingsPreviewToggle,
  settingsTabButtons,
  shafaqSelect,
  stateSelect,
  themeButtons,
  updateAction,
} from "./dom";
import {
  fillForm,
  setSchool,
  updateShafaqAvailability,
  validateLocationStep,
} from "./form";
import { applyCountrySelection, applyStateSelection } from "./location";
import { parseSchool, parseSettingsTab } from "./parsers";
import { clearHappyTimeout } from "./pet-scheduler";
import { confirmedPrayerOccurrences, state } from "./state";
import {
  applyThemePreference,
  parseThemePreference,
  saveThemePreference,
  syncThemeButtons,
} from "./theme";
import { handleUpdateAction } from "./updates";

export function bindEvents(): void {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.formMode === "settings") {
      return;
    }

    if (state.currentStep === "location") {
      const locationValidation = validateLocationStep();
      if (!locationValidation.ok) {
        setState("error");
        setError(locationValidation.message);
        return;
      }

      setStep("calculation");
      setState("empty");
      renderEmptyPreview();
      schedulePreview(0);
      return;
    }

    if (state.currentState === "preview" && state.previewResult !== null) {
      void completeSetupFromPreview();
      return;
    }
  });

  resetAction.addEventListener("click", () => {
    resetConfirmDialog.showModal();
  });

  resetCancelAction.addEventListener("click", () => {
    resetConfirmDialog.close();
  });

  resetConfirmAction.addEventListener("click", () => {
    resetConfirmDialog.close();
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(PRAYER_CONFIRM_HINT_SEEN_KEY);
    state.previewResult = null;
    state.activePrayerResult = null;
    state.happyUntil = null;
    state.activePrayerOccurrenceKey = null;
    confirmedPrayerOccurrences.clear();
    clearHappyTimeout();
    state.activeSettings = {
      ...defaultSettings,
      offsets: { ...defaultSettings.offsets },
    };
    setFormMode("onboarding");
    fillForm(state.activeSettings);
    setStep("location");
    setState("empty");
    renderEmptyPreview();
  });

  backAction.addEventListener("click", () => {
    clearScheduledPreview();

    if (state.formMode === "settings") {
      exitSettings();
      return;
    }

    setStep("location");
    setState("empty");
    renderEmptyPreview();
  });

  settingsBackAction.addEventListener("click", () => {
    clearScheduledPreview();
    exitSettings();
  });

  settingsPreviewToggle.addEventListener("change", () => {
    state.settingsPreviewVisible = settingsPreviewToggle.checked;
    updateSettingsPreviewVisibility();

    if (
      state.settingsPreviewVisible &&
      (state.currentSettingsTab === "location" ||
        state.currentSettingsTab === "calculation") &&
      state.previewResult === null
    ) {
      renderEmptyPreview();
      schedulePreview(0);
    }
  });

  countrySelect.addEventListener("input", () => {
    void handleCountryChange();
  });

  stateSelect.addEventListener("input", () => {
    void handleStateChange();
  });

  methodSelect.addEventListener("input", () => {
    updateShafaqAvailability();
    handleCalculationChange();
  });

  for (const button of schoolButtons) {
    button.addEventListener("click", () => {
      const school = parseSchool(button.dataset.school ?? "0");
      setSchool(school);
      handleCalculationChange();
    });
  }

  for (const button of settingsTabButtons) {
    button.addEventListener("click", () => {
      const tab = parseSettingsTab(button.dataset.settingsTab ?? "");
      if (tab !== null) {
        setSettingsTab(tab);
      }
    });
  }

  for (const button of themeButtons) {
    button.addEventListener("click", () => {
      const theme = parseThemePreference(button.dataset.themeValue);
      applyThemePreference(theme);
      saveThemePreference(theme);
      syncThemeButtons(theme);
    });
  }

  for (const element of [citySelect]) {
    element.addEventListener("input", handleLocationChange);
    element.addEventListener("change", handleLocationChange);
  }

  for (const element of [
    latitudeSelect,
    shafaqSelect,
    offsetFajr,
    offsetDhuhr,
    offsetAsr,
    offsetMaghrib,
    offsetIsha,
  ]) {
    element.addEventListener("input", handleCalculationChange);
    element.addEventListener("change", handleCalculationChange);
  }

  launchAtStartup.addEventListener("change", () => {
    if (state.formMode === "settings") {
      void saveLaunchAtStartupPreference();
      return;
    }

    markFormDirty();
  });

  previewPane.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionButton = target.closest<HTMLButtonElement>("[data-action]");
    const action = actionButton?.dataset.action;
    if (action === "edit") {
      state.currentSettingsTab = "general";
      state.settingsPreviewVisible = false;
      setFormMode("settings");
      fillForm(state.activeSettings);
      setState("empty");
      renderEmptyPreview();
    } else if (action === "refresh") {
      void fetchAndRender(state.activeSettings, "configured");
    }
  });

  updateAction.addEventListener("click", () => {
    void handleUpdateAction();
  });
}

async function handleCountryChange(): Promise<void> {
  await applyCountrySelection();
  handleLocationChange();
}

async function handleStateChange(): Promise<void> {
  await applyStateSelection();
  handleLocationChange();
}

function handleLocationChange(): void {
  markFormDirty();

  if (state.formMode === "settings") {
    schedulePreview();
  }
}

function handleCalculationChange(): void {
  if (state.formMode !== "settings" && state.currentStep !== "calculation") {
    return;
  }

  markFormDirty();
  schedulePreview();
}
