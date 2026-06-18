# Hudhud — Codebase Architecture

Hudhud is an Electron desktop app that shows Islamic prayer times and drives an animated desktop pet whose behaviour reacts to the prayer schedule. There is no React or Vue — the renderer is vanilla TypeScript.

---

## Tech Stack

| Tool | Role |
|---|---|
| Electron 41 | Desktop app framework |
| TypeScript | All source files |
| Bun | Runtime, bundler, script runner |
| Biome | Linter + formatter |
| electron-updater | Auto-update via GitHub Releases |
| electron-builder | Packaging (macOS `.dmg`, Windows NSIS) |

---

## Three Electron Contexts

Electron enforces a hard split between three execution contexts. Understanding this is the most important thing for a new dev.

```
┌─────────────────────────────────────────────────────────┐
│  Main Process  (Node.js)                                │
│  src/main.ts                                            │
│  • Creates/manages windows and the system tray          │
│  • Handles all IPC messages from renderers              │
│  • Owns UpdateManager, window preferences persistence   │
└───────────────────────┬─────────────────────────────────┘
                        │  IPC (ipcMain / ipcRenderer)
        ┌───────────────┴────────────────┐
        │         src/preload.ts         │
        │  Runs in a sandboxed Node ctx  │
        │  Bridges main ↔ renderers via  │
        │  contextBridge.exposeInMainWorld│
        └───────┬────────────────┬───────┘
                │                │
  ┌─────────────▼──┐    ┌────────▼──────────┐
  │  Main Window   │    │   Pet Window      │
  │  main.html     │    │   pet.html        │
  │  build/app.js  │    │   build/pet.js    │
  │  (browser ctx) │    │  (browser ctx)    │
  └────────────────┘    └───────────────────┘
```

Both renderer contexts have `window.hudhud` injected by the preload. This is the only way they can talk to the main process or to each other.

---

## Two Windows

### Main Window (`main.html` / `src/app.ts`)

- Size: 980 × 680, fixed (not resizable)
- Contains: settings form, prayer times dashboard, update UI, feedback modal, release notes
- Shown on launch (hidden on startup launch) and when user clicks the tray or the pet

### Pet Window (`pet.html` / `src/pet.ts`)

- Size: 120 × 120, frameless, fully transparent
- Floats on the desktop; draggable by the user
- Renders a sprite sheet animation on a `<canvas>` element
- Receives status updates from the main window via IPC through main

---

## Source Directory Map

```
electron-app/
├── src/
│   ├── main.ts               Main process entry point
│   ├── preload.ts            Context bridge (exposes window.hudhud)
│   ├── types.ts              Shared types + all IPC channel names + HudhudApi interface
│   ├── update-manager.ts     electron-updater wrapper class
│   ├── window-preferences.ts Pet window position/alwaysOnTop persistence (JSON file on disk)
│   ├── theme-init.ts         Injected before page render to set theme and avoid flash
│   ├── pet.ts                Pet window renderer — animation engine + drag handling
│   ├── app.ts                Main window renderer entry (just calls init())
│   ├── dev.ts                Dev mode runner (electronmon)
│   ├── build-static.ts       Copies HTML/CSS/asset files into build/
│   └── app/
│       ├── controller.ts     Core orchestrator: init, fetchAndRender, state transitions
│       ├── controller-events.ts  All DOM event listeners (form, buttons, selects)
│       ├── controller-state.ts   UI state mutation helpers (setState, setStep, etc.)
│       ├── state.ts          Single global mutable state object (AppStateBag)
│       ├── api.ts            All external HTTP calls (Aladhan, CountriesNow)
│       ├── render.ts         HTML generation for the prayer times panel
│       ├── dom.ts            Typed references to every DOM element (querySelector calls)
│       ├── form.ts           Form read / write / validation
│       ├── location.ts       Country → state → city cascade logic
│       ├── pet-scheduler.ts  Decides pet animation state from prayer schedule (runs every 15s)
│       ├── countdown.ts      Live countdown timer for next prayer
│       ├── storage.ts        localStorage read/write for PrayerSettings
│       ├── storage-keys.ts   localStorage key constants
│       ├── theme.ts          Theme preference (system / light / dark)
│       ├── updates.ts        Renderer-side update button/UI logic
│       ├── feedback.ts       Feedback modal
│       ├── release-notes.ts  Release notes dialog
│       ├── formatters.ts     Time/date formatting utilities
│       ├── parsers.ts        Data parsing + runtime type guards
│       ├── hybrid-select.ts  Custom searchable dropdown component
│       ├── constants.ts      API URLs, prayer name lists, method options, pet timing constants
│       └── types.ts          Renderer-only types (AppState, PrayerResult, PrayerOccurrence, etc.)
├── assets/
│   ├── sprites/              Sprite sheets: idle.png, alert.png, sleep.png, prayer.png, happy.png
│   └── logo.png / 512.png
└── package.json
```

---

## IPC: How the Windows Communicate

All IPC channel names are defined in one place: `src/types.ts` → `ipcChannels`.

`preload.ts` wraps each channel into a typed method on the `HudhudApi` object and exposes it as `window.hudhud`. Both renderer pages (main window and pet window) use `window.hudhud.*` — they never call `ipcRenderer` directly.

**Pattern A — fire-and-forget** (renderer → main, no return value):
```
window.hudhud.updatePetStatus(status)
  → ipcRenderer.send("pet:update-status", status)
  → ipcMain.on("pet:update-status", ...)  in main.ts
```

**Pattern B — request/response** (renderer calls main and awaits a value):
```
await window.hudhud.getLaunchAtStartup()
  → ipcRenderer.invoke("app:get-launch-at-startup")
  → ipcMain.handle("app:get-launch-at-startup", ...)  in main.ts
```

**Pattern C — main pushes to renderer** (main initiates, renderer listens):
```
mainWindow.webContents.send("pet:update-status", status)   ← in main.ts
window.hudhud.onUpdatePetStatus(callback)                  ← in renderer
  → ipcRenderer.on("pet:update-status", listener)
```

The pet status round-trip demonstrates all three: the main window calls `updatePetStatus` (Pattern A) → main.ts receives it and calls `petWindow.webContents.send` (Pattern C) → pet.ts reacts via `onUpdatePetStatus`.

---

## Main Window: Data Flow

```
init()  [controller.ts]
  │
  ├─ loadThemePreference()  [theme.ts]
  ├─ populateMethods()      [form.ts]  — fills calculation method dropdown
  ├─ bindEvents()           [controller-events.ts]
  ├─ startPetScheduler()    [pet-scheduler.ts]
  │
  ├─ loadSettings()  [storage.ts]  — reads localStorage
  │     │
  │     ├─ null (first launch)
  │     │     └─ onboarding flow: setFormMode("onboarding"), show location step
  │     │
  │     └─ PrayerSettings found
  │           └─ fetchAndRender(settings, "configured")
  │                 │
  │                 ├─ fetchPrayerTimes(settings)  [api.ts]
  │                 │     └─ GET api.aladhan.com/v1/timingsByCity?...
  │                 │
  │                 ├─ renderDashboardHtml(result)  [render.ts]
  │                 │     └─ generates HTML → previewPane.innerHTML
  │                 │
  │                 ├─ startNextPrayerCountdown()  [countdown.ts]
  │                 └─ updatePetScheduler()        [pet-scheduler.ts]
```

Every time settings change in the form, `schedulePreview()` is called (debounced 350ms). It calls `fetchAndRender(settings, "preview")`. On save, it switches to `"configured"`.

---

## AppState Machine

The `state.currentState` field in `src/app/state.ts` drives which UI is shown:

```
empty ──────────────────────────────────────► loading
  ▲  (user picks city / changes settings)        │
  │                                              │ fetch resolves
  │                                         ┌───┴──────────────┐
  │                                         ▼                  ▼
  │                                       preview          configured
  │                                    (onboarding)        (dashboard)
  │                                         │
  │◄────────────────────────────────────────┘
  │    (user changes form in onboarding)
  │
error ◄─── any fetch failure
```

Helpers in `controller-state.ts` mutate the DOM and `state.currentState` together so they stay in sync.

---

## Pet Scheduler

`pet-scheduler.ts` runs on a 15-second interval. Each tick calls `getPetDecision()` which returns one of the five animation states based on the current time vs. the prayer schedule:

| Animation | When |
|---|---|
| `idle` | No settings configured, or between prayers with no active reminder |
| `alert` | Within 10 minutes *before* any prayer starts |
| `prayer` | After a prayer starts and user has not confirmed it yet |
| `happy` | 20 seconds after user confirms a prayer |
| `sleep` | After Isha, until 10 minutes before Fajr the next day |

When the scheduler decides on a status it calls `window.hudhud.updatePetStatus(status)`. Main.ts receives this, caches `currentPetStatus`, and forwards it to the pet window. The pet window renders the appropriate sprite animation.

**Confirming a prayer**: User right-clicks the pet → "Confirm prayed X". Main.ts sends `pet:confirm-prayer` to the main window. `confirmCurrentPrayer()` in `pet-scheduler.ts` records the occurrence key in `confirmedPrayerOccurrences` (a Set), which prevents the scheduler from showing the prayer reminder again for that occurrence.

---

## Pet Window: Sprite Animation

`src/pet.ts` is a self-contained animation engine with no dependencies on `src/app/`.

- Each animation state maps to one sprite sheet PNG (`assets/sprites/{state}.png`)
- Each sheet is a 3×2 grid of 512×512 frames (with a 4px gutter)
- `frameSequences` defines which frame indices to play for each state
- `frameCenters` defines the visual center of each frame so the character stays still while the body moves
- `requestAnimationFrame` drives the loop; frames advance every 675ms
- Non-looping states (`alert`, `happy`) transition back to `idle` when they finish

---

## Build System

```bash
bun run build
```

This runs four steps in sequence:

1. `bun x tsc` — Compiles main-process TypeScript files (`main.ts`, `preload.ts`, `update-manager.ts`, `window-preferences.ts`, `theme-init.ts`) to `build/` using `tsconfig.json` (CommonJS, Node target)

2. `bun build src/app.ts --outfile=build/app.js --target=browser --format=iife` — Bundles the entire main window renderer into a single IIFE (all of `src/app/**` is tree-shaken and inlined)

3. `bun build src/preload.ts --outfile=build/preload.js --target=node --format=cjs --external electron` — Bundles the preload script (must be CJS; `electron` is excluded since it's provided by Electron)

4. `bun src/build-static.ts` — Copies `*.html` and `*.css` source files into `build/`

**Dev mode**: `bun run dev` runs `electronmon`, which watches `build/**` and auto-restarts Electron when compiled output changes. Run `bun run watch` in a second terminal to keep TypeScript compiling incrementally.

---

## Storage

| Data | Storage | Location |
|---|---|---|
| Prayer settings (city, country, method, offsets…) | `localStorage` | Electron's userData |
| Theme preference | `localStorage` | Electron's userData |
| Confirmed prayer hint seen flag | `localStorage` | Electron's userData |
| Pet window position + alwaysOnTop | JSON file | `userData/window-preferences.json` |

`localStorage` is used because it is available in the renderer context without any Node.js involvement. The pet window preferences are stored as a file because they are written by the main process (which owns the window bounds).

---

## External APIs

| API | Used for |
|---|---|
| `api.aladhan.com/v1/timingsByCity` | Prayer times calculation |
| `countriesnow.space/api/v0.1/countries` | Country + city lists |
| `countriesnow.space/api/v0.1/countries/states` | State list (US/Canada) |
| `countriesnow.space/api/v0.1/countries/state/cities` | Cities per state |
| `api.github.com/repos/ziadh/Hudhud/releases` | Release notes |
| `n8n.ziadhussein.com/webhook/feedback` | User feedback (n8n webhook) |

All fetch calls in `api.ts` have a 15-second `AbortController` timeout. State and city lookups are cached in `stateCache` / `stateCityCache` Maps (in-memory, per session).

---

## Adding a New Feature: Checklist

1. **New type** — add to `src/types.ts` (shared) or `src/app/types.ts` (renderer-only)
2. **New IPC channel** — add a key to `ipcChannels` in `src/types.ts`, then add the handler in `src/main.ts` (`ipcMain.on` or `ipcMain.handle`) and the wrapper method in the `HudhudApi` interface + `src/preload.ts`
3. **New DOM element** — add a typed `querySelector` reference in `src/app/dom.ts`
4. **New event listener** — add it in `src/app/controller-events.ts`
5. **New UI state** — update `AppState` in `src/app/types.ts` and the handlers in `src/app/controller-state.ts`
6. **New external API call** — add to `src/app/api.ts`
