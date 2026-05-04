import type { ThemePreference } from "../types";
import { THEME_KEY } from "./constants";
import { themeButtons } from "./dom";

export function loadThemePreference(): ThemePreference {
  const saved = localStorage.getItem(THEME_KEY);
  return isThemePreference(saved) ? saved : "system";
}

export function saveThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function applyThemePreference(theme: ThemePreference): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export function syncThemeButtons(theme: ThemePreference): void {
  for (const button of themeButtons) {
    const isActive = button.dataset.themeValue === theme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

export function parseThemePreference(
  value: string | undefined,
): ThemePreference {
  return isThemePreference(value) ? value : "system";
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
