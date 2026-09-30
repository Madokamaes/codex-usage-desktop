# Fork maintenance

Public fork: https://github.com/Madokamaes/codex-usage-desktop
Upstream: https://github.com/itvincent-git/codex-usage-desktop (MIT; license retained).
The primary added feature is **per-account session quota tracking / 分账号会话额度统计**.
Account filters apply to daily, monthly, model, project, and session usage. Attribution
records the account that opened newly observed sessions; earlier sessions without recorded
identity remain unknown. Live limit cards still describe the currently authenticated account.

## Automatic updates (3.8.4+)

This fork checks its own public GitHub Releases manifest in the background, then downloads,
verifies the updater signature, installs, and restarts automatically. Windows uses a quiet
current-user NSIS update; macOS replaces the app and requests restart after installation.
Successful checks are cached for 24 hours; failed checks and failed installations retry
after one hour while the app remains running. A dismissed notification does not defer updates.
The settings page retains a manual check/retry control and shows progress or failures.
Local usage databases and account assignments are retained across installations.

Old upstream release caches are cleared when switching update channels. Release notes are
optional: an unavailable GitHub API does not prevent installation from the signed feed.
The release workflow publishes latest.json only after all three platform builds succeed.
No GitHub login or access token is needed by users, and no private signing key is bundled.

Users of the original app or 3.6.1 personal build must install a fork package once: those
installed versions either point to the author or have updates disabled. Future releases
then update automatically. The existing private repository does not need to be made public.

## Publishing a release

1. Keep the updater private key backed up outside the source repository. The public key
   in src-tauri/tauri.conf.json must match the repository's TAURI_SIGNING_PRIVATE_KEY secret.
   Preserve this key across releases so existing installations can verify new packages.
2. Commit the changes and bump package.json, Cargo.toml/Cargo.lock, tauri.conf.json and
   changelog.json together (the existing pnpm release script can do the version bump).
3. Push main and the matching app-vX.Y.Z tag to Madokamaes/codex-usage-desktop.
4. GitHub Actions builds Windows x64, macOS Intel, and macOS Apple Silicon packages,
   signs updater artifacts, and publishes the completed release with latest.json.
   The app ignores a source version whose release has not finished building.

The release workflow can also be rerun using workflow_dispatch with an existing release tag.
Never put updater private keys, GitHub tokens, or local usage/auth data in Git.

Version 3.6.1 adds GPT-6.1 Sol standard API rates verified on 2026-09-30:
$2.00 input, $0.10 cached input, and $10.00 output per million tokens.
Source: https://developers.openai.com/api/docs/models/gpt-6.1-sol
Embedded rates supplement missing entries in cached and remote pricing catalogs;
existing remote rates retain priority so future pricing refreshes can update them.
Supplementing an old cache triggers the existing cost recalculation once.
Cost estimates use the app's standard token pricing; cache writes, long-context
premiums, Fast/Batch/Flex tiers, and regional processing premiums are not inferred
from aggregate Codex usage logs.

All usage entry points share a backend query cache: successful results last 15 seconds,
errors last 60 seconds. CLI fallback results (success or error) last 60 seconds. Calls queued
behind an active query reuse its result. An auth file timestamp change invalidates cached
account data; explicit quota-window activation invalidates both caches before verification.

Background commands use CREATE_NO_WINDOW on Windows and app-server uses approval policy never.
Windows personal builds hold a named mutex to prevent multiple monitoring instances.
CLI start logs include PID and executable path; logs retain three rotated files of up to 8 MiB.

Validation: cargo test --lib --offline; pnpm typecheck; pnpm test;
focused WDIO automatic-updates and pricing specs through the native Tauri app.
