# Deployment

How SpendlyAI ships to Google Play. **Android only, bare React Native, no EAS/Expo.** Release artifacts are built by Gradle and delivered to Google Play via the Play Developer API from CI. There is no Fastlane/EAS layer — everything is Gradle + the Play Developer API + a service account.

## At a glance

| Trigger | What CI does | Uploads? |
| --- | --- | --- |
| PR → `main` | `./gradlew bundleRelease` as a build check | No |
| Merge to `main` | Build the signed AAB, upload to the **internal testing** track | Yes → internal only |
| Production release | **Manual** promotion internal → production in the Play Console | Never from CI |

Implemented by:

- `.github/workflows/android-pr-check.yml` — the PR build check.
- `.github/workflows/android-release.yml` — the merge-to-main internal upload.
- `android/app/build.gradle` — release signing config and versioning, all read from environment variables.

Hard rules:

- **CI never publishes to production.** Promotion from internal testing to production is always a manual step by a human in the Play Console.
- **The keystore is never committed.** It is supplied to CI as a secret and materialized only at build time.
- **All config lives in secrets, never in the repo.** The repo carries only a `.env.example` template documenting the required names.
- **The first AAB for a new app must be uploaded manually** through the Play Console before CI can upload subsequent releases via the API.

## Release artifact

The release artifact is a **signed Android App Bundle (AAB)** produced by Gradle:

```bash
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`.

`android/app/build.gradle` reads the keystore path and credentials from environment variables (`SPENDLY_UPLOAD_STORE_FILE`, `SPENDLY_UPLOAD_STORE_PASSWORD`, `SPENDLY_UPLOAD_KEY_ALIAS`, `SPENDLY_UPLOAD_KEY_PASSWORD`) — nothing is hard-coded. When `SPENDLY_UPLOAD_STORE_FILE` is unset, the release build falls back to debug signing so a local `bundleRelease` still succeeds; those artifacts are **not** distributable. We ship an AAB (not an APK) because Google Play requires it; Play re-signs with the app-signing key and generates per-device APKs.

## Signing keystore

- The upload keystore is a `.jks`/`.keystore` file that **must never be committed** — it is gitignored and lives outside the repo.
- In CI it is provided as a **base64-encoded secret**, decoded to a temporary file at build time, and deleted with the workspace after the job.
- The keystore password, key alias, and key password are separate secrets, never in the repo.
- **Back up the keystore securely.** Losing the upload key means you must contact Google Play support to reset it; losing the app-signing key (if you opted out of Play App Signing) is unrecoverable. We use Play App Signing — Google holds the app-signing key; we only manage the upload key.

## Versioning

`versionCode` **increments on every release build** — the Play Store rejects an upload whose `versionCode` is less than or equal to an existing one on any track.

- `versionCode` (integer, machine-facing): the release workflow computes it as `github.run_number + VERSION_CODE_OFFSET`. `github.run_number` is monotonic across runs of that workflow; the offset (default `1000`, overridable via the `VERSION_CODE_OFFSET` repository variable) keeps CI codes above the manually-uploaded bootstrap build (`versionCode 1`). `build.gradle` reads it from the `SPENDLY_VERSION_CODE` env var (falling back to `1` for local builds).
- `versionName` (human-facing string, e.g. `1.4.0`): managed in `android/app/build.gradle` (`versionName "1.0"`), overridable via `SPENDLY_VERSION_NAME`. It may repeat across builds and does not affect upload acceptance.

Never reuse a `versionCode`, even for a build that was never promoted to production — internal-track uploads consume version codes too. Note: **re-running** a release workflow run reuses its `run_number` and therefore its `versionCode`; if you need to re-ship, merge a new commit (new run) rather than re-running.

## CI pipeline

### PR → `main` (check only)

On every pull request targeting `main` (`android-pr-check.yml`), CI:

1. Sets up Node 22 and JDK 17, installs deps with `npm ci`.
2. Decodes the upload keystore from secrets.
3. Builds the signed release bundle **for a single ABI**: `./gradlew bundleRelease` with `ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a`.

Limiting the PR check to `arm64-v8a` is deliberate: the job only needs to prove the app compiles and signs — it never ships to Play. Building all four ABIs makes the native CMake/C++ compile run 3–4× longer for no benefit on a check. The release workflow builds all ABIs so real testers get a working app on any device.

This validates that the release build compiles and signs, but **does not upload anything**. It is a required status check, not a deploy. (Note: `pull_request` runs from forks do not receive secrets, so the signing step would fail there — this repo's PRs come from same-repo branches.)

### Merge to `main` (deploy to internal)

When a PR merges to `main` (`android-release.yml`, on `push` to `main`), CI:

1. Computes `versionCode` (`github.run_number + VERSION_CODE_OFFSET`).
2. Builds the signed AAB for **all ABIs** with `./gradlew bundleRelease` (keystore materialized from secrets).
3. Uploads the AAB to the **internal testing track** (`track: internal`, `status: completed`) via the Play Developer API, using the `r0adkll/upload-google-play` action authenticated with the service-account JSON. The action is pinned to a commit SHA (supply-chain hardening).
4. Leaves the release on the internal track — no promotion, no staged rollout to production.

Testers on the internal track get the build; nothing reaches production. The workflow uses `concurrency` to prevent overlapping releases and never cancels an in-flight upload.

### Internal → production (manual only)

Promotion to production is **always a manual action** in the Google Play Console:

1. Verify the internal build (QA, smoke test).
2. In the Play Console, promote the internal release to Production (or create a Production release from the reviewed build).
3. Configure the staged-rollout percentage and release notes there.

CI has no code path that writes to the production track.

## Google Play API access (service account)

CI authenticates to the Play Developer API with a **Google Cloud service account**:

1. In Google Cloud, create a service account and a JSON key.
2. In the Play Console → **Users and permissions**, invite the service account email and grant it access limited to this app with **release to testing tracks** permission (it does **not** need production-release permission — production is manual).
3. Store the JSON key as a CI secret (see below). CI uses it to authenticate uploads to the internal track.

Least privilege: the service account should not hold "Release to production" — that keeps the "CI never publishes to production" rule enforced by permissions, not just by convention.

## First upload (bootstrap)

The Play Developer API **cannot create an app or upload the very first bundle** — a new app/package has no existing release for the API to attach to. So:

1. Build the AAB locally (or download it from the PR-check artifact): `./gradlew bundleRelease`.
2. In the Play Console, create the app, then upload this **first AAB manually** to a track (e.g. internal testing) and complete the required store-listing/app-content steps.
3. Once the app exists and has a first release, CI can upload subsequent builds via the API.

This bootstrap is a one-time step per app/package name.

## Configuration & secrets

**No deployment config lives in the repo.** All of it is provided as CI secrets (and, for local release builds, via a gitignored `.env` derived from `.env.example`). The repo contains only `.env.example` as the template of required names.

Required **GitHub Actions repository secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded upload keystore, decoded to a file at build time |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias within the keystore |
| `ANDROID_KEY_PASSWORD` | Password for the key alias |
| `PLAY_SERVICE_ACCOUNT_JSON` | Service-account JSON key (full file contents) for the Play Developer API |

Optional **repository variable** (Actions → Variables): `VERSION_CODE_OFFSET` (defaults to `1000`).

The package name (`com.spendlyai`) is not secret — it's set as an env var in `android-release.yml`, not a secret.

The workflow maps those secrets onto the Gradle-facing env vars (`SPENDLY_UPLOAD_STORE_FILE`, `SPENDLY_UPLOAD_STORE_PASSWORD`, `SPENDLY_UPLOAD_KEY_ALIAS`, `SPENDLY_UPLOAD_KEY_PASSWORD`, `SPENDLY_VERSION_CODE`) that `build.gradle` reads. For a **local** release build, export those `SPENDLY_*` vars yourself. `.env.example` documents all of this.

Setting the secrets with the `gh` CLI:

```bash
gh secret set ANDROID_KEYSTORE_BASE64 < <(base64 -i upload-keystore.jks)
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS
gh secret set ANDROID_KEY_PASSWORD
gh secret set PLAY_SERVICE_ACCOUNT_JSON < play-service-account.json
```

Keep `.env.example` in sync whenever a new deployment variable is introduced. Never commit real values — `.env`, `*.keystore`/`*.jks`, and the service-account JSON are all gitignored.

## Runbook

- **Ship a normal release:** open a PR (CI builds the AAB as a check) → merge to `main` (CI uploads to internal) → verify on the internal track → manually promote to production in the Play Console.
- **New app / first ever release:** build the AAB, create the app in the Play Console, upload the first AAB manually, then let CI take over.
- **Rejected upload ("version code already used"):** bump `versionCode` and rebuild — never reuse a code.
- **Production hotfix:** same flow — CI still only reaches internal; a human promotes to production.
