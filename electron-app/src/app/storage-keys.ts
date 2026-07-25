const DEV_PREFIX =
  typeof window !== "undefined" && window.hudhud?.isDev ? "dev:" : "";

export const SETTINGS_KEY = `${DEV_PREFIX}hudhud:prayer-settings:v1`;
export const THEME_KEY = `${DEV_PREFIX}hudhud:theme:v1`;
export const PRAYER_CONFIRM_HINT_SEEN_KEY = `${DEV_PREFIX}hudhud:prayer-confirm-hint-seen:v1`;
export const AZKAR_PROGRESS_KEY = `${DEV_PREFIX}hudhud:azkar-progress:v1`;
export const AZKAR_LAYOUT_KEY = `${DEV_PREFIX}hudhud:azkar-layout:v1`;
export const AZKAR_DISPLAY_KEY = `${DEV_PREFIX}hudhud:azkar-display:v1`;
export const AZKAR_NAVIGATION_KEY = `${DEV_PREFIX}hudhud:azkar-navigation:v1`;
