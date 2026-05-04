# Changelog

All notable changes to Hudhud are documented here.

## [Unreleased]

### Added
- Open-source release: MIT license, README, CONTRIBUTING, SECURITY docs
- Content Security Policy headers on all renderer windows
- Env-configurable feedback webhook (`HUDHUD_FEEDBACK_URL`)
- `isFeedbackEnabled` IPC channel — feedback UI hides when URL is unset
- GitHub Actions CI (typecheck + lint on every push/PR)
- Settings schema migration — new fields survive across upgrades
- Single-instance enforcement via `app.requestSingleInstanceLock()`

### Changed
- IPC channel strings hoisted to a single typed constant in `types.ts`
- `sendFeedback` timestamp now uses UTC ISO 8601 instead of a manual EST offset

### Fixed
- Removed `sandbox: false` from renderer windows (restores Chromium sandbox)
- API responses validated at runtime before use

## [0.5.1] — initial public release
