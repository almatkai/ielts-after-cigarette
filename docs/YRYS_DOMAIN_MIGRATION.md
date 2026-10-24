# Production domain integration

Target topology: `https://ielts.yrys.academy/` landing, `/app/` app,
`/api/v1/*` Go API. The app retains Vite/Nitro/router `/app` bases.
The API build value is the origin only: the client appends `/api/v1`.

Set GitHub **production** variables `VITE_API_BASE_URL` and `VITE_SITE_URL`
to `https://ielts.yrys.academy`, then rebuild. Docker accepts `VITE_SITE_URL`
as a build argument; changing a running container's environment is insufficient.
An empty/unset `VITE_SITE_URL` uses the request/browser origin for local and dev
builds. Do not set the development Environment to the production origin.
`ielts.woolet.cc` and the separate GlitchTip host remain unchanged.

The complete staged cutover, owners, external prerequisites, old-host transition
and rollback are in **`ielts_landing/docs/YRYS_DOMAIN_MIGRATION.md`** in the
landing repository. DNS, certificates, Google/Turnstile consoles and release
are still external work. No database migration or secret/client rotation is
needed; old-domain cookies/localStorage do not cross domains.

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
