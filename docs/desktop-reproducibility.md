# Desktop launcher reproducibility — 2026-11-04

The previous personal launcher embedded one user's project and nvm paths. It was not portable. The repository now includes a macOS app creator (`npm run desktop:mac`), a background service launcher, service cleanup handling and a brand-icon generator using Node's built-in modules. Generated apps remain machine-specific and should not be committed or distributed.

Verified on this Mac, using a clean temporary source copy with no .env, node_modules, dist or generated artifacts. Both checkout and output paths included spaces and an apostrophe:

- `npm ci`: succeeded, 0 reported vulnerabilities at test time.
- `npm test`: 19 passed.
- `npm run build`: succeeded.
- `npm run desktop:mac -- <temporary output>`: app created and signature verified.
- Decompiled generated AppleScript, executed its exact shell command: correctly reached the relocated launcher and reused the existing local service.
- Re-ran creation at the same generated destination: succeeded.
- Actual Desktop app regenerated with new brand icon and code signature verification passed.

Limits of this verification: this was an isolated source directory on the same Mac, not another physical machine or OS. An existing local service was reused for the launcher command check; a cold background startup and real microphone permission flow were not exercised in this audit. The app requires Node, dependencies and the source folder to remain installed. It currently supports macOS only. API keys and account credits are user-supplied and not included. Public notarized app distribution is not implemented. Port conflicts intentionally stop with an error; they do not terminate unrelated processes.

History belongs to the browser origin/profile, not the app bundle. A newly opened session starts empty; existing notes remain in the same browser's History.

## Cross-platform CI follow-up

GitHub Actions run 41800425607 passed on Windows, macOS and Linux: npm ci, all22 tests and npm run build. The macOS runner also successfully created the desktop app. These are automated build/runtime-adapter checks, not real microphone/browser recognition or classroom acoustic tests.
