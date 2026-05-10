import { contextBridge, ipcRenderer } from "electron";
import {
  ipcChannels as channels,
  type FeedbackInput,
  type HudhudApi,
  type MainPrayerName,
  type PetStatus,
  type UpdateState,
} from "./types";

const api: HudhudApi = {
  isDev: process.argv.includes("--hudhud-dev=1"),
  updatePetStatus(status) {
    ipcRenderer.send(channels.updatePetStatus, status);
  },
  onUpdatePetStatus(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      status: PetStatus,
    ): void => {
      callback(status);
    };

    ipcRenderer.on(channels.updatePetStatus, listener);

    return () => {
      ipcRenderer.removeListener(channels.updatePetStatus, listener);
    };
  },
  confirmPrayer(prayer) {
    ipcRenderer.send(channels.confirmPrayer, prayer);
  },
  onConfirmPrayer(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      prayer: MainPrayerName,
    ): void => {
      callback(prayer);
    };

    ipcRenderer.on(channels.confirmPrayer, listener);

    return () => {
      ipcRenderer.removeListener(channels.confirmPrayer, listener);
    };
  },
  showPetMenu() {
    ipcRenderer.send(channels.showPetMenu);
  },
  movePetWindow(deltaX, deltaY) {
    ipcRenderer.send(channels.movePetWindow, deltaX, deltaY);
  },
  getPetAlwaysOnTop() {
    return ipcRenderer.invoke(channels.getPetAlwaysOnTop) as Promise<boolean>;
  },
  setPetAlwaysOnTop(enabled) {
    return ipcRenderer.invoke(
      channels.setPetAlwaysOnTop,
      enabled,
    ) as Promise<boolean>;
  },
  onPetAlwaysOnTopChanged(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      enabled: boolean,
    ): void => {
      callback(enabled);
    };

    ipcRenderer.on(channels.petAlwaysOnTopChanged, listener);

    return () => {
      ipcRenderer.removeListener(channels.petAlwaysOnTopChanged, listener);
    };
  },
  showMainWindow() {
    ipcRenderer.send(channels.showMainWindow);
  },
  getLaunchAtStartup() {
    return ipcRenderer.invoke(channels.getLaunchAtStartup) as Promise<boolean>;
  },
  setLaunchAtStartup(enabled) {
    return ipcRenderer.invoke(
      channels.setLaunchAtStartup,
      enabled,
    ) as Promise<boolean>;
  },
  getUpdateState() {
    return ipcRenderer.invoke(channels.getUpdateState) as Promise<UpdateState>;
  },
  checkForUpdates() {
    return ipcRenderer.invoke(channels.checkForUpdates) as Promise<UpdateState>;
  },
  downloadUpdate() {
    return ipcRenderer.invoke(channels.downloadUpdate) as Promise<UpdateState>;
  },
  installUpdate() {
    return ipcRenderer.invoke(channels.installUpdate) as Promise<UpdateState>;
  },
  sendFeedback(input: FeedbackInput) {
    return ipcRenderer.invoke(channels.sendFeedback, input) as Promise<void>;
  },
  isFeedbackEnabled() {
    return ipcRenderer.invoke(channels.feedbackEnabled) as Promise<boolean>;
  },
  onUpdateState(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: UpdateState,
    ): void => {
      callback(state);
    };

    ipcRenderer.on(channels.updateState, listener);

    return () => {
      ipcRenderer.removeListener(channels.updateState, listener);
    };
  },
};

contextBridge.exposeInMainWorld("hudhud", api);
