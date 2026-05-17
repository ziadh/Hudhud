export type AnimationState = "idle" | "alert" | "sleep" | "prayer" | "happy";
export type MainPrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface PetStatus {
  animation: AnimationState;
  bubbleText?: string;
  activePrayer?: MainPrayerName;
}

export interface PetWindowPosition {
  x: number;
  y: number;
}

export interface PetWindowPreferences {
  alwaysOnTop: boolean;
  position: PetWindowPosition | null;
}

export type CalculationMethod =
  | "auto"
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

export type AsrSchool = 0 | 1;
export type LatitudeAdjustmentMethod = "default" | 1 | 2 | 3;
export type Shafaq = "general" | "ahmer" | "abyad";
export type ThemePreference = "system" | "light" | "dark";

export interface PrayerSettings {
  city: string;
  country: string;
  state: string;
  method: CalculationMethod;
  school: AsrSchool;
  latitudeAdjustmentMethod: LatitudeAdjustmentMethod;
  shafaq: Shafaq;
  offsets: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export const ipcChannels = {
  updatePetStatus: "pet:update-status",
  confirmPrayer: "pet:confirm-prayer",
  showPetMenu: "pet:show-menu",
  movePetWindow: "pet:move-window",
  getPetAlwaysOnTop: "pet:get-always-on-top",
  setPetAlwaysOnTop: "pet:set-always-on-top",
  petAlwaysOnTopChanged: "pet:always-on-top-changed",
  getPetWindowPosition: "pet:get-window-position",
  setPetWindowPosition: "pet:set-window-position",
  showMainWindow: "app:show-main-window",
  getLaunchAtStartup: "app:get-launch-at-startup",
  setLaunchAtStartup: "app:set-launch-at-startup",
  updateState: "updates:state",
  getUpdateState: "updates:get-state",
  checkForUpdates: "updates:check",
  downloadUpdate: "updates:download",
  installUpdate: "updates:install",
  sendFeedback: "app:send-feedback",
  feedbackEnabled: "app:feedback-enabled",
  getReleaseNotes: "app:get-release-notes",
  openGithubRepo: "app:open-github-repo",
} as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion: string | null;
  downloadProgressPercent: number | null;
  errorMessage: string | null;
}

export interface FeedbackInput {
  email?: string;
  feedback: string;
}

export interface ReleaseNote {
  version: string;
  title: string;
  body: string;
  publishedAt: string | null;
  url: string;
}

export interface HudhudApi {
  isDev: boolean;
  updatePetStatus(status: PetStatus): void;
  onUpdatePetStatus(callback: (status: PetStatus) => void): () => void;
  confirmPrayer(prayer: MainPrayerName): void;
  onConfirmPrayer(callback: (prayer: MainPrayerName) => void): () => void;
  showPetMenu(): void;
  movePetWindow(deltaX: number, deltaY: number): void;
  getPetAlwaysOnTop(): Promise<boolean>;
  setPetAlwaysOnTop(enabled: boolean): Promise<boolean>;
  onPetAlwaysOnTopChanged(callback: (enabled: boolean) => void): () => void;
  showMainWindow(): void;
  getLaunchAtStartup(): Promise<boolean>;
  setLaunchAtStartup(enabled: boolean): Promise<boolean>;
  getUpdateState(): Promise<UpdateState>;
  checkForUpdates(): Promise<UpdateState>;
  downloadUpdate(): Promise<UpdateState>;
  installUpdate(): Promise<UpdateState>;
  onUpdateState(callback: (state: UpdateState) => void): () => void;
  sendFeedback(input: FeedbackInput): Promise<void>;
  isFeedbackEnabled(): Promise<boolean>;
  getReleaseNotes(): Promise<ReleaseNote[]>;
  openGithubRepo(): void;
}

declare global {
  interface Window {
    hudhud: HudhudApi;
  }
}
