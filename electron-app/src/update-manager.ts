import { app, type BrowserWindow } from "electron";
import { type AppUpdater, autoUpdater } from "electron-updater";
import type { UpdateState, UpdateStatus } from "./types";
import { ipcChannels } from "./types";

export class UpdateManager {
  private status: UpdateStatus = "idle";
  private availableVersion: string | null = null;
  private downloadProgressPercent: number | null = null;
  private errorMessage: string | null = null;

  public constructor(
    private readonly getMainWindow: () => BrowserWindow | null,
    private readonly onBeforeInstall: () => void,
    private readonly updater: AppUpdater = autoUpdater,
  ) {
    this.updater.autoDownload = false;
    this.updater.autoInstallOnAppQuit = false;
    this.bindUpdaterEvents();
  }

  public getState(): UpdateState {
    return {
      status: this.status,
      currentVersion: app.getVersion(),
      availableVersion: this.availableVersion,
      downloadProgressPercent: this.downloadProgressPercent,
      errorMessage: this.errorMessage,
    };
  }

  public async checkForUpdates(): Promise<UpdateState> {
    if (!app.isPackaged || this.isBusy()) {
      return this.getState();
    }

    try {
      await this.updater.checkForUpdates();
    } catch (error) {
      this.handleError(error);
    }

    return this.getState();
  }

  public async downloadUpdate(): Promise<UpdateState> {
    if (
      !app.isPackaged ||
      this.status === "checking" ||
      this.status === "downloading" ||
      (this.status !== "available" && this.status !== "error")
    ) {
      return this.getState();
    }

    this.setState({
      status: "downloading",
      downloadProgressPercent: 0,
      errorMessage: null,
    });

    try {
      await this.updater.downloadUpdate();
    } catch (error) {
      this.setDownloadError(error);
    }

    return this.getState();
  }

  public installUpdate(): UpdateState {
    if (!app.isPackaged || this.status !== "downloaded") {
      return this.getState();
    }

    this.onBeforeInstall();
    this.updater.quitAndInstall(false, true);
    return this.getState();
  }

  private bindUpdaterEvents(): void {
    this.updater.on("checking-for-update", () => {
      this.setState({
        status: "checking",
        downloadProgressPercent: null,
        errorMessage: null,
      });
    });

    this.updater.on("update-available", (info) => {
      this.setState({
        status: "available",
        availableVersion: info.version,
        downloadProgressPercent: null,
        errorMessage: null,
      });
    });

    this.updater.on("update-not-available", () => {
      this.setState({
        status: "idle",
        availableVersion: null,
        downloadProgressPercent: null,
        errorMessage: null,
      });
    });

    this.updater.on("download-progress", (progress) => {
      this.setState({
        status: "downloading",
        downloadProgressPercent: Math.round(progress.percent),
        errorMessage: null,
      });
    });

    this.updater.on("update-downloaded", (info) => {
      this.setState({
        status: "downloaded",
        availableVersion: info.version,
        downloadProgressPercent: 100,
        errorMessage: null,
      });
    });

    this.updater.on("error", (error) => {
      this.handleError(error);
    });
  }

  private isBusy(): boolean {
    return this.status === "checking" || this.status === "downloading";
  }

  private handleError(error: unknown): void {
    if (this.status === "checking") {
      this.setState({
        status: "error",
        availableVersion: null,
        downloadProgressPercent: null,
        errorMessage:
          error instanceof Error ? error.message : "Update check failed.",
      });
      return;
    }

    if (this.status === "downloading") {
      this.setDownloadError(error);
    }
  }

  private setDownloadError(error: unknown): void {
    this.setState({
      status: "error",
      downloadProgressPercent: null,
      errorMessage:
        error instanceof Error ? error.message : "Update download failed.",
    });
  }

  private setState(next: Partial<UpdateState>): void {
    this.status = next.status ?? this.status;
    this.availableVersion =
      next.availableVersion === undefined
        ? this.availableVersion
        : next.availableVersion;
    this.downloadProgressPercent =
      next.downloadProgressPercent === undefined
        ? this.downloadProgressPercent
        : next.downloadProgressPercent;
    this.errorMessage =
      next.errorMessage === undefined ? this.errorMessage : next.errorMessage;
    this.sendState();
  }

  private sendState(): void {
    const win = this.getMainWindow();
    if (win === null || win.isDestroyed()) {
      return;
    }

    win.webContents.send(ipcChannels.updateState, this.getState());
  }
}
