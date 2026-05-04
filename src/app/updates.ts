import type { UpdateState } from "../types";
import { appVersion, launchAtStartup, updateAction } from "./dom";
import { state } from "./state";

export function bindUpdateEvents(): void {
  window.hudhud.onUpdateState((next) => {
    renderUpdateState(next);
  });

  void window.hudhud.getUpdateState().then((next) => {
    renderUpdateState(next);
  });
  void window.hudhud.checkForUpdates().then((next) => {
    renderUpdateState(next);
  });
}

export async function handleUpdateAction(): Promise<void> {
  if (state.currentUpdateState === null) {
    return;
  }

  if (state.currentUpdateState.status === "available") {
    renderUpdateState(await window.hudhud.downloadUpdate());
  } else if (state.currentUpdateState.status === "downloaded") {
    renderUpdateState(await window.hudhud.installUpdate());
  } else if (state.currentUpdateState.status === "error") {
    if (state.currentUpdateState.availableVersion !== null) {
      renderUpdateState(await window.hudhud.downloadUpdate());
    } else {
      renderUpdateState(await window.hudhud.checkForUpdates());
    }
  }
}

export function renderUpdateState(next: UpdateState): void {
  state.currentUpdateState = next;
  appVersion.textContent = `v${next.currentVersion}`;
  appVersion.hidden = false;
  updateAction.hidden = false;
  updateAction.className = "update-action";
  updateAction.style.removeProperty("--update-progress");
  updateAction.title = "";

  if (next.status === "available") {
    updateAction.textContent = `v${next.availableVersion ?? "update"} available`;
    updateAction.dataset.updateStatus = "available";
    updateAction.title = "Download update";
  } else if (next.status === "downloading") {
    const progress = next.downloadProgressPercent ?? 0;
    updateAction.textContent = `Downloading ${progress}%`;
    updateAction.dataset.updateStatus = "downloading";
    updateAction.style.setProperty("--update-progress", `${progress}%`);
    updateAction.disabled = true;
    updateAction.title = "Downloading update";
    return;
  } else if (next.status === "downloaded") {
    updateAction.textContent = "Install & Restart";
    updateAction.dataset.updateStatus = "downloaded";
    updateAction.title = "Install downloaded update";
  } else if (next.status === "error") {
    updateAction.textContent = "Retry update";
    updateAction.dataset.updateStatus = "error";
    updateAction.title = next.errorMessage ?? "Update failed";
  } else {
    updateAction.hidden = true;
    updateAction.removeAttribute("data-update-status");
  }

  updateAction.disabled = false;
}

export async function loadLaunchAtStartup(
  defaultEnabled: boolean,
): Promise<void> {
  if (defaultEnabled) {
    launchAtStartup.checked = true;
    return;
  }

  try {
    launchAtStartup.checked = await window.hudhud.getLaunchAtStartup();
  } catch (err) {
    console.error("Failed to load launch-at-startup setting:", err);
    launchAtStartup.checked = defaultEnabled;
  }
}
