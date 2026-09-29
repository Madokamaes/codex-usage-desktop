# Personal build maintenance

This build retains the per-account usage changes and disables upstream application updates.
Both UI and native update commands are disabled; the updater feed list is empty. Cached update
notifications are discarded, and the settings page labels the personal build explicitly.
Pricing refreshes and usage/reset data are independent and remain available.

All usage entry points share a backend query cache: successful results last 15 seconds,
errors last 60 seconds. CLI fallback results (success or error) last 60 seconds. Calls queued
behind an active query reuse its result. An auth file timestamp change invalidates cached
account data; explicit quota-window activation invalidates both caches before verification.

Background commands use CREATE_NO_WINDOW on Windows and app-server uses approval policy never.
Windows personal builds hold a named mutex to prevent multiple monitoring instances.
CLI start logs include PID and executable path; logs retain three rotated files of up to 8 MiB.

The upstream update system is polling GitHub Releases, not push: release.yml builds signed
artifacts and uploads latest.json; the client fetches that manifest and release notes.
No separate update server is required by that workflow.

Validation: cargo test --lib --offline; pnpm typecheck; focused Vitest; WDIO personal-build spec.

Verified on 2026-09-29: 140 Rust tests, TypeScript checks, 45 Vitest tests, and two real Tauri/WDIO checks passed. The native checks reject upstream update discovery/install and verify the disabled settings button plus stale notification removal.
