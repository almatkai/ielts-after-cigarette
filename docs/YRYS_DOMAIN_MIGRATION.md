# Production domain integration

Target topology: `https://ielts.yrys.academy/` landing, `/app/` app,
`/api/v1/*` Go API. The app retains Vite/Nitro/router `/app` bases.
The API build value is the origin only: the client appends `/api/v1`.

The parent saved and CLI re-read GitHub **production** variables
`VITE_API_BASE_URL` and `VITE_SITE_URL`, both `https://ielts.yrys.academy`.
Rebuild with these values during the authorized release. Docker accepts
`VITE_SITE_URL` as a build argument; changing a running container's environment is insufficient.
An empty/unset `VITE_SITE_URL` uses the request/browser origin for local and dev
builds. Do not set the development Environment to the production origin.
`ielts.woolet.cc` and the separate GlitchTip host remain unchanged.

The complete staged cutover, owners, external prerequisites, old-host transition
and rollback are in **`ielts_landing/docs/YRYS_DOMAIN_MIGRATION.md`** in the
landing repository. Current parent-observed external status is below; image
release and browser auth verification remain pending. The domain change needs
no secret/client rotation or database migration by itself. The combined backend
release requires corrected migrations 43/44 only at its authorized deployment.
Old-domain cookies/localStorage do not cross domains.

## Combined release status

`release/yrys-academy` integrates this main-based branch with the selected
localized Yrys rebrand. The three domain replacements from
`docs/rebrand-domain.patch` are already applied to the actual combined root
and generator; do not apply that patch again. `LocalizedBrandHead` preserves
the new absolute host while choosing the RU/KK card after hydration.

Both 1200×630 cards were regenerated with the locked Golos and Python
dependencies and visually checked. The generator changed only the hostname
in the cards; approved source artwork, geometry, icons and manifest remain
unchanged. Combined verification and the exact source commit inventory are
recorded in `docs/RELEASE_YRYS_ACADEMY.md`; those checks replace the earlier
isolated domain-branch verification limits.

The app keeps relative `/app/` navigation, noindex app routes and the hidden
public blog. Production still requires the landing cutover/runbook and new
frontend/backend image builds. No deployment is performed by this branch.

## External status supplied by the parent, 2026-10-24

These are parent observations made before this SEO follow-up, not external
checks performed by this executor:

- GitHub production frontend `VITE_API_BASE_URL` and `VITE_SITE_URL`, and
  landing `PUBLIC_API_BASE_URL`, were saved and CLI re-read as
  `https://ielts.yrys.academy`.
- The existing Google web client's new origin, exact new-host callback
  `https://ielts.yrys.academy/api/v1/auth/google` and authorized domain
  `yrys.academy` are set. Consent now says **Yrys Academy** and uses the approved
  landing `public/brand/yrys-mark-512.png`. Homepage is
  `https://ielts.yrys.academy/`, privacy is
  `https://ielts.yrys.academy/app/privacy`, terms are
  `https://ielts.yrys.academy/app/terms`. The parent saved, reloaded and verified
  these settings in Arc. Existing client IDs, secrets, scopes and Testing
  publishing status are unchanged; old-host access remains.
- Backend runtime/GitHub CORS and both the existing production Turnstile widget
  and backend hostname allowlist retain **both old and new hosts**. No keys
  were rotated. Keep coexistence settings through rollback/drain.
- DNS/TLS with Cloudflare Full (strict) and the new vhost are active. The asset
  loop is fixed live and in landing `7755670`. Product images still use the old
  release; no code image has been deployed for this release.
- Parent read-only production SQL observed version **42**, `dirty=false` on
  2026-10-24. Fresh corrected migrations **43/44** are for the later authorized
  backend release deployment; do not apply them during this cleanup.
- Real Google login and a real Turnstile challenge have **not** been completed.
  External settings are not proof of working auth or new-host search indexing.

The SEO follow-up adds canonical links to `/app/privacy` and `/app/terms` via
existing `siteUrl`, retaining production pinning and request/browser origin
fallback. Local SSR/hydration verification is recorded in the release record.
No runtime/dashboard, migration, live database, main/dev merge, PR or deployment
operation belongs to this cleanup. Only release-branch commits/pushes are
within its authorization. Localization/AI feedback language changes are
separate work; this follow-up adds no English landing or new translations.
