# Yrys Academy combined release candidate

Baseline: fresh `origin/main` at `f4bf6669e4176079b7ca4899b1d77a6db12bc41c`.
Branch: `release/yrys-academy`. This document describes the combined frontend
candidate; it does not authorize or record a deployment.

## Included scope and source commits

- KK/EN UI localization and translated review requests, imported chronologically
  with `cherry-pick -x`: `92cd802 fc219f1 3da824e 8cdaf3c 0551ecc 42aedd1
a0717b3 367b971 b10c369 185ed0a 588bbdc cdcba4b da55a0c 2954bd5
4758e51 366814e`. These are the tested dev revisions, rather than the old
  `3ee0126` localization tip. Approved exam surfaces keep English wording.
- Complete tested Yrys branding/theme/Yuki/palette/logo chain:
  `9877f46 f3a109e 440ba82 3c252a0 c87f266 8ac37d7 28dc3bd 10eb166
788bea6 aee711f 1547f1e 1cb5683`, selectively imported with `cherry-pick -x`.
  The equivalent main-based rebrand chain was not imported a second time.
  Blue remains `#3C82F6`; white dark-theme logos and supplied raised horizontal
  artwork retain their exact approved source pixels and crop geometry.
- Localized expired-guest entry: `e44acec`, including its expiry E2E coverage.
- Main-based domain branch `feat/yrys-domain-migration` at
  `262e03913d30b745406b19242c213edc373e2795`, merged once. Its root/generator
  domain patch is applied to the actual combined files; `LocalizedBrandHead`
  retains the new host when switching RU/KK cards. Both 1200×630 OG cards were
  regenerated from the approved source with locked Golos/Python dependencies;
  no other generated artwork changed.

All source feature branches are retained. `main`/`dev` were not merged into
one another; no dev tree copy or backend asset-retention commit is included.

## Preserved baseline and exclusions

Main-only behavior remains, including `456956b` direct return to the Full Mock
session after submission, its exact session invalidation and no auto-advance,
Writing feedback, practice hover, timezone removal, analytics and admin/guest
gates. The Full Mock completion component is byte-identical to baseline.
Conflicts retained the current shared Writing review rather than reintroducing
the old duplicate evaluator. Regression assertions remain intact; selectors
follow the approved English exam/feedback labels, and leak observers check
both Russian and English completion labels.

Excluded: whole-dev merge, adaptive-study-plan, AI timeout fix `4dfa1e4`,
unrelated backend work/assets, new features/redesign/translations and duplicate
Writing commits `becd14c 89db2b4 ee6af48` already equivalent on main.
`9c85f5f` only changes assertions for the retired intermediate completion
screen, so it is superseded by main's stronger direct-return tests and is not
imported. Translation JSON formatting changes preserve parsed data exactly.
Existing legal contact email remains `kairatovalmat2003@gmail.com`.

## Combined checks

Final results are recorded below after checking this combined checkout. These
replace prior isolated-branch limitations, not the external cutover checks.

- TypeScript: `pnpm exec tsc --noEmit` passed.
- Full ESLint: `pnpm exec eslint . --ignore-pattern '.brand-venv/**'
--ignore-pattern 'test-results/**'` passed; generated Python dependencies
  and Playwright output are excluded. Source/tests/scripts/config scan also passed.
- Scoped Prettier over changed supported files: passed.
- Production build with origin-only `VITE_API_BASE_URL` and `VITE_SITE_URL`
  both `https://ielts.yrys.academy`: passed.
- Node regression suite: **37/37 passed**.
- Critical direct-return/locked-review/Writing checks: **14/14 passed**.
- Full Playwright suite: **227/227 passed (6.0m), zero failed/skipped**,
  including **44 guest E2E**. Command: `PLAYWRIGHT_PORT=3147 pnpm exec
playwright test --reporter=line`; own free port and server from this
  checkout, `reuseExistingServer: false`.
- Initial full run had 221 passes and six stale Russian-selector failures
  in newly preserved main tests. Exact selectors now match approved English
  wording; the complete rerun above passes without relaxed assertions.
- Non-failing logs include the inherited pnpm option deprecation and React dev
  hydration warnings on denied admin routes. These did not fail the suite;
  no unrelated runtime behavior was changed to suppress them.
- Approved source/public brand artwork: byte-identical to `1cb5683`; only the
  two OG cards differ after regeneration, both visually checked at 1200×630.
- Production SSR: exact new-host OG/Twitter URLs and login `noindex` verified.
- Local browser with both unset and explicitly empty `VITE_SITE_URL`:
  `siteUrl('/blog')` resolves to the corresponding test origin plus `/app/blog`.
- App `/app/` routing/noindex, hidden blog, existing legal email and optional
  `VITE_SITE_URL` request/browser-origin fallback retained.

## External release prerequisites

Parent-reported infrastructure state: new-host DNS/proxied A and TLS with
Cloudflare strict mode are ready at the server; production images still use
the old release. Independently verify this external state at cutover.
Google OAuth authorized origins/redirects, API CORS and Turnstile host settings
must support `ielts.yrys.academy`. Rebuild frontend/backend images with the new
origin-only build variables; runtime env changes do not update baked frontend
URLs. Keep empty/unset `VITE_SITE_URL` for local/dev origin fallback.
Old-host cookies and localStorage cannot transfer; users sign in again.

Backend companion candidate: `release/yrys-academy` at
`ae71c0fa091069f1a3eb4f136f5cab35e052dac6` (parent assembled/pushed).
It includes corrected review translations `33dcd2e`, branding `946c2b9`, guest
expiry `b663730` and domain `b3f76bb`, while retaining main admin media,
backup and CI. Parent reports combined SQL and full Go test/vet/build passing
on local PostgreSQL 17. Fresh-production migrations 43/44 are fixed in that
backend candidate; repair of an existing dev database is separate work.
No live database or backend image has been deployed.

This frontend task creates no PR, performs no push and deploys nothing.
Parent independently reviews the final candidate before pushing the release.
