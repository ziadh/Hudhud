export function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

export const form = query<HTMLFormElement>("#settings-form");
export const appVersion = query<HTMLElement>("#app-version");
export const devBadge = query<HTMLElement>("#dev-badge");
export const updateAction = query<HTMLButtonElement>("#update-action");
export const layout = query<HTMLElement>(".layout");
export const previewPane = query<HTMLElement>("#preview-pane");
export const formError = query<HTMLElement>("#form-error");
export const formTitle = query<HTMLElement>("#form-title");
export const settingsBackAction = query<HTMLButtonElement>(
  "#settings-back-action",
);
export const settingsPreviewToggleRow = query<HTMLElement>(
  "#settings-preview-toggle-row",
);
export const settingsPreviewToggle = query<HTMLInputElement>(
  "#settings-preview-toggle",
);
export const primaryAction = query<HTMLButtonElement>("#primary-action");
export const backAction = query<HTMLButtonElement>("#back-action");
export const resetAction = query<HTMLButtonElement>("#reset-action");
export const resetConfirmDialog = query<HTMLDialogElement>(
  "#reset-confirm-dialog",
);
export const resetConfirmAction = query<HTMLButtonElement>(
  "#reset-confirm-action",
);
export const resetCancelAction = query<HTMLButtonElement>(
  "#reset-cancel-action",
);
export const locationStep = query<HTMLElement>("#location-step");
export const calculationStep = query<HTMLElement>("#calculation-step");
export const generalStep = query<HTMLElement>("#general-step");
export const locationStepChip = query<HTMLElement>("#location-step-chip");
export const calculationStepChip = query<HTMLElement>("#calculation-step-chip");
export const settingsTabs = query<HTMLElement>(".settings-tabs");
export const settingsTabButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-settings-tab]"),
);
export const cityField = query<HTMLElement>("#city-field");
export const stateField = query<HTMLElement>("#state-field");
export const citySelect = query<HTMLInputElement>("#city-select");
export const countrySelect = query<HTMLInputElement>("#country-select");
export const stateSelect = query<HTMLInputElement>("#state-select");
export const cityHint = query<HTMLElement>("#city-hint");
export const methodSelect = query<HTMLInputElement>("#method-select");
export const latitudeSelect = query<HTMLInputElement>("#latitude-select");
export const shafaqSelect = query<HTMLInputElement>("#shafaq-select");
export const countryOptions = query<HTMLDataListElement>("#country-options");
export const stateOptions = query<HTMLDataListElement>("#state-options");
export const cityOptions = query<HTMLDataListElement>("#city-options");
export const methodDataOptions = query<HTMLDataListElement>("#method-options");
export const latitudeDataOptions =
  query<HTMLDataListElement>("#latitude-options");
export const shafaqDataOptions = query<HTMLDataListElement>("#shafaq-options");
export const offsetFajr = query<HTMLInputElement>("#offset-fajr");
export const offsetDhuhr = query<HTMLInputElement>("#offset-dhuhr");
export const offsetAsr = query<HTMLInputElement>("#offset-asr");
export const offsetMaghrib = query<HTMLInputElement>("#offset-maghrib");
export const offsetIsha = query<HTMLInputElement>("#offset-isha");
export const launchAtStartup = query<HTMLInputElement>("#launch-at-startup");
export const petAlwaysOnTop = query<HTMLInputElement>("#pet-always-on-top");
export const feedbackToggle = query<HTMLButtonElement>("#feedback-toggle");
export const feedbackPanel = query<HTMLElement>("#feedback-panel");
export const feedbackClose = query<HTMLButtonElement>("#feedback-close");
export const feedbackForm = query<HTMLFormElement>("#feedback-form");
export const feedbackEmail = query<HTMLInputElement>("#feedback-email");
export const feedbackMessage = query<HTMLTextAreaElement>("#feedback-message");
export const feedbackStatus = query<HTMLElement>("#feedback-status");
export const feedbackSubmit = query<HTMLButtonElement>("#feedback-submit");
export const releaseNotesAction = query<HTMLButtonElement>(
  "#release-notes-action",
);
export const releaseNotesDialog = query<HTMLDialogElement>(
  "#release-notes-dialog",
);
export const releaseNotesClose = query<HTMLButtonElement>(
  "#release-notes-close",
);
export const releaseNotesStatus = query<HTMLElement>("#release-notes-status");
export const releaseNotesList = query<HTMLElement>("#release-notes-list");
export const schoolButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-school]"),
);
export const themeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-theme-value]"),
);
export const prayerBanner = query<HTMLElement>("#prayer-banner");
export const prayerBannerText = query<HTMLElement>("#prayer-banner-text");
export const prayerBannerConfirm = query<HTMLButtonElement>(
  "#prayer-banner-confirm",
);
