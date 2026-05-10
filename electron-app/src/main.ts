import path from "node:path";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
} from "electron";
import { PET_ONBOARDING_BUBBLE } from "./app/constants";
import {
  ipcChannels as channels,
  type FeedbackInput,
  type MainPrayerName,
  type PetStatus,
  type PetWindowPreferences,
  type ReleaseNote,
} from "./types";
import { UpdateManager } from "./update-manager";
import {
  loadPetWindowPreferences,
  savePetWindowPreferences,
} from "./window-preferences";

const PET_WIDTH = 180;
const PET_HEIGHT = 192;
const PET_MARGIN = 24;
const FIRST_UPDATE_CHECK_DELAY_MS = 10_000;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000;
const BASE_APP_TITLE = "Hudhud";
const FEEDBACK_WEBHOOK_URL =
  process.env.FEEDBACK_WEBHOOK_URL ??
  "https://n8n.ziadhussein.com/webhook/feedback";
const GITHUB_RELEASES_API_URL =
  "https://api.github.com/repos/ziadh/Hudhud/releases";
const RELEASE_NOTES_LIMIT = 8;

let mainWindow: BrowserWindow | null = null;
let petWindow: BrowserWindow | null = null;
let _tray: Tray | null = null;
let updateManager: UpdateManager | null = null;
let isQuitting = false;
let petWindowPreferences: PetWindowPreferences | null = null;
let currentPetStatus: PetStatus = {
  animation: "idle",
  bubbleText: PET_ONBOARDING_BUBBLE,
};
let releaseNotesCache: ReleaseNote[] | null = null;

function fromDist(fileName: string): string {
  return path.join(__dirname, fileName);
}

function fromProjectRoot(...segments: string[]): string {
  return path.join(__dirname, "..", ...segments);
}

function appLogoPath(): string {
  return fromProjectRoot("assets", "logo.png");
}

function appLogo(): Electron.NativeImage {
  return nativeImage.createFromPath(appLogoPath());
}

function isDevelopment(): boolean {
  return !app.isPackaged;
}

function configureAppIdentity(): void {
  app.setName(appTitle());

  if (!isDevelopment()) {
    return;
  }

  app.setPath(
    "userData",
    path.join(app.getPath("appData"), `${BASE_APP_TITLE} Dev`),
  );
}

function configureDevelopmentCache(): void {
  if (!isDevelopment()) {
    return;
  }

  app.commandLine.appendSwitch(
    "disk-cache-dir",
    path.join(app.getPath("temp"), `hudhud-cache-${process.pid}`),
  );
}

function appTitle(): string {
  return isDevelopment() ? `${BASE_APP_TITLE} (Dev)` : BASE_APP_TITLE;
}

function isStartupLaunch(): boolean {
  return process.argv.includes("--hudhud-startup");
}

function loginItemSettingsOptions(): Electron.Settings {
  const startupArgs = process.argv
    .slice(1)
    .filter((arg) => arg !== "--hudhud-startup");

  return {
    path: process.execPath,
    args: [...startupArgs, "--hudhud-startup"],
  };
}

function getLaunchAtStartup(): boolean {
  return app.getLoginItemSettings(loginItemSettingsOptions()).openAtLogin;
}

function setLaunchAtStartup(enabled: boolean): boolean {
  app.setLoginItemSettings({
    ...loginItemSettingsOptions(),
    openAtLogin: enabled,
    openAsHidden: true,
  });

  return getLaunchAtStartup();
}

async function sendFeedback(input: FeedbackInput): Promise<void> {
  if (FEEDBACK_WEBHOOK_URL === "") {
    throw new Error("Feedback is not configured.");
  }

  if (typeof input.feedback !== "string" || input.feedback.length > 4000) {
    throw new Error("Invalid feedback.");
  }

  if (
    input.email !== undefined &&
    (typeof input.email !== "string" || input.email.length > 254)
  ) {
    throw new Error("Invalid email.");
  }

  const feedback = input.feedback.trim();
  const email = input.email?.trim();

  if (feedback === "") {
    throw new Error("Feedback is required.");
  }

  const response = await fetch(FEEDBACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email === "" ? undefined : email,
      feedback,
      date: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Feedback webhook returned ${response.status}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseReleaseNotes(input: unknown): ReleaseNote[] {
  if (!Array.isArray(input)) {
    throw new Error("GitHub releases response was not an array.");
  }

  return input
    .filter(isRecord)
    .map((release) => {
      const tagName = release.tag_name;
      const name = release.name;
      const body = release.body;
      const publishedAt = release.published_at;
      const htmlUrl = release.html_url;

      if (
        typeof tagName !== "string" ||
        typeof htmlUrl !== "string" ||
        (body !== null && body !== undefined && typeof body !== "string")
      ) {
        return null;
      }

      return {
        version: tagName,
        title: typeof name === "string" && name.trim() !== "" ? name : tagName,
        body: typeof body === "string" ? body : "",
        publishedAt: typeof publishedAt === "string" ? publishedAt : null,
        url: htmlUrl,
      };
    })
    .filter((release): release is ReleaseNote => release !== null)
    .slice(0, RELEASE_NOTES_LIMIT);
}

async function getReleaseNotes(): Promise<ReleaseNote[]> {
  if (releaseNotesCache !== null) {
    return releaseNotesCache;
  }

  const response = await fetch(GITHUB_RELEASES_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Hudhud",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub releases returned ${response.status}`);
  }

  releaseNotesCache = parseReleaseNotes(await response.json());
  return releaseNotesCache;
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 980,
    minHeight: 680,
    maxWidth: 980,
    maxHeight: 680,
    resizable: false,
    maximizable: false,
    title: appTitle(),
    icon: appLogoPath(),
    show: false,
    backgroundColor: "#07130f",
    webPreferences: {
      preload: fromDist("preload.js"),
      additionalArguments: [`--hudhud-dev=${isDevelopment() ? "1" : "0"}`],
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(fromDist("main.html"));
  window.once("ready-to-show", () => {
    if (!isStartupLaunch()) {
      window.show();
    }
  });
  window.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    window.hide();
  });
  window.on("closed", () => {
    mainWindow = null;
  });

  return window;
}

function showMainWindow(): void {
  if (mainWindow === null || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
    void updateManager?.checkForUpdates();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
  void updateManager?.checkForUpdates();
}

function createTray(): Tray {
  const icon = appLogo().resize({ width: 16, height: 16 });
  const appTray = new Tray(icon);

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Hudhud",
      click: showMainWindow,
    },
    { type: "separator" as const },
    {
      label: "Quit",
      click: (): void => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  appTray.setToolTip("Hudhud");
  appTray.setContextMenu(menu);
  appTray.on("click", showMainWindow);

  return appTray;
}

function getInitialPetBounds(): Electron.Rectangle {
  const savedPosition = getPetWindowPreferences().position;
  if (savedPosition !== null) {
    return clampPetBounds({
      ...savedPosition,
      width: PET_WIDTH,
      height: PET_HEIGHT,
    });
  }

  const { workArea } = screen.getPrimaryDisplay();

  return {
    x: workArea.x + workArea.width - PET_WIDTH - PET_MARGIN,
    y: workArea.y + workArea.height - PET_HEIGHT - PET_MARGIN,
    width: PET_WIDTH,
    height: PET_HEIGHT,
  };
}

function getPetWindowPreferences(): PetWindowPreferences {
  if (petWindowPreferences === null) {
    petWindowPreferences = loadPetWindowPreferences();
  }

  return petWindowPreferences;
}

function persistPetWindowPreferences(): void {
  savePetWindowPreferences(getPetWindowPreferences());
}

function getPetAlwaysOnTop(): boolean {
  return getPetWindowPreferences().alwaysOnTop;
}

function setPetAlwaysOnTop(enabled: boolean): boolean {
  const preferences = getPetWindowPreferences();
  preferences.alwaysOnTop = enabled;
  persistPetWindowPreferences();
  applyPetAlwaysOnTop(enabled);

  if (mainWindow !== null && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channels.petAlwaysOnTopChanged, enabled);
  }

  return preferences.alwaysOnTop;
}

function applyPetAlwaysOnTop(enabled: boolean): void {
  if (petWindow === null || petWindow.isDestroyed()) {
    return;
  }

  if (enabled) {
    petWindow.setAlwaysOnTop(true, "normal");
    return;
  }

  petWindow.setAlwaysOnTop(false);
}

function clampPetBounds(bounds: Electron.Rectangle): Electron.Rectangle {
  const workArea = getNearestDisplayWorkArea(bounds);
  const maxX = workArea.x + workArea.width - PET_WIDTH;
  const maxY = workArea.y + workArea.height - PET_HEIGHT;

  return {
    x:
      workArea.width <= PET_WIDTH
        ? workArea.x
        : Math.min(Math.max(Math.round(bounds.x), workArea.x), maxX),
    y:
      workArea.height <= PET_HEIGHT
        ? workArea.y
        : Math.min(Math.max(Math.round(bounds.y), workArea.y), maxY),
    width: PET_WIDTH,
    height: PET_HEIGHT,
  };
}

function getNearestDisplayWorkArea(
  bounds: Electron.Rectangle,
): Electron.Rectangle {
  const displays = screen.getAllDisplays();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const nearestDisplay = displays.reduce((nearest, display) => {
    const nearestCenterX = nearest.workArea.x + nearest.workArea.width / 2;
    const nearestCenterY = nearest.workArea.y + nearest.workArea.height / 2;
    const displayCenterX = display.workArea.x + display.workArea.width / 2;
    const displayCenterY = display.workArea.y + display.workArea.height / 2;
    const nearestDistance =
      (centerX - nearestCenterX) ** 2 + (centerY - nearestCenterY) ** 2;
    const displayDistance =
      (centerX - displayCenterX) ** 2 + (centerY - displayCenterY) ** 2;

    return displayDistance < nearestDistance ? display : nearest;
  }, displays[0] ?? screen.getPrimaryDisplay());

  return nearestDisplay.workArea;
}

function savePetWindowPosition(bounds: Electron.Rectangle): void {
  const preferences = getPetWindowPreferences();
  preferences.position = {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
  };
  persistPetWindowPreferences();
}

function ensurePetWindowVisible(): void {
  if (petWindow === null || petWindow.isDestroyed()) {
    return;
  }

  const bounds = petWindow.getBounds();
  const clampedBounds = clampPetBounds(bounds);
  if (bounds.x !== clampedBounds.x || bounds.y !== clampedBounds.y) {
    petWindow.setBounds(clampedBounds, false);
  }
  savePetWindowPosition(clampedBounds);
}

function createPetWindow(): BrowserWindow {
  const bounds = getInitialPetBounds();
  const preferences = getPetWindowPreferences();
  const window = new BrowserWindow({
    ...bounds,
    title: "Hudhud Pet",
    icon: appLogoPath(),
    frame: false,
    transparent: true,
    alwaysOnTop: preferences.alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: fromDist("preload.js"),
      additionalArguments: [`--hudhud-dev=${isDevelopment() ? "1" : "0"}`],
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  petWindow = window;
  applyPetAlwaysOnTop(preferences.alwaysOnTop);
  window.loadFile(fromDist("pet.html"));
  window.webContents.on("context-menu", showPetContextMenu);
  window.once("ready-to-show", () => {
    window.webContents.send(channels.updatePetStatus, currentPetStatus);
    window.showInactive();
  });
  window.on("closed", () => {
    petWindow = null;
  });

  return window;
}

function showPetContextMenu(): void {
  if (petWindow === null || petWindow.isDestroyed()) {
    return;
  }

  const menu = Menu.buildFromTemplate([
    {
      label: "Keep pet on top",
      type: "checkbox",
      checked: getPetAlwaysOnTop(),
      click: (menuItem): void => {
        setPetAlwaysOnTop(menuItem.checked);
      },
    },
    { type: "separator" as const },
    ...(currentPetStatus.animation === "prayer" &&
    currentPetStatus.activePrayer !== undefined
      ? [
          {
            label: `Confirm prayed ${currentPetStatus.activePrayer}`,
            click: (): void => {
              confirmPrayer(currentPetStatus.activePrayer);
            },
          },
          { type: "separator" as const },
        ]
      : []),
    {
      label: "Open Hudhud",
      click: (): void => {
        showMainWindow();
      },
    },
    { type: "separator" as const },
    {
      label: "Quit",
      click: (): void => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  menu.popup({ window: petWindow });
}

function confirmPrayer(prayer: MainPrayerName | undefined): void {
  if (prayer === undefined || mainWindow === null || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channels.confirmPrayer, prayer);
}

function updatePetStatus(status: PetStatus): void {
  currentPetStatus = status;

  if (petWindow === null || petWindow.isDestroyed()) {
    return;
  }

  petWindow.webContents.send(channels.updatePetStatus, status);
}

function movePetWindow(deltaX: number, deltaY: number): void {
  if (petWindow === null || petWindow.isDestroyed()) {
    return;
  }

  const bounds = petWindow.getBounds();
  const clampedBounds = clampPetBounds({
    ...bounds,
    x: bounds.x + deltaX,
    y: bounds.y + deltaY,
  });
  petWindow.setBounds(clampedBounds, false);
  savePetWindowPosition(clampedBounds);
}

configureDevelopmentCache();
configureAppIdentity();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    updateManager = new UpdateManager(
      () => mainWindow,
      () => {
        isQuitting = true;
      },
    );

    ipcMain.on(channels.showPetMenu, showPetContextMenu);
    ipcMain.on(channels.showMainWindow, showMainWindow);
    ipcMain.on(channels.updatePetStatus, (_event, status: PetStatus) => {
      updatePetStatus(status);
    });
    ipcMain.on(
      channels.movePetWindow,
      (_event, deltaX: number, deltaY: number) => {
        movePetWindow(deltaX, deltaY);
      },
    );
    ipcMain.handle(channels.getLaunchAtStartup, () => getLaunchAtStartup());
    ipcMain.handle(channels.setLaunchAtStartup, (_event, enabled: boolean) =>
      setLaunchAtStartup(enabled),
    );
    ipcMain.handle(channels.getPetAlwaysOnTop, () => getPetAlwaysOnTop());
    ipcMain.handle(channels.setPetAlwaysOnTop, (_event, enabled: boolean) =>
      setPetAlwaysOnTop(enabled),
    );
    ipcMain.handle(channels.getUpdateState, () => updateManager?.getState());
    ipcMain.handle(channels.checkForUpdates, () =>
      updateManager?.checkForUpdates(),
    );
    ipcMain.handle(channels.downloadUpdate, () =>
      updateManager?.downloadUpdate(),
    );
    ipcMain.handle(channels.installUpdate, () =>
      updateManager?.installUpdate(),
    );
    ipcMain.handle(channels.sendFeedback, (_event, input: FeedbackInput) =>
      sendFeedback(input),
    );
    ipcMain.handle(channels.feedbackEnabled, () => FEEDBACK_WEBHOOK_URL !== "");
    ipcMain.handle(channels.getReleaseNotes, () => getReleaseNotes());

    mainWindow = createMainWindow();
    petWindow = createPetWindow();
    _tray = createTray();

    screen.on("display-added", ensurePetWindowVisible);
    screen.on("display-removed", ensurePetWindowVisible);
    screen.on("display-metrics-changed", ensurePetWindowVisible);

    setTimeout(() => {
      void updateManager?.checkForUpdates();
    }, FIRST_UPDATE_CHECK_DELAY_MS);
    setInterval(() => {
      void updateManager?.checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);

    app.on("activate", () => {
      if (mainWindow === null || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow();
      } else {
        showMainWindow();
      }

      if (petWindow === null || petWindow.isDestroyed()) {
        petWindow = createPetWindow();
      }

      void updateManager?.checkForUpdates();
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin" && isQuitting) {
      app.quit();
    }
  });
}
