import type { PrayerSettings, UpdateState } from "../types";
import { defaultSettings } from "./constants";
import type {
  AppState,
  AzkarDisplayPreferences,
  AzkarLayout,
  AzkarPeriod,
  AzkarView,
  CountryCities,
  FormMode,
  HybridOption,
  MainTab,
  PrayerResult,
  SettingsTab,
  SetupStep,
  StateOption,
} from "./types";

export interface AppStateBag {
  currentState: AppState;
  currentMainTab: MainTab;
  currentAzkarView: AzkarView;
  currentAzkarPeriod: AzkarPeriod;
  currentAzkarLayout: AzkarLayout;
  currentAzkarEntryIndex: number;
  azkarDisplayPreferences: AzkarDisplayPreferences;
  currentStep: SetupStep;
  currentSettingsTab: SettingsTab;
  formMode: FormMode;
  activeSettings: PrayerSettings;
  previewResult: PrayerResult | null;
  activePrayerResult: PrayerResult | null;
  countryCities: CountryCities[];
  previewTimer: number | undefined;
  countdownTimer: number | undefined;
  petSchedulerTimer: number | undefined;
  happyTimeout: number | undefined;
  happyUntil: number | null;
  activePrayerOccurrenceKey: string | null;
  previewRequestId: number;
  currentUpdateState: UpdateState | null;
  settingsPreviewVisible: boolean;
  petAlwaysOnTopEnabled: boolean;
}

export const state: AppStateBag = {
  currentState: "empty",
  currentMainTab: "prayer",
  currentAzkarView: "home",
  currentAzkarPeriod: "morning",
  currentAzkarLayout: "single",
  currentAzkarEntryIndex: 0,
  azkarDisplayPreferences: {
    transliteration: true,
    translation: true,
  },
  currentStep: "location",
  currentSettingsTab: "general",
  formMode: "onboarding",
  activeSettings: {
    ...defaultSettings,
    offsets: { ...defaultSettings.offsets },
  },
  previewResult: null,
  activePrayerResult: null,
  countryCities: [],
  previewTimer: undefined,
  countdownTimer: undefined,
  petSchedulerTimer: undefined,
  happyTimeout: undefined,
  happyUntil: null,
  activePrayerOccurrenceKey: null,
  previewRequestId: 0,
  currentUpdateState: null,
  settingsPreviewVisible: false,
  petAlwaysOnTopEnabled: true,
};

export const confirmedPrayerOccurrences = new Set<string>();
export const stateCache = new Map<string, StateOption[]>();
export const stateCityCache = new Map<string, string[]>();
export const hybridOptions = new Map<HTMLInputElement, HybridOption[]>();
