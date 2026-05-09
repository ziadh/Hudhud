# Hudhud

[![Downloads](https://img.shields.io/github/downloads/ziadh/HudHud/total?label=downloads&logo=github&style=for-the-badge)](https://github.com/ziadh/Hudhud/releases)
[![License](https://img.shields.io/github/license/ziadh/HudHud?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/github/languages/top/ziadh/Hudhud?logo=typescript&style=for-the-badge)](https://github.com/ziadh/Hudhud)
[![Release](https://img.shields.io/github/v/release/ziadh/Hudhud?label=release&style=for-the-badge)](https://github.com/ziadh/Hudhud/releases/latest)

Hudhud is a desktop prayer-times app with an adorable hudhud (hoopoe) animated companion. The hudhud's job is to remind you of your prayers — right-click it to confirm each prayer on time.

It is completely free. Download from the [releases](https://github.com/ziadh/HudHud/releases) page, or build it yourself below.

![Hudhud showing a happy animation after completing a prayer](assets/demo.gif)

If you'd like a feature added, open an [issue](https://github.com/ziadh/HudHud/issues).

## Features

- Accurate prayer times via the [Aladhan API](https://aladhan.com/prayer-times-api)
- Animated desktop pet companion that lives in the corner of your screen
- Configurable calculation method, Asr school, high-latitude rule, and per-prayer minute offsets
- Auto-launch at startup
- Light / dark / system theme
- Auto-updates (signed releases only)

## Prerequisites

- [Bun](https://bun.sh) v1.0+

## Install dependencies

```bash
bun install
```

## Development

```bash
bun run dev
```

Starts Electron with hot-reload via electronmon. TypeScript is watched by `tsc --watch`; the renderer bundle rebuilds on the initial `bun run build`.

## Build

```bash
bun run build
```

Compiles TypeScript, bundles the renderer (`build/app.js`) and theme initializer (`build/theme-init.js`), and copies HTML files to `build/`.

## Package for distribution

**Windows:**

```bash
bun run dist:win
```

**macOS:**

```bash
bun run dist:mac
```


Output goes to `release/`. Releases should be code-signed (Windows) and notarized (macOS) before distribution.

## Configuration

| Environment variable   | Default                    | Description                                                                           |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `FEEDBACK_WEBHOOK_URL` | Author's feedback endpoint | Webhook URL for the in-app feedback form. Forks can override it for their own builds. |

Set this at build time or in your shell before running `bun run dev` to route feedback to a different endpoint.

## Privacy

Hudhud contacts the following third-party services:

| Service                                          | Purpose                     | Data sent                           |
| ------------------------------------------------ | --------------------------- | ----------------------------------- |
| [api.aladhan.com](https://aladhan.com)           | Prayer time calculation     | City, country, calculation settings |
| [countriesnow.space](https://countriesnow.space) | Country / city autocomplete | None (read-only lookups)            |
| `FEEDBACK_WEBHOOK_URL` endpoint                  | In-app feedback             | Email (optional) and feedback text  |

No analytics, no tracking, no account required.

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b my-feature`
2. Make your changes and commit with a clear message
3. Open a pull request — please open an issue first for large changes

## License

[MIT](LICENSE)

[![Star History Chart](https://api.star-history.com/svg?repos=ziadh/Hudhud&type=date&legend=top-left)](https://www.star-history.com/#ziadh/Hudhud&type=date&legend=top-left)
