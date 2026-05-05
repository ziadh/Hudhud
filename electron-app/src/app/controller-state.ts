import {
  backAction,
  calculationStep,
  calculationStepChip,
  countrySelect,
  form,
  formError,
  formTitle,
  generalStep,
  layout,
  locationStep,
  locationStepChip,
  primaryAction,
  resetAction,
  settingsBackAction,
  settingsPreviewToggle,
  settingsPreviewToggleRow,
  settingsTabButtons,
  settingsTabs,
} from "./dom";
import { parseSettingsTab } from "./parsers";
import { state } from "./state";
import type { AppState, FormMode, SettingsTab, SetupStep } from "./types";

export function setState(next: AppState): void {
  state.currentState = next;
  layout.classList.toggle("dashboard", next === "configured");
  updateSettingsPreviewVisibility();
  primaryAction.disabled = isPrimaryActionDisabled(next);
  resetAction.disabled = next === "loading";
  settingsBackAction.disabled = next === "loading";
  backAction.disabled =
    next === "loading" ||
    (state.formMode !== "settings" && state.currentStep === "location");
  primaryAction.textContent = getPrimaryActionLabel();

  if (next !== "error") {
    setError("");
  }
}

export function setFormMode(mode: FormMode): void {
  state.formMode = mode;
  if (mode === "settings") {
    state.settingsPreviewVisible = false;
  }
  formTitle.textContent =
    mode === "onboarding" ? "Prayer Times Setup" : "Prayer Time Settings";
  form.classList.toggle("settings-mode", mode === "settings");
  settingsBackAction.hidden = mode !== "settings";
  resetAction.hidden = mode !== "settings";
  primaryAction.hidden = mode === "settings";
  settingsTabs.hidden = mode !== "settings";
  updateSettingsPreviewVisibility();
  if (mode === "settings") {
    setSettingsTab(state.currentSettingsTab);
  } else {
    setStep(state.currentStep);
  }
}

export function setStep(step: SetupStep): void {
  state.currentStep = step;
  const isSettingsMode = state.formMode === "settings";
  if (isSettingsMode) {
    state.currentSettingsTab = step;
  }

  locationStep.classList.toggle("active", step === "location");
  calculationStep.classList.toggle("active", step === "calculation");
  generalStep.classList.remove("active");
  locationStepChip.classList.toggle("active", step === "location");
  calculationStepChip.classList.toggle("active", step === "calculation");
  locationStepChip.parentElement?.toggleAttribute("hidden", isSettingsMode);
  updateSettingsTabs();
  updateSettingsPreviewVisibility();
  backAction.hidden = isSettingsMode || step === "location";
  primaryAction.textContent = getPrimaryActionLabel();
  primaryAction.disabled = isPrimaryActionDisabled(state.currentState);
}

export function setSettingsTab(tab: SettingsTab): void {
  if (state.formMode !== "settings") {
    return;
  }

  state.currentSettingsTab = tab;

  if (tab === "general") {
    locationStep.classList.remove("active");
    calculationStep.classList.remove("active");
    generalStep.classList.add("active");
    locationStepChip.parentElement?.toggleAttribute("hidden", true);
    backAction.hidden = true;
    primaryAction.textContent = getPrimaryActionLabel();
    primaryAction.disabled = isPrimaryActionDisabled(state.currentState);
    updateSettingsTabs();
    updateSettingsPreviewVisibility();
    return;
  }

  setStep(tab);
}

export function updateSettingsTabs(): void {
  for (const button of settingsTabButtons) {
    const tab = parseSettingsTab(button.dataset.settingsTab ?? "");
    const isActive = tab === state.currentSettingsTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  }
}

export function updateSettingsPreviewVisibility(): void {
  const canShowToggle =
    state.formMode === "settings" &&
    (state.currentSettingsTab === "location" ||
      state.currentSettingsTab === "calculation");
  const shouldShowPreview = canShowToggle && state.settingsPreviewVisible;
  settingsPreviewToggleRow.hidden = !canShowToggle;
  settingsPreviewToggle.checked = state.settingsPreviewVisible;
  layout.classList.toggle(
    "settings-preview-hidden",
    state.formMode === "settings" &&
      state.currentState !== "configured" &&
      !shouldShowPreview,
  );
  layout.classList.toggle(
    "settings-preview-visible",
    state.currentState !== "configured" && shouldShowPreview,
  );
}

export function setError(message: string): void {
  formError.textContent = message;
  formError.classList.toggle("visible", message !== "");
}

export function getPrimaryActionLabel(): string {
  if (state.formMode === "settings") {
    return "Save settings";
  }

  if (state.currentStep === "location") {
    return "Continue";
  }

  return "Save settings";
}

export function isPrimaryActionDisabled(next: AppState): boolean {
  if (next === "loading") {
    return true;
  }

  if (state.formMode === "settings") {
    return countrySelect.disabled;
  }

  if (state.currentStep === "location") {
    return countrySelect.disabled;
  }

  return state.previewResult === null || next !== "preview";
}
