# Adaptive study plan production release validation (2026-10-30)

Base: `origin/main` at `cc07c3719dfb605729f8b9640d0c9a450f20449c`.
Branch: `feat/release-adaptive-study-plan`.

## Scope and conflict decisions

Selected commits: `7d99a65`, `ca1e955`, `2f49e5e`; no dev merge or feature
branch dependencies. Imported adaptive day/week/month planning, learning cycles,
short drills, task performance, editorial UI and progress redesign, with the
plan-task paywall and theme fixes.

Conflicts preserve the approved feature's structure and learning behavior, while
keeping main's billing/paywall core, current Yuki settings/restore/focus behavior,
theme roles and existing localization bindings. The route tree includes both
main's billing routes and the new learning routes. Existing main accessibility
labels (including Full Mock sections and Try again) were retained and old
feature test expectations were adapted to them. No public brand/domain/SEO,
shared stylesheet, locale dictionary, package/lockfile, deployment or CI files
changed. New feature copy remains the Russian copy supplied in the approved
source commits; this PR does not add a translation project.

## Dependency and release order

Release backend https://github.com/almatkai/ielts-after-cigarette-back/pull/18
first: retain billing migration 000045 and existing manual-grant configuration
(`PAYWALL_ENABLED=true`, `PAYMENT_PROVIDER=none`), apply new plan46 then
learning47, deploy backend and verify job processing and API readiness. Existing
production uses in-process workers; retain its deployment topology. Then deploy
this frontend. Frontend before backend would encounter missing study APIs.
No merge or deployment was performed during preparation.

## Commands and evidence

Run from `iac-web/`; complete logs are in `/tmp/ielts-release-validation/`.

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm lint
pnpm test:regression
pnpm build
PLAYWRIGHT_PORT=31483 pnpm exec playwright test \
  study-plan.spec.ts learning.spec.ts learning-editorial.spec.ts \
  progress-redesign.spec.ts task-performance.spec.ts \
  subjective-review-states.spec.ts yrys-theme.spec.ts public-branding.spec.ts \
  guest-trial.spec.ts post-test-review.spec.ts writing-feedback.spec.ts \
  attempt-assessment.spec.ts optimizations.spec.ts \
  --output=/tmp/ielts-release-validation/playwright-final-artifacts \
  --reporter=line
git diff --check origin/main...HEAD
```

- Frozen install: passed, with no package/lockfile diff (`frontend-install.log`).
- Final `tsc --noEmit`: passed (`frontend-typecheck-final.log`).
- Final `pnpm lint`: passed (`frontend-lint-final.log`).
- Final `pnpm test:regression`: **42 passed**, zero failures/skips
  (`frontend-regression-final.log`).
- Production `pnpm build`: passed (`frontend-build-final.log`).
- Browser coverage: **195 distinct cases have passing final results**, including
  study plan, learning/editorial, progress/task performance, paywall, assessment
  polling, guest claims/expiry, review/model-answer gating, both themes and the
  ru/kk/en brand/SEO surface matrix. The single-server combined run returned
  **194 passed / 1 failed** because its Writing comparison case still expected
  Russian toggle labels. After adapting that test to main's existing `Hide` /
  `Show` labels, the **entire Writing suite passed 12/12**. The other 183 cases
  passed in the combined run; no outstanding test failure is omitted.
  Evidence: `frontend-playwright-complete.log`, `frontend-writing-final.log`.
- Added plan-task 402 regression opens the existing paywall, retains current
  route and displays remaining free skills. Added light/dark controls regression
  checks computed selected-radio colors against theme card/foreground roles.
- Visually inspected generated desktop day-plan and tablet dark-drill screenshots.
  Browser artifacts: `/tmp/ielts-release-validation/playwright-final-artifacts/`
  and `/tmp/ielts-release-validation/playwright-writing-final-artifacts/`;
  additional plan QA screenshots in ignored `iac-web/artifact/`.
- Full `git diff --check origin/main...HEAD`: passed. Reviewed full diff and
  commit list are saved as `frontend-full.diff` and `frontend-commits.txt`.

The focused final command after the label-only test repair was:

```sh
PLAYWRIGHT_PORT=31483 pnpm exec playwright test writing-feedback.spec.ts \
  --output=/tmp/ielts-release-validation/playwright-writing-final-artifacts \
  --reporter=line
```

Initial failures are retained in the logs. The pre-existing worktree dependencies
were stale (production font package absent); frozen installation fixed the build
without changing package or lockfile. Strict feature mocks needed explicit
responses for main's existing `/billing/me` read. Two feature expectations used
old Russian labels while main retained English accessibility labels (including
the model-paragraph Hide/Show toggle); updated
tests, without reverting main UI. The first concurrent compatibility run also
had two cold-start polling timeouts; the final single-server run repeats all
six polling cases and all selected suites, with no retries or suppressed checks.

Browser tests use explicit fake API contracts, not a live production backend.
Backend database, billing, async-job/race and migration checks are documented
in its companion PR. No real payment provider, real AI service, live data or
production deployment was exercised.

XERJ index `ax-4d38e7608acf-rel1030` was blocked by the local server's 96% disk
flood-stage watermark after the old prefix required schema evolution. The index
is incomplete; exact source verification used `rg`. Logs include this local
search-tool limitation. GitHub checks/review remain required on the release PR.
